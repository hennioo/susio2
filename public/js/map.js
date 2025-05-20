// Leaflet Karte initialisieren
let map;
let markers = [];
let selectedMarker = null;
let addLocationMode = false;
let tempMarker = null;

// Marker Icon für Standorte erstellen
function createMarkerIcon() {
    return L.divIcon({
        className: 'custom-marker-icon',
        html: '<i class="fas fa-map-marker-alt"></i>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

// Karte initialisieren
function initMap() {
    // Karte erstellen
    map = L.map('map').setView([51.1657, 10.4515], 6); // Deutschland-Zentrum
    
    // Dark Theme Karten-Layer hinzufügen
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Click-Handler für das Hinzufügen neuer Standorte
    map.on('click', function(e) {
        if (addLocationMode) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Temporären Marker entfernen, falls vorhanden
            if (tempMarker) {
                map.removeLayer(tempMarker);
            }
            
            // Temporären Marker setzen
            tempMarker = L.marker([lat, lng], {
                icon: createMarkerIcon()
            }).addTo(map);
            
            // Formular mit Koordinaten vorbereiten
            document.getElementById('location-form').dataset.lat = lat;
            document.getElementById('location-form').dataset.lng = lng;
            
            // Formular anzeigen
            showAddLocationForm();
        }
    });
}

// Alle Standorte laden und auf der Karte anzeigen
async function loadLocations() {
    try {
        const response = await fetch(`${API_URL}/api/locations`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Standorte');
        }
        
        const locations = await response.json();
        
        // Alle bestehenden Marker entfernen
        clearMarkers();
        
        // Marker für jeden Standort erstellen
        locations.forEach(location => {
            addMarkerToMap(location);
        });
        
        // Sidebar mit Standorten füllen
        populateLocationsList(locations);
        
        return locations;
    } catch (error) {
        console.error('Fehler beim Laden der Standorte:', error);
        return [];
    }
}

// Marker auf der Karte hinzufügen
function addMarkerToMap(location) {
    if (location.latitude && location.longitude) {
        const marker = L.marker([location.latitude, location.longitude], {
            icon: createMarkerIcon()
        }).addTo(map);
        
        // Marker-Klick-Handler
        marker.on('click', () => {
            showLocationInfo(location);
            selectedMarker = marker;
        });
        
        // Speichere Standort-ID im Marker für spätere Referenz
        marker.locationId = location.id;
        
        // Marker zum Array hinzufügen
        markers.push(marker);
    }
}

// Alle Marker von der Karte entfernen
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

// Standort-Info-Fenster anzeigen
function showLocationInfo(location) {
    const infoWindow = document.getElementById('info-window');
    const infoTitle = document.getElementById('info-title');
    const infoDate = document.getElementById('info-date');
    const infoDescription = document.getElementById('info-description');
    const infoImage = document.getElementById('info-image');
    
    // Daten füllen
    infoTitle.textContent = location.title || 'Unbenannter Standort';
    infoDate.textContent = location.date ? `Datum: ${formatDate(location.date)}` : '';
    infoDescription.textContent = location.description || '';
    
    // Bild anzeigen wenn vorhanden
    if (location.has_image || location.image_type) {
        infoImage.src = `${API_URL}/api/locations/${location.id}/image`;
        infoImage.style.display = 'block';
        
        // Fehlerbehandlung für Bilder
        infoImage.onerror = () => {
            infoImage.src = '/placeholder.svg';
            infoImage.alt = 'Kein Bild vorhanden';
        };
    } else {
        infoImage.src = '/placeholder.svg';
        infoImage.alt = 'Kein Bild vorhanden';
        infoImage.style.display = 'block';
    }
    
    // Info-Fenster anzeigen
    infoWindow.classList.add('active');
}

// Info-Fenster schließen
function closeLocationInfo() {
    const infoWindow = document.getElementById('info-window');
    infoWindow.classList.remove('active');
    selectedMarker = null;
}

// "Standort hinzufügen" Formular anzeigen
function showAddLocationForm() {
    const backdrop = document.getElementById('form-backdrop');
    const form = document.getElementById('add-location-form');
    
    // Aktuelles Datum vorausfüllen
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('location-date').value = today;
    
    // Formular anzeigen
    backdrop.classList.add('active');
    form.classList.add('active');
}

// "Standort hinzufügen" Formular schließen
function closeAddLocationForm() {
    const backdrop = document.getElementById('form-backdrop');
    const form = document.getElementById('add-location-form');
    
    // Formular ausblenden
    backdrop.classList.remove('active');
    form.classList.remove('active');
    
    // Temporären Marker entfernen
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
    
    // Standort-Hinzufügen-Modus beenden
    addLocationMode = false;
    updateAddLocationButton();
}

// Datum formatieren (YYYY-MM-DD -> DD.MM.YYYY)
function formatDate(dateString) {
    if (!dateString) return '';
    
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// "Standort hinzufügen" Button updaten
function updateAddLocationButton() {
    const addBtn = document.getElementById('add-location-btn');
    const icon = addBtn.querySelector('i');
    
    if (addLocationMode) {
        icon.className = 'fas fa-times';
        addBtn.title = 'Abbrechen';
    } else {
        icon.className = 'fas fa-plus';
        addBtn.title = 'Standort hinzufügen';
    }
}