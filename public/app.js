// Backend-URL (auf Render gehostet)
// Passe diese URL an dein auf Render gehostetes Backend an
const API_URL = 'https://susio2.onrender.com';
let sessionCookie = null;

// DOM Elemente
const accessCodeInput = document.getElementById('access-code');
const loginButton = document.getElementById('login-button');
const authMessage = document.getElementById('auth-message');
const mainContainer = document.getElementById('main-container');
const locationForm = document.getElementById('location-form');
const formMessage = document.getElementById('form-message');
const refreshButton = document.getElementById('refresh-button');
const locationsMessage = document.getElementById('locations-message');
const locationsList = document.getElementById('locations-list');
const showThumbnails = document.getElementById('show-thumbnails');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loginButton.addEventListener('click', login);
    locationForm.addEventListener('submit', createLocation);
    refreshButton.addEventListener('click', fetchLocations);
    showThumbnails.addEventListener('change', () => {
        fetchLocations();
    });
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
            body: JSON.stringify({ accessCode })
        });

        const data = await response.json();

        if (response.ok && !data.error) {
            // Session-Cookie aus der Antwort extrahieren
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                sessionCookie = setCookie.split(';')[0];
            }
            
            showAuthMessage('Erfolgreich angemeldet!', false);
            mainContainer.style.display = 'flex';
            fetchLocations();
        } else {
            showAuthMessage(data.message || 'Ungültiger Zugangscode.', true);
        }
    } catch (error) {
        showAuthMessage(`Fehler bei der Anmeldung: ${error.message}`, true);
    }
}

// Standort erstellen
async function createLocation(event) {
    event.preventDefault();
    
    if (!sessionCookie) {
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
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
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
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
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
    if (!sessionCookie) {
        showLocationsMessage('Bitte zuerst anmelden.', true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/locations`, {
            method: 'GET',
            headers: {
                'Cookie': sessionCookie
            }
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

// Standorte anzeigen
function displayLocations(locations) {
    locationsList.innerHTML = '';
    
    if (!locations || locations.length === 0) {
        locationsList.innerHTML = '<p>Keine Standorte gefunden.</p>';
        return;
    }

    const useThumbnails = showThumbnails.checked;

    locations.forEach(location => {
        const card = document.createElement('div');
        card.className = 'location-card';

        // Bild hinzufügen, falls verfügbar
        if (location.has_image || location.image_type) {
            const img = document.createElement('img');
            img.className = 'location-image';
            img.alt = location.title;
            
            // Thumbnail oder Vollbild verwenden
            const thumbParam = useThumbnails ? '?thumb=true' : '';
            img.src = `${API_URL}/api/locations/${location.id}/image${thumbParam}`;
            
            // Cookie für die Bildanfrage hinzufügen
            img.setAttribute('crossorigin', 'use-credentials');
            
            // Error-Handler für Bilder
            img.onerror = () => {
                img.src = 'https://via.placeholder.com/250x150?text=Kein+Bild';
                img.alt = 'Bild nicht verfügbar';
            };
            
            card.appendChild(img);
        } else {
            const placeholderDiv = document.createElement('div');
            placeholderDiv.className = 'location-image';
            placeholderDiv.style.backgroundColor = '#f0f0f0';
            placeholderDiv.style.display = 'flex';
            placeholderDiv.style.alignItems = 'center';
            placeholderDiv.style.justifyContent = 'center';
            placeholderDiv.textContent = 'Kein Bild';
            card.appendChild(placeholderDiv);
        }

        // Informationen hinzufügen
        const info = document.createElement('div');
        info.className = 'location-info';
        
        const title = document.createElement('h3');
        title.textContent = location.title;
        
        const date = document.createElement('p');
        date.textContent = `Datum: ${location.date || 'Nicht angegeben'}`;
        
        const actions = document.createElement('div');
        actions.className = 'location-actions';
        
        // Löschen-Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Löschen';
        deleteBtn.onclick = () => deleteLocation(location.id);
        
        info.appendChild(title);
        info.appendChild(date);
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
            headers: {
                'Cookie': sessionCookie
            }
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