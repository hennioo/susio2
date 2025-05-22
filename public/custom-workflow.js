const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Statische Dateien aus dem public-Ordner bereitstellen
app.use(express.static(path.join(__dirname)));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Custom UI-Server läuft auf Port ${PORT}`);
  console.log(`Die Darkmode-UI ist verfügbar unter: http://localhost:${PORT}/darkmode.html`);
});