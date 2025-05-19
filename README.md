# Node.js PostgreSQL Locations API

Eine robuste Node.js-PostgreSQL-Anwendung mit fortschrittlicher Bildupload- und Standortverwaltung, umfassender API-Testabdeckung, sicherer Sitzungsauthentifizierung und intelligenter Bildverarbeitung.

## Hauptfunktionen

- Express.js-Backend mit RESTful API-Design
- Supabase PostgreSQL-Integration
- Base64-Bildupload mit Größen- und Formatvalidierung
- Sharp-Bildbearbeitungsbibliothek für effiziente Verarbeitung
- Multer-Dateiverarbeitung mit Größenbeschränkungen
- Umfassende Bildvalidierung und Thumbnail-Erstellung
- Sichere sitzungsbasierte Authentifizierung mit Zugangscode

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Bearbeite .env und füge DATABASE_URL und ACCESS_CODE hinzu
```

## Entwicklung

```bash
# Server starten
node server.js

# Tests ausführen
node test-backend.js
node test-upload.js
node test-multiple-locations.js
node test-delete-location.js
```

## API-Endpunkte

### Authentifizierung
- `POST /verify-access` - Zugangscode überprüfen und Sitzung erstellen

### Standorte
- `GET /api/locations` - Alle Standorte abrufen
- `GET /api/locations/:id` - Einzelnen Standort abrufen
- `POST /api/locations` - Neuen Standort erstellen
- `PUT /api/locations/:id` - Standort aktualisieren
- `DELETE /api/locations/:id` - Standort und zugehörige Bilddaten löschen

### Bildupload
- `POST /api/locations/:id/upload` - Bild zu einem Standort hochladen
- `GET /api/locations/:id/image` - Bild eines Standorts abrufen
- `GET /api/locations/:id/image?thumb=true` - Thumbnail eines Standorts abrufen

## Deployment auf Render

### Voraussetzungen

1. GitHub-Repository mit dem Projekt
2. Render.com-Konto
3. PostgreSQL-Datenbank (z.B. über Render oder Supabase)

### Schritte zum Deployment

1. Auf Render.com anmelden
2. Web Service erstellen und mit dem GitHub-Repository verbinden
3. Folgende Einstellungen konfigurieren:
   - **Name**: node-postgresql-locations-api
   - **Umgebung**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Auto-Deploy**: Aktiviert

4. Umgebungsvariablen hinzufügen:
   - `DATABASE_URL`: PostgreSQL-Verbindungsstring
   - `ACCESS_CODE`: Sicherer Zugangscode für die Authentifizierung
   - `PORT`: 10000 (oder ein anderer Port)

5. Web Service deployen

### Automatisiertes Deployment

Du kannst auch die `render.yaml`-Datei in diesem Repository verwenden, um einen Web Service über Render Blueprint zu erstellen:

```yaml
services:
  - type: web
    name: node-postgresql-locations-api
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: ACCESS_CODE
        sync: false
      - key: PORT
        value: 10000
    healthCheckPath: /
```

## Datenbankschema

Die Anwendung verwendet zwei Tabellen:

### `locations`
- `id`: Primärschlüssel
- `title`: Titel des Standorts
- `description`: Beschreibung des Standorts
- `latitude`: Breitengrad
- `longitude`: Längengrad
- `date`: Datum
- `image`: Bildname
- `thumbnail`: Thumbnail-Name
- `image_type`: MIME-Typ des Bildes
- `created_at`: Erstellungszeitpunkt
- `image_name`: Originaler Dateiname
- `image_data`: Base64-kodierte Bilddaten
- `thumbnail_data`: Base64-kodierte Thumbnail-Daten

### `couple_image`
- Tabelle für zukünftige Erweiterungen

## Tests

Umfassende Tests für alle API-Funktionen sind verfügbar:

- `test-backend.js` - Grundlegende API-Tests
- `test-upload.js` - Tests für Bild-Upload und -Abruf
- `test-multiple-locations.js` - Tests für mehrere Standorte mit unterschiedlichen Bildern
- `test-delete-location.js` - Tests für das Löschen von Standorten mit Bilddaten

## Lizenz

ISC