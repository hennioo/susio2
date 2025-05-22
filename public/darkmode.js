// API URL Konfiguration - vereinfacht für Render-Kompatibilität
const API_URL = ''; // Leerer String verwendet relative URLs, die immer zum aktuellen Host führen

// Versuche, die Verbindung zum Backend zu prüfen
async function checkApiConnection() {
    const connectionStatus = document.getElementById('connection-status');
    
    try {
        const response = await fetch('/api-info', {
            method: 'GET',
            // Kein credentials: 'include' bei dieser Prüfung nötig
        });
        
        if (response.ok) {
            connectionStatus.textContent = 'Verbindung zum Server hergestellt ✓';
            connectionStatus.className = 'connection-status success';
            return true;
        } else {
            connectionStatus.textContent = 'Verbindungsproblem: Server antwortet, aber mit Status ' + response.status;
            connectionStatus.className = 'connection-status error';
            return false;
        }
    } catch (error) {
        connectionStatus.textContent = 'Verbindungsproblem: ' + error.message;
        connectionStatus.className = 'connection-status error';
        return false;
    }
}

// API-Verbindung beim Laden prüfen
document.addEventListener('DOMContentLoaded', checkApiConnection);

// Globale Variablen
let map;
let allLocations = [];
let markers = [];
let addLocationMode = false;
let selectedLocationCoordinates = null;
let isAuthenticated = false;

// DOM Elemente
const loginContainer = document.getElementById('login-container');
const loginForm = document.getElementById('login-form');
const accessCodeInput = document.getElementById('access-code');
const authMessage = document.getElementById('auth-message');
const sidebar = document.getElementById('sidebar');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const locationsListContainer = document.getElementById('locations-list');
const totalLocationsEl = document.getElementById('total-locations');
const totalImagesEl = document.getElementById('total-images');
const databaseSizeEl = document.getElementById('database-size');
const logoutButton = document.getElementById('logout-button');
const addButton = document.getElementById('add-button');
const menuButton = document.getElementById('menu-button');
const addLocationForm = document.getElementById('add-location-form');
const locationForm = document.getElementById('location-form');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const dateInput = document.getElementById('date');
const cancelButton = document.getElementById('cancel-button');
const formMessage = document.getElementById('form-message');
const locationPopup = document.getElementById('location-popup');
const popupImage = document.getElementById('popup-image');
const popupTitle = document.getElementById('popup-title');
const popupDescription = document.getElementById('popup-description');
const popupDate = document.getElementById('popup-date');
const popupClose = document.querySelector('.popup-close');
const overlay = document.getElementById('overlay');
const closeButton = document.querySelector('.close-button');

// Beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    // Heutiges Datum im Formular vorausfüllen
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    dateInput.value = formattedDate;
    
    // Event Listener hinzufügen
    loginForm.addEventListener('submit', handleLogin);
    logoutButton.addEventListener('click', handleLogout);
    addButton.addEventListener('click', toggleAddLocationMode);
    menuButton.addEventListener('click', toggleSidebar);
    closeButton.addEventListener('click', toggleSidebar);
    searchInput.addEventListener('input', filterLocations);
    clearSearchBtn.addEventListener('click', clearSearch);
    locationForm.addEventListener('submit', createLocation);
    cancelButton.addEventListener('click', cancelAddLocation);
    popupClose.addEventListener('click', closeLocationPopup);
    overlay.addEventListener('click', () => {
        hideAddLocationForm();
        closeLocationPopup();
    });
    
    // Authentifizierungsstatus prüfen
    checkAuthStatus();
});

// Authentifizierungsstatus prüfen
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/locations', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            // User ist authentifiziert
            isAuthenticated = true;
            showMap();
            fetchLocations();
            fetchStats();
            loginContainer.style.display = 'none';
        } else {
            // User ist nicht authentifiziert
            isAuthenticated = false;
            loginContainer.style.display = 'flex';
        }
    } catch (error) {
        console.error('Authentifizierungsprüfung fehlgeschlagen:', error);
        isAuthenticated = false;
        loginContainer.style.display = 'flex';
    }
}

// Login Handler
async function handleLogin(event) {
    event.preventDefault();
    
    const accessCode = accessCodeInput.value.trim();
    if (!accessCode) {
        showAuthMessage('Bitte gib den Zugangscode ein.');
        return;
    }
    
    try {
        console.log('Sende Login-Anfrage...');
        
        const response = await fetch('/verify-access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ accessCode })
        });
        
        console.log('Login-Antwort erhalten:', response.status);
        
        const data = await response.json();
        console.log('Login-Daten:', data);
        
        if (response.ok && !data.error) {
            isAuthenticated = true;
            loginContainer.style.display = 'none';
            showMap();
            fetchLocations();
            fetchStats();
        } else {
            showAuthMessage(data.message || 'Ungültiger Zugangscode.');
        }
    } catch (error) {
        console.error('Login-Fehler:', error);
        showAuthMessage(`Anmeldung fehlgeschlagen: ${error.message}`);
    }
}

// Logout Handler
async function handleLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && !data.error) {
            isAuthenticated = false;
            loginContainer.style.display = 'flex';
            sidebar.classList.remove('open');
            
            // Cookie manuell löschen (als Fallback)
            document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            
            // Map entfernen, falls vorhanden
            if (map) {
                map.remove();
                map = null;
            }
        } else {
            alert('Abmeldung fehlgeschlagen: ' + (data.message || 'Unbekannter Fehler'));
        }
    } catch (error) {
        alert(`Abmeldung fehlgeschlagen: ${error.message}`);
    }
}

// Karte anzeigen
function showMap() {
    map = L.map('map-container').setView([51.1657, 10.4515], 6); // Deutschland Zentrum
    
    // Dunkles Kartenthema von CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Click-Event für Ort hinzufügen
    map.on('click', (e) => {
        if (addLocationMode) {
            selectedLocationCoordinates = e.latlng;
            latitudeInput.value = e.latlng.lat.toFixed(6);
            longitudeInput.value = e.latlng.lng.toFixed(6);
            showAddLocationForm();
        }
    });
}

// Standorte vom Backend abrufen
async function fetchLocations() {
    try {
        console.log('Rufe Standorte ab...');
        
        const response = await fetch('/api/locations', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Standorte-Antwort Status:', response.status);
        
        if (!response.ok) {
            console.error('Fehler beim Abrufen der Standorte, Status:', response.status);
            throw new Error('Standorte konnten nicht abgerufen werden');
        }
        
        const data = await response.json();
        console.log('Erhaltene Standorte:', data);
        
        if (Array.isArray(data)) {
            allLocations = data;
            
            // Marker auf der Karte platzieren
            displayLocationsOnMap(allLocations);
            
            // Standorte in der Sidebar anzeigen
            displayLocationsInSidebar(allLocations);
        } else {
            console.error('Unerwartetes Datenformat für Standorte:', data);
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Standorte:', error);
    }
}

// Statistiken vom Backend abrufen
async function fetchStats() {
    try {
        console.log('Rufe Statistiken ab...');
        
        const response = await fetch('/api/stats', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('Statistiken-Antwort Status:', response.status);
        
        if (!response.ok) {
            console.error('Statistiken-Fehler:', response.status);
            throw new Error('Statistiken konnten nicht abgerufen werden');
        }
        
        const data = await response.json();
        console.log('Statistiken-Daten:', data);
        
        // Statistiken anzeigen
        if (data && data.data) {
            totalLocationsEl.textContent = data.data.totalLocations || '0';
            totalImagesEl.textContent = data.data.totalImages || '0';
            databaseSizeEl.textContent = data.data.databaseSizeMB || '0';
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Statistiken:', error);
    }
}

// Standorte auf der Karte darstellen
function displayLocationsOnMap(locations) {
    // Bestehende Marker entfernen
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    
    // Benutzerdefiniertes Marker-Icon
    const customIcon = L.icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    
    console.log('Verarbeite Standorte für Karte:', locations);
    
    // Neue Marker hinzufügen
    if (Array.isArray(locations)) {
        locations.forEach(location => {
            // Prüfen ob die Standortdaten numerische Koordinaten enthalten
            const lat = parseFloat(location.latitude);
            const lng = parseFloat(location.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                console.log(`Füge Marker hinzu für: ${location.title} an [${lat}, ${lng}]`);
                const marker = L.marker([lat, lng], { icon: customIcon })
                    .addTo(map)
                    .on('click', () => showLocationDetails(location));
                
                markers.push(marker);
            } else {
                console.warn(`Ungültige Koordinaten für Standort: ${location.title}, lat: ${location.latitude}, lng: ${location.longitude}`);
            }
        });
    } else {
        console.error('Erhaltene Standorte sind kein Array:', locations);
    }
}

// Standorte in der Sidebar anzeigen
function displayLocationsInSidebar(locations) {
    locationsListContainer.innerHTML = '';
    
    if (!Array.isArray(locations) || locations.length === 0) {
        locationsListContainer.innerHTML = '<div class="no-locations">Keine Standorte gefunden</div>';
        return;
    }
    
    console.log('Zeige Standorte in Sidebar an:', locations);
    
    locations.forEach(location => {
        if (!location || typeof location !== 'object') {
            console.warn('Ungültiges Standortobjekt:', location);
            return;
        }
        
        const locationItem = document.createElement('div');
        locationItem.className = 'location-item';
        locationItem.onclick = () => showLocationDetails(location);
        
        const title = location.title || 'Unbenannter Standort';
        
        // Bild oder Platzhalter
        let imgSrc = '/placeholder.svg';
        if (location.has_image || location.image_type) {
            imgSrc = `/api/locations/${location.id}/image?thumb=true`;
        }
        
        locationItem.innerHTML = `
            <img src="${imgSrc}" alt="${title}" class="location-thumbnail" onerror="this.src='/placeholder.svg'">
            <div class="location-details">
                <div class="location-title">${title}</div>
                <div class="location-date">Datum: ${formatDate(location.date) || 'Nicht angegeben'}</div>
            </div>
        `;
        
        locationsListContainer.appendChild(locationItem);
    });
}

// Standort-Details anzeigen
function showLocationDetails(location) {
    if (!location || typeof location !== 'object') {
        console.error('Ungültiges Standortobjekt für Details:', location);
        return;
    }
    
    console.log('Zeige Details für Standort:', location);
    
    // Popup füllen
    popupTitle.textContent = location.title || 'Unbenannter Standort';
    popupDescription.textContent = location.description || 'Keine Beschreibung vorhanden';
    popupDate.textContent = `Datum: ${formatDate(location.date) || 'Nicht angegeben'}`;
    
    // Bild oder Platzhalter
    popupImage.src = '/placeholder.svg'; // Default zuerst setzen
    if (location.has_image || location.image_type) {
        try {
            popupImage.src = `/api/locations/${location.id}/image`;
            popupImage.onerror = () => {
                console.warn(`Bild für Standort ${location.id} konnte nicht geladen werden`);
                popupImage.src = '/placeholder.svg';
            };
        } catch (error) {
            console.error('Fehler beim Laden des Standortbildes:', error);
            popupImage.src = '/placeholder.svg';
        }
    }
    
    // Popup anzeigen
    locationPopup.style.display = 'block';
    
    // Karte zum Standort zentrieren
    try {
        const lat = parseFloat(location.latitude);
        const lng = parseFloat(location.longitude);
        
        if (!isNaN(lat) && !isNaN(lng) && map) {
            console.log(`Zentriere Karte auf: [${lat}, ${lng}]`);
            map.setView([lat, lng], 15);
        } else {
            console.warn('Ungültige Koordinaten für Kartenzentrierung:', location.latitude, location.longitude);
        }
    } catch (error) {
        console.error('Fehler beim Zentrieren der Karte:', error);
    }
}

// Schließen des Standort-Popups
function closeLocationPopup() {
    locationPopup.style.display = 'none';
}

// Toggle Sidebar
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// Standorte filtern
function filterLocations() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayLocationsInSidebar(allLocations);
        return;
    }
    
    const filteredLocations = allLocations.filter(location => {
        const titleMatch = location.title && location.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = location.description && location.description.toLowerCase().includes(searchTerm);
        return titleMatch || descriptionMatch;
    });
    
    displayLocationsInSidebar(filteredLocations);
}

// Suchfeld leeren
function clearSearch() {
    searchInput.value = '';
    displayLocationsInSidebar(allLocations);
}

// Toggle Add Location Mode
function toggleAddLocationMode() {
    addLocationMode = !addLocationMode;
    
    if (addLocationMode) {
        addButton.innerHTML = '<i class="fas fa-times"></i>';
        map.getContainer().style.cursor = 'crosshair';
    } else {
        addButton.innerHTML = '<i class="fas fa-plus"></i>';
        map.getContainer().style.cursor = '';
        hideAddLocationForm();
    }
}

// Formular zum Hinzufügen eines Ortes anzeigen
function showAddLocationForm() {
    addLocationForm.style.display = 'block';
    overlay.style.display = 'block';
}

// Formular zum Hinzufügen eines Ortes verstecken
function hideAddLocationForm() {
    addLocationForm.style.display = 'none';
    overlay.style.display = 'none';
    locationForm.reset();
    
    // Heutiges Datum wieder eintragen
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;
    
    formMessage.textContent = '';
}

// Abbrechen des Hinzufügens
function cancelAddLocation() {
    hideAddLocationForm();
    // Nicht den Add-Modus beenden
}

// Neuen Standort erstellen
async function createLocation(event) {
    event.preventDefault();
    
    if (!isAuthenticated) {
        showFormMessage('Bitte melde dich zuerst an.');
        return;
    }
    
    if (!selectedLocationCoordinates) {
        showFormMessage('Bitte wähle einen Ort auf der Karte aus.');
        return;
    }
    
    // Formulardaten sammeln
    const locationData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        latitude: selectedLocationCoordinates.lat,
        longitude: selectedLocationCoordinates.lng,
        date: document.getElementById('date').value
    };
    
    try {
        // Standort erstellen
        const response = await fetch('/api/locations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(locationData)
        });
        
        const data = await response.json();
        
        if (!response.ok || data.error) {
            throw new Error(data.message || 'Standort konnte nicht erstellt werden');
        }
        
        // Bild hochladen, falls vorhanden
        const imageFile = document.getElementById('image').files[0];
        if (imageFile) {
            await uploadImage(data.id, imageFile);
        }
        
        // UI zurücksetzen
        hideAddLocationForm();
        toggleAddLocationMode();
        
        // Daten aktualisieren
        fetchLocations();
        fetchStats();
        
    } catch (error) {
        showFormMessage(`Fehler: ${error.message}`);
    }
}

// Bild für Standort hochladen
async function uploadImage(locationId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
        const response = await fetch(`/api/locations/${locationId}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Bild konnte nicht hochgeladen werden');
        }
        
        return true;
    } catch (error) {
        console.error('Fehler beim Hochladen des Bildes:', error);
        return false;
    }
}

// Fehlermeldung im Auth-Bereich anzeigen
function showAuthMessage(message) {
    authMessage.textContent = message;
    authMessage.style.display = 'block';
}

// Fehlermeldung im Formular anzeigen
function showFormMessage(message) {
    formMessage.textContent = message;
    formMessage.style.display = 'block';
}

// Hilfsfunktion: Datum formatieren
function formatDate(dateString) {
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Falls kein gültiges Datum
        
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Fehler beim Formatieren des Datums:', error);
        return dateString; // Originaldatum zurückgeben im Fehlerfall
    }
}