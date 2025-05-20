// Globale Variablen
let allLocations = [];

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    // Karte initialisieren
    if (document.getElementById('map')) {
        initMap();
        
        // Standorte laden
        loadLocations().then(locations => {
            allLocations = locations;
        });
        
        // Sidebar-Events
        initializeSidebar();
        
        // Button-Events für Map-Seite
        initializeMapButtons();
        
        // Formular für Standort-Erstellung
        initializeLocationForm();
        
        // Admin-Bereich
        initializeAdminArea();
        
        // Info-Fenster
        initializeInfoWindow();
    }
});

// Sidebar initialisieren
function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    // Sidebar öffnen
    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
    });
    
    // Sidebar schließen
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
    
    // Suchen (Live-Filterung)
    searchInput.addEventListener('input', () => {
        filterLocations(searchInput.value.trim().toLowerCase());
    });
    
    // Suche zurücksetzen
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterLocations('');
    });
}

// Map-spezifische Buttons initialisieren
function initializeMapButtons() {
    const addLocationBtn = document.getElementById('add-location-btn');
    
    // "Standort hinzufügen" Button
    addLocationBtn.addEventListener('click', () => {
        addLocationMode = !addLocationMode;
        updateAddLocationButton();
        
        // Falls Modus beendet, temporären Marker entfernen
        if (!addLocationMode && tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
    });
}

// Formular für Standort-Erstellung
function initializeLocationForm() {
    const form = document.getElementById('location-form');
    const closeFormBtn = document.getElementById('close-form-btn');
    const formBackdrop = document.getElementById('form-backdrop');
    
    // Formular schließen
    closeFormBtn.addEventListener('click', closeAddLocationForm);
    formBackdrop.addEventListener('click', closeAddLocationForm);
    
    // Formular absenden
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('location-title').value;
        const description = document.getElementById('location-description').value;
        const date = document.getElementById('location-date').value;
        const imageInput = document.getElementById('location-image');
        const feedback = document.getElementById('form-feedback');
        
        // Koordinaten aus Formular-Datensatz
        const lat = parseFloat(form.dataset.lat);
        const lng = parseFloat(form.dataset.lng);
        
        if (!lat || !lng) {
            showFormFeedback(feedback, 'Bitte wähle einen Ort auf der Karte aus.', 'error');
            return;
        }
        
        // Submit-Button deaktivieren während des Speicherns
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Speichern...';
        
        try {
            // Standort-Daten senden
            const locationData = {
                title,
                description,
                latitude: lat,
                longitude: lng,
                date,
            };
            
            const response = await fetch(`${API_URL}/api/locations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(locationData)
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Speichern des Standorts');
            }
            
            const locationResult = await response.json();
            const locationId = locationResult.id;
            
            // Bild hochladen, falls ausgewählt
            if (imageInput.files && imageInput.files[0]) {
                const imageFile = imageInput.files[0];
                await uploadImage(locationId, imageFile);
            }
            
            // Erfolg-Feedback und Formular schließen
            showFormFeedback(feedback, 'Standort erfolgreich gespeichert!', 'success');
            
            // Standorte neu laden und Formular zurücksetzen
            await loadLocations();
            
            // Nach kurzer Verzögerung das Formular schließen
            setTimeout(() => {
                closeAddLocationForm();
                form.reset();
            }, 1500);
            
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showFormFeedback(feedback, `Fehler beim Speichern: ${error.message}`, 'error');
        } finally {
            // Submit-Button wiederherstellen
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// Bild für einen Standort hochladen
async function uploadImage(locationId, imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await fetch(`${API_URL}/api/locations/${locationId}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Hochladen des Bildes');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Bild-Upload fehlgeschlagen:', error);
        throw error;
    }
}

// Standorte in der Sidebar anzeigen
function populateLocationsList(locations) {
    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    
    if (!locations || locations.length === 0) {
        locationsList.innerHTML = '<p class="text-center py-4 text-muted">Keine Standorte gefunden</p>';
        return;
    }
    
    locations.forEach(location => {
        const item = document.createElement('div');
        item.className = 'location-item';
        item.dataset.id = location.id;
        
        // Thumbnail
        const thumbContainer = document.createElement('div');
        const thumb = document.createElement('img');
        thumb.className = 'location-thumb';
        thumb.alt = location.title;
        
        if (location.has_image || location.image_type) {
            thumb.src = `${API_URL}/api/locations/${location.id}/image?thumb=true`;
            thumb.onerror = () => {
                thumb.src = '/placeholder.svg';
            };
        } else {
            thumb.src = '/placeholder.svg';
        }
        
        thumbContainer.appendChild(thumb);
        
        // Info-Text
        const info = document.createElement('div');
        info.className = 'location-info';
        
        const title = document.createElement('div');
        title.className = 'location-title';
        title.textContent = location.title || 'Unbenannter Standort';
        
        const date = document.createElement('div');
        date.className = 'location-date';
        date.textContent = location.date ? formatDate(location.date) : '';
        
        info.appendChild(title);
        info.appendChild(date);
        
        // Item zusammenbauen
        item.appendChild(thumbContainer);
        item.appendChild(info);
        
        // Click-Event
        item.addEventListener('click', () => {
            // Sidebar schließen auf mobilen Geräten
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
            
            // Info-Fenster anzeigen
            showLocationInfo(location);
            
            // Karte auf Marker zentrieren
            const marker = markers.find(m => m.locationId === location.id);
            if (marker) {
                map.setView(marker.getLatLng(), 14);
                selectedMarker = marker;
            }
        });
        
        locationsList.appendChild(item);
    });
}

// Standorte filtern basierend auf Suchbegriff
function filterLocations(searchTerm) {
    if (!searchTerm) {
        // Wenn kein Suchbegriff, alle Standorte anzeigen
        populateLocationsList(allLocations);
        return;
    }
    
    // Standorte filtern, deren Titel oder Beschreibung den Suchbegriff enthalten
    const filteredLocations = allLocations.filter(location => {
        const titleMatch = location.title && location.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = location.description && location.description.toLowerCase().includes(searchTerm);
        return titleMatch || descriptionMatch;
    });
    
    populateLocationsList(filteredLocations);
}

// Admin-Bereich initialisieren
function initializeAdminArea() {
    const adminBtn = document.getElementById('admin-btn');
    const backToMapBtn = document.getElementById('back-to-map-btn');
    const adminContainer = document.getElementById('admin-container');
    const mapContainer = document.getElementById('map');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profileUploadInput = document.getElementById('profile-upload');
    const profilePreview = document.getElementById('profile-preview');
    
    // Admin-Bereich öffnen
    adminBtn.addEventListener('click', async () => {
        // Admin-Statistiken laden
        await loadAdminStats();
        
        // UI umschalten
        adminContainer.style.display = 'block';
        mapContainer.style.display = 'none';
        
        // Sidebar schließen
        document.getElementById('sidebar').classList.remove('active');
    });
    
    // Zurück zur Karte
    backToMapBtn.addEventListener('click', () => {
        adminContainer.style.display = 'none';
        mapContainer.style.display = 'block';
    });
    
    // Profilbild-Vorschau
    profileUploadInput.addEventListener('change', () => {
        if (profileUploadInput.files && profileUploadInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(profileUploadInput.files[0]);
        }
    });
    
    // Profilbild speichern
    saveProfileBtn.addEventListener('click', async () => {
        if (!profileUploadInput.files || !profileUploadInput.files[0]) {
            showFormFeedback(document.getElementById('profile-feedback'), 
                           'Bitte wähle ein Bild aus', 'error');
            return;
        }
        
        const file = profileUploadInput.files[0];
        const formData = new FormData();
        formData.append('profile_image', file);
        
        try {
            // Hier würde im realen System ein Profilbild-Upload erfolgen
            // Da wir das noch nicht implementiert haben, speichern wir es lokal
            const reader = new FileReader();
            reader.onload = function(e) {
                // Profilbild in localStorage speichern
                localStorage.setItem('profileImage', e.target.result);
                
                // Profilbild überall aktualisieren
                updateProfileImage(e.target.result);
                
                showFormFeedback(document.getElementById('profile-feedback'), 
                               'Profilbild erfolgreich gespeichert', 'success');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            showFormFeedback(document.getElementById('profile-feedback'), 
                           `Fehler beim Speichern: ${error.message}`, 'error');
        }
    });
    
    // Gespeichertes Profilbild laden, falls vorhanden
    loadProfileImage();
}

// Admin-Statistiken laden
async function loadAdminStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Statistiken');
        }
        
        const data = await response.json();
        
        // Statistik-Werte anzeigen
        document.getElementById('total-locations').textContent = data.data.totalLocations || 0;
        document.getElementById('total-images').textContent = data.data.totalImages || 0;
        document.getElementById('database-size').textContent = data.data.databaseSizeMB || 0;
        
        // Letzte Standorte anzeigen
        const recentLocationsList = document.getElementById('recent-locations-list');
        recentLocationsList.innerHTML = '';
        
        if (data.data.recentLocations && data.data.recentLocations.length > 0) {
            data.data.recentLocations.forEach(location => {
                const listItem = document.createElement('a');
                listItem.className = 'list-group-item list-group-item-action bg-dark-subtle border-secondary';
                listItem.href = '#';
                
                const title = document.createElement('div');
                title.className = 'd-flex justify-content-between align-items-center';
                title.innerHTML = `
                    <strong>${location.title || 'Unbenannter Standort'}</strong>
                    <span class="badge bg-orange">${formatDate(location.createdAt)}</span>
                `;
                
                listItem.appendChild(title);
                
                // Click-Event: Admin-Bereich schließen und zum Standort navigieren
                listItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Admin-Bereich ausblenden, Karte anzeigen
                    document.getElementById('admin-container').style.display = 'none';
                    document.getElementById('map').style.display = 'block';
                    
                    // Suche den Standort in allLocations
                    const locationDetails = allLocations.find(loc => loc.id === location.id);
                    if (locationDetails) {
                        // Info-Fenster anzeigen
                        showLocationInfo(locationDetails);
                        
                        // Karte auf Marker zentrieren
                        const marker = markers.find(m => m.locationId === location.id);
                        if (marker) {
                            map.setView(marker.getLatLng(), 14);
                            selectedMarker = marker;
                        }
                    }
                });
                
                recentLocationsList.appendChild(listItem);
            });
        } else {
            recentLocationsList.innerHTML = '<div class="p-3 text-center text-muted">Keine Standorte vorhanden</div>';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Admin-Statistiken:', error);
    }
}

// Info-Fenster-Schließen-Button initialisieren
function initializeInfoWindow() {
    const closeInfoBtn = document.getElementById('close-info-btn');
    
    closeInfoBtn.addEventListener('click', closeLocationInfo);
}

// Profilbild initialisieren
function loadProfileImage() {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
        updateProfileImage(savedImage);
    } else {
        // Einfaches Platzhalter-Profilbild als Base64 (orange Kreis auf dunklem Hintergrund)
        const defaultProfileImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzIyMjIyMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0NSIgZmlsbD0iI2ZmOGMwMCIvPjxyZWN0IHg9IjUwIiB5PSIxNDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iNTAiIHJ4PSIyNSIgZmlsbD0iI2ZmOGMwMCIvPjwvc3ZnPg==';
        updateProfileImage(defaultProfileImage);
    }
}

// Profilbild überall aktualisieren
function updateProfileImage(imageUrl) {
    document.getElementById('profile-image').src = imageUrl;
    document.getElementById('profile-preview').src = imageUrl;
}

// Feedback-Anzeige für Formulare
function showFormFeedback(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = type === 'error' 
        ? 'alert alert-danger mt-3' 
        : 'alert alert-success mt-3';
    element.style.display = 'block';
}