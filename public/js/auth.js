// API Basis-URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:10000` 
    : '';

// Session-Management
// Zentraler Auth-Status mit Getter für bessere Kapselung
let _isAuthenticated = false;

// Öffentliche Funktion, um den Auth-Status zu prüfen
function isAuthenticated() {
    return _isAuthenticated;
}

// Überprüft, ob der Benutzer angemeldet ist und handelt entsprechend
// Nutzt explizit den neuen /api/session-status Endpunkt
async function checkAuthStatus(redirectOnFail = true) {
    // Debugausgabe: URL identifizieren
    console.log(`Prüfe Auth-Status. Aktuelle Seite: ${window.location.pathname}`);
    
    try {
        // Verwenden des speziellen Session-Status-Endpunkts statt /api/locations
        const response = await fetch(`${API_URL}/api/session-status`, {
            method: 'GET',
            credentials: 'include' // Wichtig für Cookie-Übertragung
        });
        
        const data = await response.json();
        console.log('Session-Status-Antwort:', data);
        
        if (response.ok && data.authenticated) {
            console.log('✅ Session gültig - Benutzer authentifiziert');
            _isAuthenticated = true;
            
            // Wenn auf Login-Seite oder Startseite, weiterleiten zur Karte
            if (window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname === '') {
                console.log('Weiterleitung zur map.html...');
                window.location.href = 'map.html';
            }
            return true;
        } else {
            console.log('❌ Session ungültig - Benutzer nicht authentifiziert');
            _isAuthenticated = false;
            
            // Nur umleiten, wenn wir nicht auf der Login-Seite sind und Redirect gewünscht ist
            if (redirectOnFail && !window.location.pathname.includes('login.html')) {
                console.log('Weiterleitung zur login.html wegen ungültiger Session...');
                showGlobalMessage('Bitte melde dich an, um fortzufahren.', 'info');
                
                // Kleine Verzögerung bei der Umleitung, damit die Nachricht gesehen werden kann
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }
            return false;
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Auth-Status:', error);
        _isAuthenticated = false;
        
        // Bei Fehlern zur Login-Seite leiten, aber nur wenn gewünscht und nicht bereits auf Login-Seite
        if (redirectOnFail && !window.location.pathname.includes('login.html')) {
            console.log('Weiterleitung zur login.html wegen Netzwerkfehler...');
            showGlobalMessage('Verbindungsfehler. Bitte erneut anmelden.', 'error');
            
            // Kleine Verzögerung bei der Umleitung
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
        return false;
    }
}

// Prüft periodisch den Auth-Status, um abgelaufene Sessions zu erkennen
function startAuthStatusMonitor(intervalMs = 60000) {
    // Initial prüfen
    checkAuthStatus(true);
    
    // In regelmäßigen Abständen prüfen
    return setInterval(() => {
        // Nur prüfen, wenn wir nicht auf der Login-Seite sind
        if (!window.location.pathname.includes('login.html')) {
            checkAuthStatus(true);
        }
    }, intervalMs);
}

// Login-Funktion
async function login(accessCode) {
    try {
        console.log('Login-Versuch mit Zugangscode...');
        
        // Klare Logging-Ausgabe vor dem Serveraufruf
        console.log(`API-Endpunkt für Login: ${API_URL}/verify-access`);
        
        const response = await fetch(`${API_URL}/verify-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Wichtig für Cookie-Speicherung
            body: JSON.stringify({ accessCode })
        });
        
        // Cookie-Debugging (nur Präsenz prüfen, nicht den Wert auslesen)
        const hasCookies = document.cookie.length > 0;
        console.log(`Hat der Browser allgemeine Cookies? ${hasCookies ? 'Ja' : 'Nein'}`);
        console.log(`Cookie-Debug: HTTP-only Cookies sind nicht über JavaScript auslesbar`);
        
        const data = await response.json();
        console.log('Login-Server-Antwort:', data);
        
        if (response.ok && !data.error) {
            console.log('✅ Login erfolgreich - Session erstellt');
            
            // Kleine Verzögerung, um sicherzustellen, dass die Session gespeichert wurde
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Überprüfung über den Session-Status-Endpunkt
            const sessionCheckResponse = await fetch(`${API_URL}/api/session-status`, {
                method: 'GET',
                credentials: 'include' // Wichtig für Cookie-Übertragung
            });
            
            const sessionData = await sessionCheckResponse.json();
            console.log('Session-Validierung nach Login:', sessionData);
            
            if (sessionCheckResponse.ok && sessionData.authenticated) {
                console.log('✅ Session erfolgreich validiert');
                _isAuthenticated = true;
                
                // Lokale Storage-Markierung (ohne sensible Daten)
                // Hilft bei der Erkennung, ob ein Benutzer angemeldet war
                localStorage.setItem('session_initialized', 'true');
                
                return { 
                    success: true, 
                    message: 'Erfolgreich angemeldet!', 
                    redirect: 'map.html' 
                };
            } else {
                console.error('❌ Session-Validierung fehlgeschlagen nach Login');
                return { 
                    success: false, 
                    message: 'Login erfolgreich, aber Session konnte nicht validiert werden. Bitte erneut versuchen.' 
                };
            }
        } else {
            console.log('❌ Login fehlgeschlagen:', data.message);
            return { success: false, message: data.message || 'Ungültiger Zugangscode.' };
        }
    } catch (error) {
        console.error('Login-Fehler:', error);
        return { success: false, message: `Fehler bei der Anmeldung: ${error.message}` };
    }
}

// Logout-Funktion
async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && !data.error) {
            _isAuthenticated = false;
            // Weiterleitung zur Login-Seite mit Bestätigungsmeldung
            showGlobalMessage('Erfolgreich abgemeldet.', 'success');
            window.location.href = 'login.html';
            return true;
        } else {
            showGlobalMessage(data.message || 'Fehler beim Abmelden.', 'error');
            console.error('Logout-Fehler:', data.message);
            return false;
        }
    } catch (error) {
        showGlobalMessage(`Fehler beim Abmelden: ${error.message}`, 'error');
        console.error('Logout-Fehler:', error);
        return false;
    }
}

// Globale Feedback-/Statusanzeige
let messageTimeoutId = null;

// Zeigt eine Nachricht im globalen Nachrichtenbereich an
function showGlobalMessage(message, type = 'info', duration = 3000) {
    // Nachrichtencontainer suchen oder erstellen
    let messageContainer = document.getElementById('global-message-container');
    
    // Container erstellen, falls er noch nicht existiert
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'global-message-container';
        messageContainer.style.position = 'fixed';
        messageContainer.style.top = '20px';
        messageContainer.style.left = '50%';
        messageContainer.style.transform = 'translateX(-50%)';
        messageContainer.style.zIndex = '9999';
        messageContainer.style.transition = 'opacity 0.3s ease-in-out';
        messageContainer.style.opacity = '0';
        document.body.appendChild(messageContainer);
    }
    
    // Nachrichtentyp-Klasse definieren
    const typeClass = type === 'error' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 
                     type === 'warning' ? 'alert-warning' : 'alert-info';
    
    // Nachrichteninhalt setzen
    messageContainer.innerHTML = `
        <div class="alert ${typeClass} shadow-sm" role="alert">
            ${message}
            <button type="button" class="btn-close btn-sm" aria-label="Close"></button>
        </div>
    `;
    
    // Schließen-Button-Event
    const closeButton = messageContainer.querySelector('.btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            messageContainer.style.opacity = '0';
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 300);
        });
    }
    
    // Nachricht anzeigen
    messageContainer.style.display = 'block';
    setTimeout(() => {
        messageContainer.style.opacity = '1';
    }, 10);
    
    // Bestehenden Timeout löschen
    if (messageTimeoutId) {
        clearTimeout(messageTimeoutId);
    }
    
    // Automatisches Ausblenden nach Dauer
    if (duration > 0) {
        messageTimeoutId = setTimeout(() => {
            messageContainer.style.opacity = '0';
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 300);
        }, duration);
    }
    
    return messageContainer;
}

// Initialisiert das Login-Formular
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const accessCodeInput = document.getElementById('access-code');
    const feedbackEl = document.getElementById('login-feedback');
    
    console.log('Login-Formular wird initialisiert');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            console.log('Login-Formular wurde abgeschickt');
            const accessCode = accessCodeInput.value.trim();
            if (!accessCode) {
                showFeedback(feedbackEl, 'Bitte gib einen Zugangscode ein.', 'error');
                return;
            }
            
            // Login-Button deaktivieren und Ladeanimation anzeigen
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Anmelden...';
            
            try {
                console.log('Login-Prozess wird gestartet...');
                const result = await login(accessCode);
                
                if (result.success) {
                    console.log('✅ Login war erfolgreich - UI wird aktualisiert');
                    showFeedback(feedbackEl, result.message, 'success');
                    
                    // Globale Nachricht für die Weiterleitung
                    showGlobalMessage('Login erfolgreich! Du wirst weitergeleitet...', 'success');
                    
                    // Nach kurzer Verzögerung zur Map-Seite weiterleiten
                    console.log(`Weiterleitung zu ${result.redirect} in 1 Sekunde...`);
                    setTimeout(() => {
                        window.location.href = result.redirect || 'map.html';
                    }, 1000);
                } else {
                    console.log('❌ Login fehlgeschlagen:', result.message);
                    showFeedback(feedbackEl, result.message, 'error');
                    
                    // Zugangscode leeren und Fokus zurücksetzen
                    accessCodeInput.value = '';
                    accessCodeInput.focus();
                }
            } catch (error) {
                console.error('Unerwarteter Fehler beim Login:', error);
                showFeedback(feedbackEl, `Ein Fehler ist aufgetreten: ${error.message}`, 'error');
            } finally {
                // Button wieder aktivieren
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        });
    } else {
        console.log('Login-Formular nicht gefunden auf dieser Seite');
    }
}

// Zeigt Feedback-Nachrichten in Formularen an
function showFeedback(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = type === 'error' 
        ? 'alert alert-danger mt-3' 
        : 'alert alert-success mt-3';
    element.style.display = 'block';
}

// Initialisiert die Auth-Komponente
function initAuth() {
    console.log('Auth-System wird initialisiert...');
    
    // Login-Formular initialisieren
    initLoginForm();
    
    // Logout-Button initialisieren
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Seitenspezifischer Code
    const isLoginPage = window.location.pathname.includes('login.html');
    const isMapPage = window.location.pathname.includes('map.html');
    
    if (isLoginPage) {
        console.log('Auf Login-Seite - prüfe, ob Benutzer bereits angemeldet ist');
        
        // Bei Login-Seite: Prüfen, ob Benutzer bereits angemeldet ist
        // Falls ja, zur Map-Seite weiterleiten
        fetch(`${API_URL}/api/session-status`, {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                console.log('Benutzer bereits angemeldet - Weiterleitung zur map.html');
                window.location.href = 'map.html';
            } else {
                console.log('Benutzer nicht angemeldet - Login-Formular bleibt aktiv');
            }
        })
        .catch(error => {
            console.error('Fehler bei der Session-Prüfung auf der Login-Seite:', error);
        });
    } 
    else if (isMapPage) {
        console.log('Auf map.html - führe Session-Validierung durch');
        
        // Bei Map-Seite: Session überprüfen, aber mit Fehlertoleranz
        fetch(`${API_URL}/api/session-status`, {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Session-Prüfung auf map.html:', data);
            
            if (data.authenticated) {
                console.log('✅ Gültige Session auf map.html bestätigt');
                _isAuthenticated = true;
                
                // Regelmäßige Prüfung nur starten, wenn die Session gültig ist
                // Verhindert mehrfache Intervalle
                startAuthStatusMonitor(120000);
            } else {
                console.log('❌ Ungültige Session auf map.html erkannt');
                
                // Freundliche Nachricht mit Button anzeigen, statt automatisch umzuleiten
                const msgContainer = document.createElement('div');
                msgContainer.className = 'session-expired-overlay';
                msgContainer.innerHTML = `
                    <div class="session-message-box">
                        <h3>Deine Sitzung ist abgelaufen</h3>
                        <p>Bitte melde dich erneut an, um auf die Karte zuzugreifen.</p>
                        <button class="btn btn-primary" id="login-redirect-btn">Zur Anmeldung</button>
                    </div>
                `;
                document.body.appendChild(msgContainer);
                
                // Styling für Overlay
                const style = document.createElement('style');
                style.textContent = `
                    .session-expired-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0,0,0,0.8);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .session-message-box {
                        background: var(--bs-dark);
                        border: 1px solid var(--bs-secondary);
                        padding: 2rem;
                        border-radius: 0.5rem;
                        max-width: 90%;
                        width: 400px;
                        text-align: center;
                    }
                `;
                document.head.appendChild(style);
                
                // Event-Handler für den Button
                document.getElementById('login-redirect-btn').addEventListener('click', () => {
                    window.location.href = 'login.html';
                });
            }
        })
        .catch(error => {
            console.error('Fehler bei der Session-Prüfung:', error);
            // Bei Netzwerkfehlern keine Umleitung erzwingen
            _isAuthenticated = false;
            showGlobalMessage('Verbindungsprobleme bei der Session-Prüfung.', 'warning');
        });
    }
    else {
        // Auf anderen Seiten standardmäßig Auth-Status prüfen und Monitor starten
        checkAuthStatus();
        startAuthStatusMonitor(120000);
    }
}

// Event-Listener für Seiten-Laden
document.addEventListener('DOMContentLoaded', () => {
    // Auth-Komponente initialisieren
    initAuth();
});