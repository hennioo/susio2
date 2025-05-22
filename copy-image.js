const fs = require('fs');
const path = require('path');

try {
  // Quelle: Das Bild aus dem attachments-Verzeichnis
  const sourceFile = path.join(__dirname, 'attached_assets', 'IMG_5170.jpeg');
  
  // Ziel: Das public-Verzeichnis
  const destFile = path.join(__dirname, 'public', 'couple-profile-photo.jpg');
  
  console.log(`Kopiere von ${sourceFile} nach ${destFile}`);
  
  // Kopieren der Datei
  fs.copyFileSync(sourceFile, destFile);
  
  console.log('Bild wurde erfolgreich kopiert!');
} catch (error) {
  console.error('Fehler beim Kopieren des Bildes:', error);
}