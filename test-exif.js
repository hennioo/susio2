const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Funktion zum Lesen der EXIF-Orientierung eines Bildes
async function getImageOrientation(filePath) {
  try {
    // Lese Bild-Metadaten mit Sharp
    const metadata = await sharp(filePath).metadata();
    
    console.log('=== Bild-Informationen ===');
    console.log(`Datei: ${path.basename(filePath)}`);
    console.log(`Abmessungen: ${metadata.width} x ${metadata.height}`);
    console.log(`Format: ${metadata.format}`);
    
    // Spezifisch die Orientierungsinformation
    if (metadata.orientation) {
      console.log(`EXIF-Orientierung: ${metadata.orientation}`);
      
      // Interpretiere den Orientierungswert
      const orientationMeaning = {
        1: 'Normal (keine Rotation)',
        2: 'Horizontal gespiegelt',
        3: 'Um 180° gedreht',
        4: 'Vertikal gespiegelt',
        5: 'Um 90° gegen Uhrzeigersinn gedreht und horizontal gespiegelt',
        6: 'Um 90° im Uhrzeigersinn gedreht',
        7: 'Um 90° im Uhrzeigersinn gedreht und horizontal gespiegelt',
        8: 'Um 90° gegen Uhrzeigersinn gedreht'
      };
      
      console.log(`Bedeutung: ${orientationMeaning[metadata.orientation] || 'Unbekannt'}`);
    } else {
      console.log('Keine EXIF-Orientierungsinformation gefunden');
    }
    
    console.log('=========================\n');
  } catch (error) {
    console.error(`Fehler beim Lesen von ${filePath}:`, error.message);
  }
}

// Hauptfunktion
async function main() {
  // Prüfen Sie alle angegebenen Bilder
  const imagePaths = [];
  
  // Dateiverzeichnis nach .jpg, .jpeg und .png-Dateien durchsuchen
  const attachedAssetsDir = './attached_assets';
  
  try {
    const files = fs.readdirSync(attachedAssetsDir);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        imagePaths.push(path.join(attachedAssetsDir, file));
      }
    }
    
    if (imagePaths.length === 0) {
      console.log('Keine Bilder gefunden.');
      return;
    }
    
    console.log(`${imagePaths.length} Bilder gefunden, analysiere EXIF-Daten...\n`);
    
    // Analysiere jedes gefundene Bild
    for (const imagePath of imagePaths) {
      await getImageOrientation(imagePath);
    }
  } catch (error) {
    console.error('Fehler beim Suchen nach Bildern:', error.message);
  }
}

// Führe das Programm aus
main();