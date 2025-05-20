// API Basis-URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `http://${window.location.hostname}:10000` 
    : '';

// Session-Management
let isAuthenticated = false;

// Überprüft, ob der Benutzer angemeldet ist
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/api/locations`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            isAuthenticated = true;
            
            // Wenn auf Login-Seite, weiterleiten zur Karte
            if (window.location.pathname.includes('login.html') || window.location.pathname === '/' || window.location.pathname === '') {
                window.location.href = 'map.html';
            }
        } else {
            isAuthenticated = false;
            
            // Wenn nicht auf Login-Seite, aber nicht angemeldet, zur Login-Seite weiterleiten
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen des Auth-Status:', error);
        isAuthenticated = false;
        
        // Bei Fehlern zur Login-Seite leiten
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
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
            isAuthenticated = true;
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
            isAuthenticated = false;
            // Weiterleitung zur Login-Seite
            window.location.href = 'login.html';
            return true;
        } else {
            console.error('Logout-Fehler:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Logout-Fehler:', error);
        return false;
    }
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
                // Nach kurzer Verzögerung zur Map-Seite weiterleiten
                setTimeout(() => {
                    window.location.href = 'map.html';
                }, 1000);
            } else {
                showFeedback(feedbackEl, result.message, 'error');
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

// Event-Listener für Seiten-Laden
document.addEventListener('DOMContentLoaded', () => {
    // Auth-Status überprüfen
    checkAuthStatus();
    
    // Login-Formular initialisieren
    initLoginForm();
    
    // Logout-Button initialisieren
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});