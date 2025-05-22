// API URL Konfiguration - vereinfacht für Render-Kompatibilität
const API_URL = ''; // Leerer String verwendet relative URLs, die immer zum aktuellen Host führen

// Versuche, die Verbindung zum Backend zu prüfen
async function checkApiConnection() {
    const connectionStatus = document.getElementById('connection-status');
    
    try {
        console.log('Prüfe API-Verbindung...');
        const response = await fetch('/api-info', {
            method: 'GET',
            // Kein credentials: 'include' bei dieser Prüfung nötig
        });
        
        if (response.ok) {
            console.log('API-Verbindung hergestellt');
            connectionStatus.textContent = 'Verbindung zum Server hergestellt ✓';
            connectionStatus.className = 'connection-status success';
            return true;
        } else {
            console.error('API-Verbindungsproblem: Status', response.status);
            connectionStatus.textContent = 'Verbindungsproblem: Server antwortet, aber mit Status ' + response.status;
            connectionStatus.className = 'connection-status error';
            return false;
        }
    } catch (error) {
        console.error('API-Verbindungsproblem:', error);
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
let tempLocationMarker = null; // Variable für temporären Marker
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
// X-Button wurde entfernt
// const closeButton = document.querySelector('.close-button');

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
    // Close-Button wurde entfernt
    // closeButton.addEventListener('click', toggleSidebar);
    searchInput.addEventListener('input', filterLocations);
    clearSearchBtn.addEventListener('click', clearSearch);
    locationForm.addEventListener('submit', createLocation);
    cancelButton.addEventListener('click', cancelAddLocation);
    popupClose.addEventListener('click', closeLocationPopup);
    overlay.addEventListener('click', () => {
        hideAddLocationForm();
        closeLocationPopup();
    });
    
    // Löschen-Button-Event-Listener
    const deleteButton = document.getElementById('delete-location-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', handleDeleteLocation);
    }
    
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
    console.log('Initialisiere Karte...');
    
    if (map) {
        console.log('Karte existiert bereits, wird entfernt');
        map.remove();
    }
    
    try {
        // Karte mit Deutschland-Zentrum initialisieren und Grenzen setzen
        map = L.map('map-container', {
            zoomControl: false, // Deaktiviere Standard-Zoom-Controls
            maxBounds: L.latLngBounds(
                L.latLng(-85, -180),  // Südwestlicher Punkt (Minimal)
                L.latLng(85, 180)     // Nordöstlicher Punkt (Maximal)
            ),
            minZoom: 3,  // Minimaler Zoom begrenzen
            maxBoundsViscosity: 1.0  // Macht die Begrenzung fest (1.0 = keine Überschreitung möglich)
        }).setView([51.1657, 10.4515], 6);
        
        console.log('Karte initialisiert');
        
        // Füge Zoom-Controls an die untere linke Ecke hinzu
        L.control.zoom({
            position: 'bottomleft'
        }).addTo(map);
        
        // Dunkles Kartenthema von CartoDB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);
        
        console.log('Karten-Tiles hinzugefügt');
        
        // Click-Event für Ort hinzufügen
        map.on('click', (e) => {
            console.log('Kartenklick bei:', e.latlng);
            if (addLocationMode) {
                // Koordinaten speichern
                selectedLocationCoordinates = e.latlng;
                latitudeInput.value = e.latlng.lat.toFixed(6);
                longitudeInput.value = e.latlng.lng.toFixed(6);
                
                // Formular öffnen - aber mit einem kurzen Delay, damit die Karte
                // den Klick zuerst vollständig verarbeiten kann
                setTimeout(() => {
                    showAddLocationForm();
                    console.log("Formular sollte jetzt angezeigt werden");
                    
                    // Existierenden temporären Marker entfernen, falls vorhanden
                    if (tempLocationMarker) {
                        map.removeLayer(tempLocationMarker);
                    }
                    
                    // Neuen temporären Marker erstellen und speichern
                    tempLocationMarker = new L.Marker([e.latlng.lat, e.latlng.lng], {
                        icon: L.divIcon({
                            className: 'new-location-marker',
                            html: '<i class="fas fa-map-marker-alt" style="color: #ff7700; font-size: 24px;"></i>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 24]
                        })
                    }).addTo(map);
                }, 50);
            }
        });
        
        // Verzögerung hinzufügen, um sicherzustellen, dass die Karte korrekt gerendert wird
        setTimeout(() => {
            console.log('Karte neu berechnen...');
            map.invalidateSize();
        }, 100);
    } catch (error) {
        console.error('Fehler beim Initialisieren der Karte:', error);
    }
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
        
        const responseData = await response.json();
        console.log('Erhaltene Standorte:', responseData);
        
        // Korrektur für das Antwortformat von der API
        // Die API gibt {error: false, data: Array(3)} zurück
        let locationsArray;
        
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
            console.log('Standorte-Array gefunden in responseData.data');
            locationsArray = responseData.data;
        } else if (Array.isArray(responseData)) {
            console.log('responseData ist direkt ein Array');
            locationsArray = responseData;
        } else {
            console.error('Unerwartetes Datenformat für Standorte:', responseData);
            locationsArray = [];
        }
        
        console.log('Verarbeitete Standorte:', locationsArray);
        allLocations = locationsArray;
        
        // Marker auf der Karte platzieren
        displayLocationsOnMap(allLocations);
        
        // Standorte in der Sidebar anzeigen
        displayLocationsInSidebar(allLocations);
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
    console.log('==== MARKER DEBUG ====');
    console.log('Zeige Standorte auf Karte an, Anzahl:', locations ? locations.length : 0);
    
    if (!map) {
        console.error('Karte wurde noch nicht initialisiert! Initialisiere sie jetzt...');
        showMap();
        // Nach der Initialisierung erneut aufrufen
        setTimeout(() => displayLocationsOnMap(locations), 500);
        return;
    }
    
    try {
        // Bestehende Marker entfernen
        if (markers && markers.length) {
            console.log(`Entferne ${markers.length} bestehende Marker`);
            markers.forEach(marker => {
                try {
                    map.removeLayer(marker);
                } catch (e) {
                    console.warn('Fehler beim Entfernen des Markers:', e);
                }
            });
        }
        markers = [];
        
        // Standard-Icon verwenden (ohne angepasstes Icon, um Fehlerquellen zu reduzieren)
        console.log('Verarbeite Standorte für Karte:', locations);
        
        // Neue Marker hinzufügen
        if (Array.isArray(locations)) {
            // Test-Marker für Berlin wurde entfernt
            
            // Echte Standorte hinzufügen
            locations.forEach(location => {
                // Prüfen ob die Standortdaten numerische Koordinaten enthalten
                const lat = parseFloat(location.latitude);
                const lng = parseFloat(location.longitude);
                
                console.log(`Verarbeite Standort: ${location.title}, Koordinaten: [${lat}, ${lng}]`);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    console.log(`Füge Marker hinzu für: ${location.title} an [${lat}, ${lng}]`);
                    try {
                        // Erstelle ein benutzerdefiniertes Marker-Icon mit Vorschaubild
                        const customIcon = createCustomMarkerIcon(location);
                        
                        // Marker mit Klick-Ereignis für das Detailfenster und benutzerdefiniertem Icon
                        const marker = L.marker([lat, lng], { icon: customIcon })
                            .addTo(map)
                            .on('click', () => {
                                console.log(`Marker für ${location.title} wurde angeklickt`);
                                showLocationDetails(location);
                            });
                        
                        // Tooltip für bessere Benutzererfahrung
                        marker.bindTooltip(location.title);
                        
                        markers.push(marker);
                        console.log(`Marker für ${location.title} erfolgreich hinzugefügt`);
                    } catch (error) {
                        console.error(`Fehler beim Hinzufügen des Markers für ${location.title}:`, error);
                    }
                } else {
                    console.warn(`Ungültige Koordinaten für Standort: ${location.title}, lat: ${location.latitude}, lng: ${location.longitude}`);
                }
            });
            
            // Karte auf Deutschland zentrieren, falls keine Marker vorhanden sind
            if (markers.length <= 1) { // Nur der Test-Marker
                console.log('Keine echten Standorte gefunden, zentriere auf Deutschland');
                map.setView([51.1657, 10.4515], 6);
            } else {
                // Verzögerung für die Zentrierung der Marker
                setTimeout(() => {
                    try {
                        console.log(`Zentriere Karte auf ${markers.length} Marker`);
                        const group = new L.featureGroup(markers);
                        map.fitBounds(group.getBounds().pad(0.1));
                        console.log('Karte auf alle Marker zentriert');
                    } catch (error) {
                        console.error('Fehler beim Zentrieren der Karte auf Marker:', error);
                        // Fallback: Auf Deutschland zentrieren
                        map.setView([51.1657, 10.4515], 6);
                    }
                }, 500);
            }
        } else {
            console.error('Erhaltene Standorte sind kein Array:', locations);
            // Testmarker hinzufügen, wenn keine Standorte vorhanden sind
            const testMarker = L.marker([51.1657, 10.4515])
                .addTo(map)
                .bindPopup('Test-Marker für Deutschland');
            markers.push(testMarker);
        }
        
        // Karte neu zeichnen
        map.invalidateSize();
        console.log('Karte neu gezeichnet');
        
    } catch (error) {
        console.error('Fehler beim Anzeigen der Standorte auf der Karte:', error);
        // Notfall-Fallback: Versuch, einen einfachen Marker hinzuzufügen
        try {
            L.marker([51.1657, 10.4515]).addTo(map).bindPopup('Notfall-Marker');
            console.log('Notfall-Marker hinzugefügt');
        } catch (e) {
            console.error('Auch der Notfall-Marker konnte nicht hinzugefügt werden:', e);
        }
    }
}

// Standorte in der Sidebar anzeigen
function displayLocationsInSidebar(locations) {
    console.log('=== DEBUG: displayLocationsInSidebar ===');
    console.log('Erhaltene Standorte für Sidebar:', locations);
    
    locationsListContainer.innerHTML = '';
    
    if (!Array.isArray(locations) || locations.length === 0) {
        console.log('Keine Standorte zum Anzeigen gefunden');
        locationsListContainer.innerHTML = '<div class="no-locations">Keine Standorte gefunden</div>';
        return;
    }
    
    console.log(`Zeige ${locations.length} Standorte in Sidebar an`);
    
    locations.forEach(location => {
        if (!location || typeof location !== 'object') {
            console.warn('Ungültiges Standortobjekt:', location);
            return;
        }
        
        console.log('Verarbeite Standort für Sidebar:', location);
        
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
        console.log(`Standort "${title}" zur Sidebar hinzugefügt`);
    });
}

// Standort-Details anzeigen
function showLocationDetails(location) {
    if (!location || typeof location !== 'object') {
        console.error('Ungültiges Standortobjekt für Details:', location);
        return;
    }
    
    console.log('Zeige Details für Standort:', location);
    
    // Speichere die aktuelle Standort-ID für den Löschbutton
    locationPopup.dataset.locationId = location.id;
    
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
    
    // Karte nicht mehr zum Standort zentrieren - entfernt wie gewünscht
    try {
        // Entfernte Zentrierung der Karte, sodass die Karte im aktuellen Ausschnitt bleibt
        console.log('Keine Kartenzentrierung beim Klick auf Marker');
    } catch (error) {
        console.error('Fehler beim Zentrieren der Karte:', error);
    }
}

// Schließen des Standort-Popups
function closeLocationPopup() {
    locationPopup.style.display = 'none';
}

// Löschen eines Standorts
async function handleDeleteLocation() {
    const locationId = locationPopup.dataset.locationId;
    
    if (!locationId) {
        console.error('Keine Standort-ID gefunden');
        return;
    }
    
    // Bestätigung vom Benutzer einholen
    if (!confirm('Bist du sicher, dass du diesen Standort löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        return;
    }
    
    try {
        console.log(`Lösche Standort mit ID: ${locationId}`);
        
        const response = await fetch(`/api/locations/${locationId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Fehler beim Löschen des Standorts: ${response.status}`);
        }
        
        // Standort wurde erfolgreich gelöscht
        console.log('Standort erfolgreich gelöscht');
        
        // Popup schließen
        closeLocationPopup();
        
        // Standorte neu laden
        fetchLocations();
        fetchStats();
        
        // Feedback anzeigen
        alert('Standort wurde erfolgreich gelöscht.');
        
    } catch (error) {
        console.error('Fehler beim Löschen des Standorts:', error);
        alert(`Fehler beim Löschen: ${error.message}`);
    }
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
    
    // Hole das Benachrichtigungselement
    const mapNotification = document.getElementById('map-notification');
    
    if (addLocationMode) {
        // Aktiviere den Hinzufüge-Modus
        addButton.innerHTML = '<i class="fas fa-times"></i>';
        map.getContainer().style.cursor = 'crosshair';
        
        // Sidebar schließen, wenn geöffnet
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
        
        // Benachrichtigung anzeigen
        mapNotification.style.display = 'block';
        
        // Nach 5 Sekunden automatisch ausblenden
        setTimeout(() => {
            if (addLocationMode) {
                mapNotification.style.opacity = '0';
                setTimeout(() => {
                    if (addLocationMode) {
                        mapNotification.style.display = 'none';
                        mapNotification.style.opacity = '1';
                    }
                }, 500);
            }
        }, 5000);
    } else {
        // Deaktiviere den Hinzufüge-Modus
        addButton.innerHTML = '<i class="fas fa-plus"></i>';
        map.getContainer().style.cursor = '';
        hideAddLocationForm();
        
        // Benachrichtigung ausblenden
        mapNotification.style.display = 'none';
        
        // Temporären Marker entfernen, wenn vorhanden
        if (tempLocationMarker) {
            map.removeLayer(tempLocationMarker);
            tempLocationMarker = null;
        }
        
        // Koordinaten zurücksetzen
        selectedLocationCoordinates = null;
    }
}

// Formular zum Hinzufügen eines Ortes anzeigen
function showAddLocationForm() {
    console.log('Zeige Formular an...');
    overlay.style.display = 'block';
    addLocationForm.style.display = 'block';
    
    // Sicherstellen, dass das Formular über allem liegt
    addLocationForm.style.zIndex = '9999';
    overlay.style.zIndex = '9998';
    
    // Bessere Sichtbarkeit
    addLocationForm.style.opacity = '1';
    
    // Auf jeden Fall anzeigen!
    setTimeout(() => {
        if (window.getComputedStyle(addLocationForm).display === 'none') {
            console.log('Formular wird erzwungen angezeigt...');
            addLocationForm.style.display = 'block !important';
        }
    }, 100);
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
            // Korrektur: Zugriff auf die ID im korrekten Format der Serverantwort
            const locationId = data.data ? data.data.id : data.id;
            console.log('Hochladen von Bild für Standort ID:', locationId);
            await uploadImage(locationId, imageFile);
        }
        
        // Temporären Marker entfernen
        if (tempLocationMarker) {
            map.removeLayer(tempLocationMarker);
            tempLocationMarker = null;
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