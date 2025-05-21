// API Basis-URL (verbessert für Render-Deployment)
const API_URL = (() => {
    // Ausführliches Debugging der URL-Konfiguration
    console.log('DEBUG: Browser-Umgebung', {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        href: window.location.href,
        userAgent: navigator.userAgent
    });
    
    // Lokale Entwicklungsumgebung
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const url = `http://${window.location.hostname}:10000`;
        console.log('DEBUG: Lokale API-URL konfiguriert:', url);
        return url;
    }
    
    // Produktionsumgebung (Render)
    // Wir verwenden die aktuelle Basis-URL, um sicherzustellen,
    // dass wir immer die richtige Domain verwenden, unabhängig davon,
    // ob es sich um eine .onrender.com oder eine benutzerdefinierte Domain handelt
    console.log('DEBUG: Produktions-API-URL konfiguriert mit relativer URL');
    return '';
})();

// Debug-Logger für wichtige Ereignisse
const DEBUG = {
    log: (bereich, nachricht, daten = null) => {
        const zeitstempel = new Date().toISOString();
        const formatierteNachricht = `[${zeitstempel}] [${bereich}] ${nachricht}`;
        if (daten) {
            console.log(formatierteNachricht, daten);
        } else {
            console.log(formatierteNachricht);
        }
    },
    
    cookie: () => {
        const cookies = document.cookie ? document.cookie.split(';').map(c => c.trim()) : [];
        DEBUG.log('Cookies', `Aktuelle Cookies (${cookies.length}):`, cookies);
        DEBUG.log('Cookies', 'Cookie-Namen vorhanden:', cookies.map(c => c.split('=')[0]));
        return cookies.length > 0;
    }
};

// Session-Management
// Zentraler Auth-Status mit Getter für bessere Kapselung
let _isAuthenticated = false;

// Öffentliche Funktion, um den Auth-Status zu prüfen
function isAuthenticated() {
    return _isAuthenticated;
}

// Lese Session-ID aus dem lokalen Speicher (falls vorhanden)
// Dies wird als Fallback verwendet, wenn der Cookie nicht funktioniert
function getStoredSessionId() {
    return localStorage.getItem('manual_session_id');
}

// Überprüft, ob der Benutzer angemeldet ist und handelt entsprechend
// Optimiert für problematische Cookie-Umgebungen mit Dual-Methode
async function checkAuthStatus(redirectOnFail = true) {
    // Status der letzten Session aus localStorage abrufen (zwei Methoden)
    const sessionInitialized = localStorage.getItem('session_initialized');
    const storedSessionId = getStoredSessionId();
    
    DEBUG.log('Auth-Check', `Prüfe Auth-Status auf Seite: ${window.location.pathname}`);
    DEBUG.log('Auth-Check', `Session-Hinweise im Storage:`, {
        initialized: sessionInitialized ? 'Ja' : 'Nein',
        manualSessionId: storedSessionId ? 'Vorhanden' : 'Nicht vorhanden'
    });
    
    // Cookies prüfen (nur zu Debug-Zwecken)
    DEBUG.cookie();
    
    try {
        // Umgebungsinformationen für das Debugging
        const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        DEBUG.log('Auth-Check', `Umgebung: ${isProd ? 'Produktion' : 'Entwicklung'}`);
        
        // Session-Check-URL
        const sessionCheckUrl = `${API_URL}/api/session-status`;
        DEBUG.log('Auth-Check', `Session-Check-API-URL: ${sessionCheckUrl}`);
        
        // Zusammenstellen der Request-Header
        const headers = {
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'fetch',
            'X-Debug-Timestamp': new Date().toISOString()
        };
        
        // Wenn wir eine manuell gespeicherte Session-ID haben, fügen wir sie als Header hinzu
        // Dies ist ein Fallback für Umgebungen, in denen Cookies nicht funktionieren
        if (storedSessionId) {
            headers['X-Session-Id'] = storedSessionId;
        }
        
        // Session-Status-Anfrage senden
        const response = await fetch(sessionCheckUrl, {
            method: 'GET',
            credentials: 'include', // Sendet Cookies (falls vorhanden)
            cache: 'no-cache',      
            headers: headers
        });
        
        DEBUG.log('Auth-Check', `Server antwortete mit Status: ${response.status}`);
        
        // Response-Header analysieren
        const responseHeaders = {};
        response.headers.forEach((value, name) => {
            responseHeaders[name] = value;
        });
        DEBUG.log('Auth-Check', 'Response-Header:', responseHeaders);
        
        // Antworttext extrahieren und prüfen
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
            DEBUG.log('Auth-Check', 'Leere Antwort vom Server erhalten');
            throw new Error('Leere Serverantwort');
        }
        
        // Antwort parsen
        let data;
        try {
            data = JSON.parse(responseText);
            DEBUG.log('Auth-Check', 'Geparste Session-Check-Daten:', data);
        } catch (parseError) {
            DEBUG.log('Auth-Check', 'Fehler beim Parsen der Serverantwort:', responseText);
            throw new Error('Ungültiges JSON in Serverantwort');
        }
        
        // Auswerten der Session-Status-Antwort
        if (response.ok && data.authenticated) {
            DEBUG.log('Auth-Check', '✅ Session gültig - Benutzer authentifiziert');
            _isAuthenticated = true;
            
            // Session-Status im Storage speichern
            localStorage.setItem('session_initialized', 'true');
            
            // Session-ID aus der Antwort speichern, falls vorhanden
            if (data.sessionId) {
                localStorage.setItem('manual_session_id', data.sessionId);
                DEBUG.log('Auth-Check', 'Session-ID aus Antwort gespeichert');
            }
            
            // Wenn auf Login-Seite oder Startseite, weiterleiten zur Karte
            if (window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname === '') {
                DEBUG.log('Auth-Check', 'Weiterleitung zur map.html...');
                window.location.href = 'map.html';
            }
            return true;
        } else {
            DEBUG.log('Auth-Check', '❌ Session ungültig - Benutzer nicht authentifiziert');
            _isAuthenticated = false;
            
            // Session-Hinweise im Storage löschen
            localStorage.removeItem('session_initialized');
            localStorage.removeItem('manual_session_id');
            
            // Weiterleitung nur wenn nicht auf Login-Seite und redirectOnFail=true
            if (redirectOnFail && !window.location.pathname.includes('login.html')) {
                DEBUG.log('Auth-Check', 'Weiterleitung zur login.html wegen ungültiger Session');
                
                // Loop-Schutz: Tracking im Session Storage
                if (!sessionStorage.getItem('redirecting')) {
                    showGlobalMessage('Bitte melde dich an, um fortzufahren.', 'info');
                    sessionStorage.setItem('redirecting', 'true');
                    
                    // Redirect-Zähler erhöhen
                    const redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
                    sessionStorage.setItem('redirect_count', (redirectCount + 1).toString());
                }
                
                // Wenn zu viele Redirects, keine weitere Weiterleitung
                const redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
                if (redirectCount > 3) {
                    DEBUG.log('Auth-Check', '⚠️ Zu viele Redirects - Loop-Schutz aktiviert');
                    showGlobalMessage('Zu viele Weiterleitungen erkannt. Bitte versuche, dich manuell anzumelden.', 'warning');
                    return false;
                }
                
                // Verzögerte Weiterleitung
                setTimeout(() => {
                    window.location.href = 'login.html';
                    sessionStorage.removeItem('redirecting');
                }, 500);
            }
            return false;
        }
    } catch (error) {
        DEBUG.log('Auth-Check', 'Fehler beim Überprüfen des Auth-Status:', error);
        
        // Fallback: Wenn lokale Hinweise auf eine Session vorhanden sind
        if (sessionInitialized === 'true' || storedSessionId) {
            DEBUG.log('Auth-Check', '⚠️ Auth-Fehler, aber lokale Session-Hinweise vorhanden - Bedingt authentifiziert');
            _isAuthenticated = true;
            showGlobalMessage('Verbindungsprobleme bei der Session-Prüfung. Du kannst die App mit eingeschränktem Funktionsumfang nutzen.', 'warning');
            return true;
        }
        
        _isAuthenticated = false;
        
        // Weiterleitung nur bei Netzwerkfehlern + nicht auf Login-Seite + redirectOnFail=true
        if (redirectOnFail && !window.location.pathname.includes('login.html')) {
            DEBUG.log('Auth-Check', 'Weiterleitung zur login.html wegen Netzwerkfehler');
            showGlobalMessage('Verbindungsfehler beim Prüfen deiner Anmeldung. Bitte erneut anmelden.', 'error');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
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

// Login-Funktion mit erweitertem Debugging und verbesserter Session-Handhabung
async function login(accessCode) {
    try {
        DEBUG.log('Login', 'Login-Versuch wird gestartet');
        DEBUG.cookie(); // Cookies vor dem Login prüfen
        
        // API-Endpunkt präzise zusammenbauen für besseres Debugging
        const loginEndpoint = `${API_URL}/verify-access`;
        DEBUG.log('Login', `Verwende Login-Endpunkt: ${loginEndpoint}`);
        
        // Zusätzliche Request-Header für besseres Debugging
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Version': '1.0.0',
                'X-Debug-Timestamp': new Date().toISOString()
            },
            credentials: 'include', // Wichtig für Cookie-Speicherung
            body: JSON.stringify({ accessCode })
        };
        
        DEBUG.log('Login', 'Sende Login-Request mit Optionen:', fetchOptions);
        
        // Zugangscode senden und Response erfassen
        const response = await fetch(loginEndpoint, fetchOptions);
        DEBUG.log('Login', `Server antwortete mit Status: ${response.status} ${response.statusText}`);
        
        // Response-Header für Debugging anzeigen
        const responseHeaders = {};
        response.headers.forEach((value, name) => {
            responseHeaders[name] = value;
        });
        DEBUG.log('Login', 'Response-Header:', responseHeaders);
        
        // Cookies nach dem Response prüfen
        DEBUG.log('Login', 'Cookies nach Server-Antwort:');
        const hasCookiesAfterResponse = DEBUG.cookie();
        
        // Response-Daten erfassen
        let data;
        try {
            const responseText = await response.text();
            DEBUG.log('Login', 'Response-Text:', responseText);
            
            if (responseText && responseText.trim() !== '') {
                data = JSON.parse(responseText);
                DEBUG.log('Login', 'Geparste Response-Daten:', data);
            } else {
                DEBUG.log('Login', 'Leere Response vom Server erhalten');
                throw new Error('Leere Antwort vom Server');
            }
        } catch (parseError) {
            DEBUG.log('Login', 'Fehler beim Parsen der Server-Antwort:', parseError);
            throw new Error(`Konnte Server-Antwort nicht verarbeiten: ${parseError.message}`);
        }
        
        if (response.ok && !data.error) {
            DEBUG.log('Login', '✅ Login erfolgreich - Session soll erstellt sein');
            
            // WICHTIG: Session-ID aus der Antwort sichern
            // Dies ist ein kritischer Fix für Browser, die mit den Cookies Probleme haben
            if (data.sessionId) {
                DEBUG.log('Login', `Session-ID in Antwort gefunden: ${data.sessionId.substring(0, 8)}...`);
                localStorage.setItem('manual_session_id', data.sessionId);
                DEBUG.log('Login', 'Session-ID im localStorage gespeichert');
            } else {
                DEBUG.log('Login', 'Keine Session-ID in der Antwort gefunden!');
            }
            
            // Kurze Verzögerung hinzufügen, damit Cookie-Verarbeitung abgeschlossen werden kann
            DEBUG.log('Login', 'Warte 500ms für Cookie-Verarbeitung...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Cookies nach der Verzögerung erneut prüfen
            DEBUG.log('Login', 'Cookies nach Verzögerung:');
            const hasCookiesAfterDelay = DEBUG.cookie();
            
            DEBUG.log('Login', `Cookie-Zusammenfassung: 
                - Vor Login: ${hasCookiesAfterResponse ? 'Cookies vorhanden' : 'Keine Cookies'}
                - Nach Server-Antwort: ${hasCookiesAfterResponse ? 'Cookies vorhanden' : 'Keine Cookies'}
                - Nach Verzögerung: ${hasCookiesAfterDelay ? 'Cookies vorhanden' : 'Keine Cookies'}`
            );
            
            // Session-Status-Endpunkt aufrufen mit Header-basierter Session-ID
            const sessionEndpoint = `${API_URL}/api/session-status`;
            DEBUG.log('Login', `Überprüfe Session mit: ${sessionEndpoint}`);
            
            // Erstelle Headers für die Session-Validierung
            const sessionCheckHeaders = {
                'Cache-Control': 'no-cache',
                'X-Debug-Timestamp': new Date().toISOString()
            };
            
            // WICHTIG: Manuelle Session-ID als Header hinzufügen, wenn Cookie nicht gesetzt wurde
            const storedSessionId = localStorage.getItem('manual_session_id');
            if (storedSessionId && !hasCookiesAfterDelay) {
                DEBUG.log('Login', 'Verwende gespeicherte Session-ID im Header (Cookie-Fallback)');
                sessionCheckHeaders['X-Session-Id'] = storedSessionId;
            }
            
            const sessionCheckResponse = await fetch(sessionEndpoint, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-cache',
                headers: sessionCheckHeaders
            });
            
            DEBUG.log('Login', `Session-Check antwortete mit Status: ${sessionCheckResponse.status}`);
            
            try {
                const sessionResponseText = await sessionCheckResponse.text();
                DEBUG.log('Login', 'Session-Check Response-Text:', sessionResponseText);
                
                if (sessionResponseText && sessionResponseText.trim() !== '') {
                    const sessionData = JSON.parse(sessionResponseText);
                    DEBUG.log('Login', 'Geparste Session-Check-Daten:', sessionData);
                    
                    // Wenn Session-ID in der Antwort zurückkommt, aktualisieren
                    if (sessionData.sessionId) {
                        DEBUG.log('Login', 'Session-ID aus Session-Check-Antwort aktualisiert');
                        localStorage.setItem('manual_session_id', sessionData.sessionId);
                    }
                    
                    if (sessionCheckResponse.ok && sessionData.authenticated) {
                        DEBUG.log('Login', '✅ Session erfolgreich validiert');
                        _isAuthenticated = true;
                        
                        // Lokale Storage-Markierungen aktualisieren
                        localStorage.setItem('session_initialized', 'true');
                        localStorage.setItem('last_login_time', new Date().toISOString());
                        
                        // Erfolgsinformationen zurückgeben
                        return { 
                            success: true, 
                            message: 'Erfolgreich angemeldet!', 
                            redirect: 'map.html' 
                        };
                    } else {
                        DEBUG.log('Login', '❌ Session-Validierung fehlgeschlagen nach Login');
                        localStorage.removeItem('session_initialized');
                        localStorage.removeItem('manual_session_id');
                        _isAuthenticated = false;
                        
                        return { 
                            success: false, 
                            message: 'Login erfolgreich, aber Session konnte nicht validiert werden. Die Session wurde möglicherweise nicht korrekt erstellt. Bitte versuche es erneut.' 
                        };
                    }
                } else {
                    DEBUG.log('Login', '❌ Leere Antwort vom Session-Check');
                    throw new Error('Leere Antwort vom Session-Check');
                }
            } catch (sessionParseError) {
                DEBUG.log('Login', 'Fehler beim Parsen der Session-Check-Antwort:', sessionParseError);
                return { 
                    success: false, 
                    message: `Fehler bei der Session-Validierung: ${sessionParseError.message}` 
                };
            }
        } else {
            DEBUG.log('Login', '❌ Login fehlgeschlagen:', data.message);
            return { success: false, message: data.message || 'Ungültiger Zugangscode.' };
        }
    } catch (error) {
        DEBUG.log('Login', 'Kritischer Fehler bei der Anmeldung:', error);
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
    console.log('Auth-System wird initialisiert...', new Date().toISOString());
    console.log('Hostname:', window.location.hostname);
    console.log('Pfad:', window.location.pathname);
    
    // Login-Formular initialisieren
    initLoginForm();
    
    // Logout-Button initialisieren
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Seitenspezifischer Code mit verbesserter Fehlerbehandlung
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    const isMapPage = currentPath.includes('map.html');
    const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    console.log(`Seitentyp: ${isLoginPage ? 'Login-Seite' : isMapPage ? 'Map-Seite' : 'Andere Seite'}`);
    
    // Anti-Loop-Schutz: Verfolgt die Anzahl der Redirects innerhalb derselben Session
    let redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
    
    // Bei zu vielen Redirects vermuten wir einen Loop und stoppen
    if (redirectCount > 5) {
        console.warn('⚠️ Zu viele Redirects erkannt - Loop-Schutz aktiviert');
        
        // Redirect-Schutz aktivieren und dem Benutzer Hilfe anbieten
        const loopProtectionOverlay = document.createElement('div');
        loopProtectionOverlay.className = 'session-expired-overlay';
        loopProtectionOverlay.innerHTML = `
            <div class="session-message-box">
                <h3>Achtung: Mögliches Login-Problem erkannt</h3>
                <p>Wir haben einen möglichen Login-Loop erkannt. Dies kann an Cookies oder Browsereinstellungen liegen.</p>
                <div class="mt-3">
                    <button id="clear-storage-btn" class="btn btn-warning me-2 mb-2">Browserdaten löschen</button>
                    <button id="try-login-btn" class="btn btn-primary mb-2">Login erneut versuchen</button>
                </div>
            </div>
        `;
        document.body.appendChild(loopProtectionOverlay);
        
        // Event-Handler für die Buttons
        document.getElementById('clear-storage-btn').addEventListener('click', () => {
            // Alle Speicherdaten löschen
            localStorage.clear();
            sessionStorage.clear();
            
            // Cookies löschen (soweit möglich)
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            alert('Browserdaten wurden gelöscht. Die Seite wird neu geladen.');
            window.location.reload();
        });
        
        document.getElementById('try-login-btn').addEventListener('click', () => {
            // Reset des Zählers und Weiterleitung zur Login-Seite
            sessionStorage.removeItem('redirect_count');
            window.location.href = 'login.html';
        });
        
        // Nicht weitermachen mit den regulären Prüfungen
        return;
    }
    
    if (isLoginPage) {
        console.log('Auf Login-Seite - prüfe, ob Benutzer bereits angemeldet ist');
        
        // Check für Redirect-Loop: Falls wir von der map.html kommen nach einer Authentifizierung,
        // könnten wir in einem Loop stecken. In diesem Fall setzen wir das localStorage zurück.
        const referrer = document.referrer;
        if (referrer && referrer.includes('map.html')) {
            console.warn('⚠️ Redirect von map.html zur login.html - mögliches Loop-Problem');
            localStorage.removeItem('session_initialized');
        }
        
        // Verzögerung vor der Session-Prüfung, um dem Server Zeit zu geben
        setTimeout(() => {
            // Session-Check verbessert für die Produktionsumgebung
            fetch(`${API_URL}/api/session-status`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Requested-With': 'fetch'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server antwortete mit ${response.status}`);
                }
                return response.text().then(text => {
                    if (!text) {
                        throw new Error('Leere Antwort vom Server');
                    }
                    return JSON.parse(text);
                });
            })
            .then(data => {
                if (data.authenticated) {
                    console.log('Benutzer bereits angemeldet - Weiterleitung zur map.html');
                    localStorage.setItem('session_initialized', 'true');
                    
                    // Redirect-Zähler erhöhen
                    sessionStorage.setItem('redirect_count', (redirectCount + 1).toString());
                    
                    window.location.href = 'map.html';
                } else {
                    console.log('Benutzer nicht angemeldet - Login-Formular bleibt aktiv');
                    localStorage.removeItem('session_initialized');
                }
            })
            .catch(error => {
                console.error('Fehler bei der Session-Prüfung auf der Login-Seite:', error);
                
                // Bei Netzwerkfehlern: Wenn es lokale Anzeichen für eine Session gibt, 
                // zum Benutzer freundlich sein und zur Map weiterleiten
                if (localStorage.getItem('session_initialized') === 'true') {
                    console.log('Lokaler Session-Hinweis gefunden - Versuche Weiterleitung zur Map');
                    showGlobalMessage('Verbindungsfehler beim Prüfen deiner Session. Versuche zur Karte weiterzuleiten...', 'warning');
                    
                    // Redirect-Zähler erhöhen
                    sessionStorage.setItem('redirect_count', (redirectCount + 1).toString());
                    
                    setTimeout(() => {
                        window.location.href = 'map.html';
                    }, 1500);
                }
            });
        }, 500);
    } 
    else if (isMapPage) {
        console.log('Auf map.html - führe Session-Validierung durch');
        
        // Verbesserte Session-Prüfung für Produktionsumgebung
        const sessionCheckUrl = `${API_URL}/api/session-status`;
        console.log(`Rufe Session-Check-API auf: ${sessionCheckUrl}`);
        
        // Verzögerung vor der Session-Prüfung, um dem Server Zeit zu geben
        setTimeout(() => {
            fetch(sessionCheckUrl, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Requested-With': 'fetch'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server antwortete mit ${response.status}`);
                }
                return response.text().then(text => {
                    if (!text) {
                        throw new Error('Leere Antwort vom Server');
                    }
                    return JSON.parse(text);
                });
            })
            .then(data => {
                console.log('Session-Prüfung auf map.html:', data);
                
                if (data.authenticated) {
                    console.log('✅ Gültige Session auf map.html bestätigt');
                    _isAuthenticated = true;
                    
                    // Session-Status im localStorage speichern
                    localStorage.setItem('session_initialized', 'true');
                    
                    // Redirect-Zähler zurücksetzen, da erfolgreicher Zugriff
                    sessionStorage.removeItem('redirect_count');
                    
                    // Regelmäßige Prüfung starten
                    startAuthStatusMonitor(120000);
                } else {
                    console.log('❌ Ungültige Session auf map.html erkannt');
                    
                    // Session-Status im localStorage löschen
                    localStorage.removeItem('session_initialized');
                    
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
                    
                    // Event-Handler für den Button mit Zähler-Update
                    document.getElementById('login-redirect-btn').addEventListener('click', () => {
                        // Redirect-Zähler erhöhen
                        sessionStorage.setItem('redirect_count', (redirectCount + 1).toString());
                        window.location.href = 'login.html';
                    });
                }
            })
            .catch(error => {
                console.error('Fehler bei der Session-Prüfung:', error);
                
                // Bei Netzwerkfehlern: Wenn es lokale Anzeichen für eine Session gibt,
                // Benutzer temporär auf der Seite lassen
                if (localStorage.getItem('session_initialized') === 'true') {
                    console.log('Lokaler Session-Hinweis gefunden - Temporär authentifiziert');
                    _isAuthenticated = true;
                    showGlobalMessage('Verbindungsfehler beim Prüfen deiner Session. Du kannst die App weiter nutzen, aber einige Funktionen sind möglicherweise eingeschränkt.', 'warning');
                } else {
                    // Nur Warnung anzeigen, nicht automatisch umleiten
                    _isAuthenticated = false;
                    showGlobalMessage('Verbindungsprobleme bei der Session-Prüfung. Falls Funktionen eingeschränkt sind, versuche dich neu anzumelden.', 'warning');
                }
            });
        }, 500);
    }
    else {
        // Auf anderen Seiten standardmäßig Auth-Status prüfen
        checkAuthStatus(false);  // Nicht sofort umleiten
        
        // Verzögerung vor dem Start des Monitors
        setTimeout(() => {
            if (_isAuthenticated) {
                startAuthStatusMonitor(120000);
            }
        }, 1000);
    }
}

// Event-Listener für Seiten-Laden
document.addEventListener('DOMContentLoaded', () => {
    // Auth-Komponente initialisieren
    initAuth();
});