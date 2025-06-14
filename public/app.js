// Backend-URL (auf Render gehostet)
// Passe diese URL an dein auf Render gehostetes Backend an
const API_URL = 'https://susio2.onrender.com';

// Globaler Authentifizierungsstatus
window.isAuthenticated = false;

// Authentifizierungsstatus beim Laden prüfen
async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/api/locations`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.isAuthenticated = true;
            mainContainer.style.display = 'flex';
            authContainer.style.display = 'none';
            logoutContainer.style.display = 'block';
            fetchLocations();
            fetchStats(); // Lade auch die Statistiken
        } else {
            window.isAuthenticated = false;
            mainContainer.style.display = 'none';
            authContainer.style.display = 'block';
            logoutContainer.style.display = 'none';
        }
    } catch (error) {
        console.log('Noch nicht authentifiziert oder API nicht erreichbar');
        window.isAuthenticated = false;
        mainContainer.style.display = 'none';
        authContainer.style.display = 'block';
        logoutContainer.style.display = 'none';
    }
}

/**
 * Lädt Statistiken vom Backend und zeigt sie im Admin-Panel an
 */
async function fetchStats() {
    if (!window.isAuthenticated) {
        statsError.textContent = 'Bitte zuerst anmelden.';
        statsError.style.display = 'block';
        statsLoading.style.display = 'none';
        statsContainer.style.display = 'none';
        return;
    }

    // Lade-Anzeige einblenden, Fehler ausblenden
    statsLoading.style.display = 'block';
    statsContainer.style.display = 'none';
    statsError.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/api/stats`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            statsError.textContent = `Fehler beim Abrufen der Statistiken: ${data.message || 'Unbekannter Fehler'}`;
            statsError.style.display = 'block';
            statsLoading.style.display = 'none';
            return;
        }

        // Statistiken anzeigen
        totalLocations.textContent = data.data.totalLocations;
        totalImages.textContent = data.data.totalImages;
        document.getElementById('database-size').textContent = data.data.databaseSizeMB;
        
        // Liste der letzten Standorte leeren und neu befüllen
        recentLocationsList.innerHTML = '';
        
        if (data.data.recentLocations && data.data.recentLocations.length > 0) {
            data.data.recentLocations.forEach(location => {
                const listItem = document.createElement('li');
                const createdDate = new Date(location.createdAt).toLocaleDateString('de-DE');
                listItem.textContent = `${location.title} (erstellt am ${createdDate})`;
                recentLocationsList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = 'Keine Standorte vorhanden';
            recentLocationsList.appendChild(listItem);
        }

        // Lade-Anzeige ausblenden, Container anzeigen
        statsLoading.style.display = 'none';
        statsContainer.style.display = 'block';
    } catch (error) {
        statsError.textContent = `Fehler beim Abrufen der Statistiken: ${error.message}`;
        statsError.style.display = 'block';
        statsLoading.style.display = 'none';
    }
}

// DOM Elemente
const accessCodeInput = document.getElementById('access-code');
const loginButton = document.getElementById('login-button');
const authMessage = document.getElementById('auth-message');
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const locationForm = document.getElementById('location-form');
const formMessage = document.getElementById('form-message');
const refreshButton = document.getElementById('refresh-button');
const locationsMessage = document.getElementById('locations-message');
const locationsList = document.getElementById('locations-list');

// Logout Elemente
const logoutContainer = document.getElementById('logout-container');
const logoutButton = document.getElementById('logout-button');

// Suche Elemente
const searchInput = document.getElementById('search-input');
const clearSearchButton = document.getElementById('clear-search-button');

// Stats Panel Elemente
const statsLoading = document.getElementById('stats-loading');
const statsContainer = document.getElementById('stats-container');
const totalLocations = document.getElementById('total-locations');
const totalImages = document.getElementById('total-images');
const recentLocationsList = document.getElementById('recent-locations-list');
const statsError = document.getElementById('stats-error');
const refreshStatsButton = document.getElementById('refresh-stats-button');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Authentifizierungsstatus prüfen beim Laden
    checkAuthStatus();
    
    // Heutiges Datum im Formular vorausfüllen
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    document.getElementById('date').value = formattedDate;

    // Event Listener hinzufügen
    loginButton.addEventListener('click', login);
    logoutButton.addEventListener('click', logout);
    locationForm.addEventListener('submit', createLocation);
    refreshButton.addEventListener('click', fetchLocations);
    refreshStatsButton.addEventListener('click', fetchStats);
    
    // Suchfunktion Event-Listener
    searchInput.addEventListener('input', filterLocations);
    clearSearchButton.addEventListener('click', clearSearch);
});

// Login und Authentifizierung
async function login() {
    const accessCode = accessCodeInput.value.trim();
    if (!accessCode) {
        showAuthMessage('Bitte gib den Zugangscode ein.', true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/verify-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Wichtig für das Senden und Empfangen von Cookies
            body: JSON.stringify({ accessCode })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            // Authentifizierungsstatus setzen - wir verwenden das Session-Cookie im Browser
            window.isAuthenticated = true;
            
            showAuthMessage('Erfolgreich angemeldet!', false);
            mainContainer.style.display = 'flex';
            authContainer.style.display = 'none';
            logoutContainer.style.display = 'block';
            fetchLocations();
        } else {
            showAuthMessage(data.message || 'Ungültiger Zugangscode.', true);
        }
    } catch (error) {
        showAuthMessage(`Fehler bei der Anmeldung: ${error.message}`, true);
    }
}

/**
 * Logout-Funktion - Benutzer abmelden und Session löschen
 */
async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && !data.error) {
            // Authentifizierungsstatus zurücksetzen
            window.isAuthenticated = false;
            
            // UI zurücksetzen auf Login-Ansicht
            mainContainer.style.display = 'none';
            authContainer.style.display = 'block';
            logoutContainer.style.display = 'none';
            
            // Erfolgsmeldung anzeigen
            showAuthMessage('Erfolgreich abgemeldet.', false);
            
            // Cookie manuell löschen (als Fallback)
            document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } else {
            showAuthMessage(data.message || 'Fehler beim Abmelden.', true);
        }
    } catch (error) {
        showAuthMessage(`Fehler beim Abmelden: ${error.message}`, true);
    }
}

// Standort erstellen
async function createLocation(event) {
    event.preventDefault();
    
    if (!window.isAuthenticated) {
        showFormMessage('Bitte zuerst anmelden.', true);
        return;
    }

    // Formulardaten sammeln
    const locationData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,
        date: document.getElementById('date').value
    };

    const imageFile = document.getElementById('image').files[0];
    
    try {
        // 1. Standort erstellen
        const createResponse = await fetch(`${API_URL}/api/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Wichtig für Cookie-Übertragung
            body: JSON.stringify(locationData)
        });

        const createData = await createResponse.json();

        if (!createResponse.ok || createData.error) {
            showFormMessage(`Fehler beim Erstellen des Standorts: ${createData.message}`, true);
            return;
        }

        const locationId = createData.data.id;
        showFormMessage(`Standort erstellt mit ID: ${locationId}`, false);

        // 2. Wenn ein Bild hochgeladen wurde, dieses zum Standort hinzufügen
        if (imageFile) {
            await uploadImage(locationId, imageFile);
        }

        // Formular zurücksetzen und Standorte neu laden
        locationForm.reset();
        fetchLocations();
        
    } catch (error) {
        showFormMessage(`Fehler beim Erstellen des Standorts: ${error.message}`, true);
    }
}

// Bild hochladen
async function uploadImage(locationId, imageFile) {
    try {
        // Prüfen, ob der Dateityp erlaubt ist
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(imageFile.type)) {
            showFormMessage('Nur .jpg und .png Dateien sind erlaubt.', true);
            return;
        }

        // Datei in Base64 konvertieren
        const base64Image = await convertFileToBase64(imageFile);
        
        // Bild hochladen
        const uploadResponse = await fetch(`${API_URL}/api/locations/${locationId}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Wichtig für Cookie-Übertragung
            body: JSON.stringify({
                imageData: base64Image,
                fileName: imageFile.name
            })
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || uploadData.error) {
            showFormMessage(`Fehler beim Hochladen des Bildes: ${uploadData.message}`, true);
            return;
        }

        showFormMessage('Bild erfolgreich hochgeladen.', false);
    } catch (error) {
        showFormMessage(`Fehler beim Hochladen des Bildes: ${error.message}`, true);
    }
}

// File zu Base64 konvertieren
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Alle Standorte abrufen
async function fetchLocations() {
    if (!window.isAuthenticated) {
        showLocationsMessage('Bitte zuerst anmelden.', true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/locations`, {
            method: 'GET',
            credentials: 'include' // Wichtig für das Senden der Cookies
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            showLocationsMessage(`Fehler beim Abrufen der Standorte: ${data.message}`, true);
            return;
        }

        displayLocations(data.data);
        showLocationsMessage('', false);
    } catch (error) {
        showLocationsMessage(`Fehler beim Abrufen der Standorte: ${error.message}`, true);
    }
}

// Globale Variable zur Speicherung aller Standorte
let allLocations = [];

// Standorte anzeigen
function displayLocations(locations) {
    // Alle Standorte speichern für Suchfunktion
    allLocations = locations;
    
    locationsList.innerHTML = '';
    
    if (!locations || locations.length === 0) {
        locationsList.innerHTML = '<p>Keine Standorte gefunden.</p>';
        return;
    }

    locations.forEach(location => {
        const card = document.createElement('div');
        card.className = 'location-card';

        // Bild hinzufügen, falls verfügbar
        if (location.has_image || location.image_type) {
            const img = document.createElement('img');
            img.className = 'location-image';
            img.alt = location.title;
            
            // Immer Thumbnails verwenden in der Übersicht
            img.src = `${API_URL}/api/locations/${location.id}/image?thumb=true`;
            
            // Cookie für die Bildanfrage hinzufügen
            img.setAttribute('crossorigin', 'use-credentials');
            
            // Error-Handler für Bilder
            img.onerror = () => {
                img.src = '/placeholder.svg';
                img.alt = 'Kein Bild vorhanden';
            };
            
            card.appendChild(img);
        } else {
            // Wenn kein Bild vorhanden ist, zeige das Platzhalterbild
            const img = document.createElement('img');
            img.className = 'location-image';
            img.alt = 'Kein Bild vorhanden';
            img.src = '/placeholder.svg';
            card.appendChild(img);
        }

        // Informationen hinzufügen
        const info = document.createElement('div');
        info.className = 'location-info';
        
        const title = document.createElement('h3');
        title.textContent = location.title;
        
        const date = document.createElement('p');
        date.textContent = `Datum: ${location.date || 'Nicht angegeben'}`;
        
        // Beschreibung hinzufügen
        if (location.description) {
            const description = document.createElement('p');
            description.className = 'location-description';
            description.textContent = location.description;
            description.style.fontSize = '0.9em';
            description.style.color = '#666';
            description.style.marginTop = '8px';
            description.style.marginBottom = '8px';
            info.appendChild(title);
            info.appendChild(description);
            info.appendChild(date);
        } else {
            info.appendChild(title);
            info.appendChild(date);
        }
        
        const actions = document.createElement('div');
        actions.className = 'location-actions';
        
        // Löschen-Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Löschen';
        deleteBtn.onclick = () => deleteLocation(location.id);

        // Bild-Anzeige-Button
        const viewImgBtn = document.createElement('button');
        viewImgBtn.textContent = 'Vollbild';
        viewImgBtn.style.marginRight = '5px';
        viewImgBtn.onclick = () => {
            window.open(`${API_URL}/api/locations/${location.id}/image`, '_blank');
        };
        
        if (location.has_image || location.image_type) {
            actions.appendChild(viewImgBtn);
        }
        
        actions.appendChild(deleteBtn);
        info.appendChild(actions);
        card.appendChild(info);
        
        locationsList.appendChild(card);
    });
}

// Standort löschen
async function deleteLocation(id) {
    if (!confirm(`Möchtest du den Standort mit ID ${id} wirklich löschen?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/locations/${id}`, {
            method: 'DELETE',
            credentials: 'include' // Wichtig für Cookie-Übertragung
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            showLocationsMessage(`Fehler beim Löschen des Standorts: ${data.message}`, true);
            return;
        }

        showLocationsMessage(`Standort mit ID ${id} erfolgreich gelöscht.`, false);
        fetchLocations();
    } catch (error) {
        showLocationsMessage(`Fehler beim Löschen des Standorts: ${error.message}`, true);
    }
}

// Hilfsfunktionen für Nachrichten
function showAuthMessage(message, isError) {
    authMessage.textContent = message;
    authMessage.className = isError ? 'error-message' : 'success-message';
}

function showFormMessage(message, isError) {
    formMessage.textContent = message;
    formMessage.className = isError ? 'error-message' : 'success-message';
}

function showLocationsMessage(message, isError) {
    locationsMessage.textContent = message;
    locationsMessage.className = isError ? 'error-message' : 'success-message';
}

/**
 * Filtert die Standorte basierend auf dem Suchbegriff
 */
function filterLocations() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        // Wenn das Suchfeld leer ist, alle Standorte anzeigen
        displayLocations(allLocations);
        return;
    }
    
    // Standorte filtern, deren Titel oder Beschreibung den Suchbegriff enthalten
    const filteredLocations = allLocations.filter(location => {
        const titleMatch = location.title && location.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = location.description && location.description.toLowerCase().includes(searchTerm);
        return titleMatch || descriptionMatch;
    });
    
    // Gefilterte Standorte anzeigen
    locationsList.innerHTML = '';
    
    if (filteredLocations.length === 0) {
        locationsList.innerHTML = '<p>Keine passenden Standorte gefunden.</p>';
    } else {
        // Original displayLocations-Funktion verwendet nur den Anzeigeteil
        filteredLocations.forEach(location => {
            const card = document.createElement('div');
            card.className = 'location-card';

            // Bild hinzufügen, falls verfügbar
            if (location.has_image || location.image_type) {
                const img = document.createElement('img');
                img.className = 'location-image';
                img.alt = location.title;
                
                // Immer Thumbnails verwenden in der Übersicht
                img.src = `${API_URL}/api/locations/${location.id}/image?thumb=true`;
                
                // Cookie für die Bildanfrage hinzufügen
                img.setAttribute('crossorigin', 'use-credentials');
                
                // Error-Handler für Bilder
                img.onerror = () => {
                    img.src = '/placeholder.svg';
                    img.alt = 'Kein Bild vorhanden';
                };
                
                card.appendChild(img);
            } else {
                // Wenn kein Bild vorhanden ist, zeige das Platzhalterbild
                const img = document.createElement('img');
                img.className = 'location-image';
                img.alt = 'Kein Bild vorhanden';
                img.src = '/placeholder.svg';
                card.appendChild(img);
            }

            // Informationen hinzufügen
            const info = document.createElement('div');
            info.className = 'location-info';
            
            const title = document.createElement('h3');
            title.textContent = location.title;
            
            const date = document.createElement('p');
            date.textContent = `Datum: ${location.date || 'Nicht angegeben'}`;
            
            // Beschreibung hinzufügen
            if (location.description) {
                const description = document.createElement('p');
                description.className = 'location-description';
                description.textContent = location.description;
                description.style.fontSize = '0.9em';
                description.style.color = '#666';
                description.style.marginTop = '8px';
                description.style.marginBottom = '8px';
                info.appendChild(title);
                info.appendChild(description);
                info.appendChild(date);
            } else {
                info.appendChild(title);
                info.appendChild(date);
            }
            
            const actions = document.createElement('div');
            actions.className = 'location-actions';
            
            // Löschen-Button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Löschen';
            deleteBtn.onclick = () => deleteLocation(location.id);

            // Bild-Anzeige-Button
            const viewImgBtn = document.createElement('button');
            viewImgBtn.textContent = 'Vollbild';
            viewImgBtn.style.marginRight = '5px';
            viewImgBtn.onclick = () => {
                window.open(`${API_URL}/api/locations/${location.id}/image`, '_blank');
            };
            
            if (location.has_image || location.image_type) {
                actions.appendChild(viewImgBtn);
            }
            
            actions.appendChild(deleteBtn);
            info.appendChild(actions);
            card.appendChild(info);
            
            locationsList.appendChild(card);
        });
    }
}

/**
 * Löscht den Suchbegriff und zeigt alle Standorte an
 */
function clearSearch() {
    searchInput.value = '';
    displayLocations(allLocations);
}