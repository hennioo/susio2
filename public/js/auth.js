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
async function checkAuthStatus(redirectOnFail = true) {
    try {
        const response = await fetch(`${API_URL}/api/locations`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            _isAuthenticated = true;
            
            // Wenn auf Login-Seite, weiterleiten zur Karte
            if (window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname === '') {
                window.location.href = 'map.html';
            }
            return true;
        } else {
            _isAuthenticated = false;
            
            // Wenn nicht auf Login-Seite und Redirect gewünscht, zur Login-Seite weiterleiten
            if (redirectOnFail && !window.location.pathname.includes('login.html')) {
                showGlobalMessage('Bitte melde dich an, um fortzufahren.', 'info');
                window.location.href = 'login.html';
            }
            return false;
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Auth-Status:', error);
        _isAuthenticated = false;
        
        // Bei Fehlern zur Login-Seite leiten
        if (redirectOnFail && !window.location.pathname.includes('login.html')) {
            showGlobalMessage('Verbindungsfehler. Bitte erneut anmelden.', 'error');
            window.location.href = 'login.html';
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
        const response = await fetch(`${API_URL}/verify-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ accessCode })
        });
        
        const data = await response.json();
        
        if (response.ok && !data.error) {
            _isAuthenticated = true;
            return { success: true, message: 'Erfolgreich angemeldet!' };
        } else {
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
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
            
            const result = await login(accessCode);
            
            // Button wieder aktivieren
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            
            if (result.success) {
                showFeedback(feedbackEl, result.message, 'success');
                // Globale Nachricht für die Weiterleitung
                showGlobalMessage('Login erfolgreich! Du wirst weitergeleitet...', 'success');
                // Nach kurzer Verzögerung zur Map-Seite weiterleiten
                setTimeout(() => {
                    window.location.href = 'map.html';
                }, 1000);
            } else {
                showFeedback(feedbackEl, result.message, 'error');
                // Globale Fehlermeldung
                showGlobalMessage('Login fehlgeschlagen: ' + result.message, 'error');
            }
        });
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
    // Auth-Status überprüfen
    checkAuthStatus();
    
    // Login-Formular initialisieren
    initLoginForm();
    
    // Logout-Button initialisieren
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Routing-Schutz: Direkten Zugriff auf map.html verhindern
    if (window.location.pathname.includes('map.html')) {
        // Verzögerter Check, um sicherzustellen, dass die Auth-Prüfung abgeschlossen ist
        setTimeout(() => {
            if (!isAuthenticated()) {
                showGlobalMessage('Bitte melde dich an, um auf die Karte zuzugreifen.', 'warning');
                window.location.href = 'login.html';
            }
        }, 500);
    }
    
    // Regelmäßige Auth-Status-Prüfung starten (alle 2 Minuten)
    startAuthStatusMonitor(120000);
}

// Event-Listener für Seiten-Laden
document.addEventListener('DOMContentLoaded', () => {
    // Auth-Komponente initialisieren
    initAuth();
});