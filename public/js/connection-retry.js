// Verbindungs-Retry-Manager für zuverlässige API-Kommunikation
// Besonders wichtig für Render, wo der Server manchmal länger zum Hochfahren braucht

/**
 * Führt eine Fetch-Anfrage mit automatischen Wiederholungen bei Netzwerkfehlern aus
 * @param {string} url - Die URL für die Anfrage
 * @param {object} options - Die Fetch-Optionen
 * @param {number} maxRetries - Maximale Anzahl an Wiederholungen (Standard: 3)
 * @param {number} baseDelay - Basisverzögerung in ms (Standard: 500)
 * @returns {Promise<Response>} - Die Fetch-Response
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3, baseDelay = 500) {
    let lastError;
    
    // Status-Element erstellen oder finden
    let statusElement = document.getElementById('connection-status');
    if (!statusElement && document.body) {
        statusElement = document.createElement('div');
        statusElement.id = 'connection-status';
        statusElement.style.position = 'fixed';
        statusElement.style.top = '0';
        statusElement.style.left = '0';
        statusElement.style.right = '0';
        statusElement.style.padding = '10px';
        statusElement.style.backgroundColor = '#f8d7da';
        statusElement.style.color = '#721c24';
        statusElement.style.textAlign = 'center';
        statusElement.style.zIndex = '9999';
        statusElement.style.display = 'none';
        document.body.prepend(statusElement);
    }
    
    // Wiederholungsversuche
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Bei Wiederholungen Status anzeigen
            if (attempt > 0 && statusElement) {
                statusElement.textContent = `Verbindung zum Server wird hergestellt... (Versuch ${attempt}/${maxRetries})`;
                statusElement.style.display = 'block';
            }
            
            const response = await fetch(url, options);
            
            // Erfolgreiche Antwort - Status entfernen und zurückgeben
            if (statusElement) {
                statusElement.style.display = 'none';
            }
            return response;
            
        } catch (error) {
            console.error(`Fetch-Versuch ${attempt + 1}/${maxRetries + 1} fehlgeschlagen:`, error);
            lastError = error;
            
            // Bei letztem Versuch nicht mehr warten
            if (attempt === maxRetries) break;
            
            // Exponentielles Backoff berechnen (500ms, 1000ms, 2000ms, ...)
            const delay = baseDelay * Math.pow(2, attempt);
            
            // Status anzeigen
            if (statusElement) {
                statusElement.textContent = `Verbindungsfehler, wiederhole in ${delay/1000} Sekunden... (Versuch ${attempt + 1}/${maxRetries})`;
                statusElement.style.display = 'block';
            }
            
            // Warten vor dem nächsten Versuch
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // Alle Versuche fehlgeschlagen
    if (statusElement) {
        statusElement.textContent = 'Verbindung zum Server nicht möglich. Bitte später erneut versuchen.';
        statusElement.style.display = 'block';
        
        // Nach 5 Sekunden ausblenden
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
    
    throw lastError;
}

// In globalen Namespace exportieren
window.fetchWithRetry = fetchWithRetry;