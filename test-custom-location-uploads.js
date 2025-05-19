const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Base URL for API
const API_BASE_URL = 'http://localhost:10000';

// Access code for authentication (from environment variable)
const ACCESS_CODE = process.env.ACCESS_CODE;

// Paths to the custom test images
const IMAGE_PATHS = {
  A: path.join(__dirname, 'attached_assets', 'IMG_5170.jpeg'),
  B: path.join(__dirname, 'attached_assets', 'IMG_5171.jpeg')
};

// Cookie jar to store session cookie between requests
let sessionCookie = null;
// Store created location IDs
let locationIds = {
  A: null,
  B: null
};

/**
 * Calculate a simple hash of an array buffer for comparison
 * @param {ArrayBuffer} buffer - The buffer to hash
 * @return {string} The hash as a hex string
 */
function calculateSimpleHash(buffer) {
  return crypto.createHash('md5').update(Buffer.from(buffer)).digest('hex');
}

/**
 * Helper function to extract and store session cookie
 * @param {object} response - Axios response object
 */
function storeSessionCookie(response) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader && setCookieHeader.length > 0) {
    // Extract the session cookie
    const cookies = setCookieHeader[0].split(';');
    sessionCookie = cookies[0]; // Format: sessionId=value
    console.log('Session cookie stored:', sessionCookie);
  }
}

/**
 * Test 1: Login and session creation
 */
async function testLogin() {
  console.log('\n🔑 TEST 1: Login und Sitzungs-Erstellung');
  console.log('--------------------------------------');
  
  try {
    console.log(`POST ${API_BASE_URL}/verify-access`);
    console.log('Request body:', { accessCode: ACCESS_CODE });
    
    const response = await axios.post(`${API_BASE_URL}/verify-access`, {
      accessCode: ACCESS_CODE
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Store session cookie for subsequent requests
    storeSessionCookie(response);
    
    // Check if login was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Login erfolgreich');
      return true;
    } else {
      console.log('❌ Login fehlgeschlagen');
      return false;
    }
  } catch (error) {
    console.error('❌ Fehler beim Login-Test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 2: Create two test locations
 */
async function testCreateLocations() {
  console.log('\n📍 TEST 2: Erstellen von zwei Test-Standorten');
  console.log('-------------------------------------------');
  
  const testLocations = {
    A: {
      title: "Custom Upload A",
      description: "Teststandort für benutzerdefinierten Bildupload A",
      latitude: 48.1351,
      longitude: 11.5820,
      date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    },
    B: {
      title: "Custom Upload B",
      description: "Teststandort für benutzerdefinierten Bildupload B",
      latitude: 48.1370,
      longitude: 11.5750,
      date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    }
  };
  
  let success = true;
  
  // Create both locations
  for (const [key, location] of Object.entries(testLocations)) {
    try {
      console.log(`\nErstelle Location ${key}:`);
      console.log(`POST ${API_BASE_URL}/api/locations`);
      console.log('Request body:', location);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/locations`, 
        location, 
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {},
        }
      );
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response data:', response.data);
      
      // Check if creation was successful
      if ((response.status === 201 || response.status === 200) && !response.data.error) {
        console.log(`✅ Standort ${key} erfolgreich erstellt`);
        // Store the ID of the created location
        locationIds[key] = response.data.data.id;
        console.log(`Erstellte Standort-ID für ${key}: ${locationIds[key]}`);
      } else {
        console.log(`❌ Erstellung von Standort ${key} fehlgeschlagen`);
        success = false;
      }
    } catch (error) {
      console.error(`❌ Fehler beim Erstellen von Standort ${key}:`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response data:', error.response.data);
      } else {
        console.error(error.message);
      }
      success = false;
    }
  }
  
  return success;
}

/**
 * Test 3: Upload different images to each location
 */
async function testUploadDifferentImages() {
  console.log('\n🖼️ TEST 3: Hochladen verschiedener Bilder zu den Standorten');
  console.log('--------------------------------------------------------');
  
  let success = true;
  
  // Upload images to both locations
  for (const [key, locationId] of Object.entries(locationIds)) {
    if (!locationId) {
      console.error(`❌ Keine Standort-ID für ${key} verfügbar. Der vorherige Test könnte fehlgeschlagen sein.`);
      success = false;
      continue;
    }
    
    try {
      const imagePath = IMAGE_PATHS[key];
      console.log(`\nHochlade Bild für Standort ${key} (ID: ${locationId}):`);
      console.log(`Bildpfad: ${imagePath}`);
      
      // Read the custom image file
      if (!fs.existsSync(imagePath)) {
        console.error(`❌ Bilddatei nicht gefunden unter: ${imagePath}`);
        success = false;
        continue;
      }
      
      console.log(`Lese Bilddatei: ${imagePath}`);
      const imageBuffer = fs.readFileSync(imagePath);
      const fileSize = fs.statSync(imagePath).size;
      
      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      const imageDataUri = `data:image/jpeg;base64,${base64Image}`;
      const fileName = path.basename(imagePath);
      
      console.log(`Originale Bildgröße: ${fileSize} Bytes`);
      console.log(`POST ${API_BASE_URL}/api/locations/${locationId}/upload`);
      console.log(`Request body: { imageData: [base64 Daten], fileName: "${fileName}" }`);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/locations/${locationId}/upload`,
        {
          imageData: imageDataUri,
          fileName: fileName
        },
        { 
          headers: sessionCookie ? { 
            Cookie: sessionCookie,
            'Content-Type': 'application/json'
          } : {
            'Content-Type': 'application/json'
          },
          // Max request size increased to accommodate large image
          maxContentLength: 20 * 1024 * 1024, // 20MB
          maxBodyLength: 20 * 1024 * 1024 // 20MB
        }
      );
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response data:', response.data);
      
      // Check if upload was successful
      if (response.status === 200 && !response.data.error) {
        console.log(`✅ Bild für Standort ${key} erfolgreich hochgeladen`);
      } else {
        console.log(`❌ Bildupload für Standort ${key} fehlgeschlagen`);
        success = false;
      }
    } catch (error) {
      console.error(`❌ Fehler beim Hochladen des Bildes für Standort ${key}:`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response data:', error.response.data);
      } else {
        console.error(error.message);
      }
      success = false;
    }
  }
  
  return success;
}

/**
 * Test 4: Verify images are correctly associated with their locations
 */
async function testVerifyImageAssociation() {
  console.log('\n🔍 TEST 4: Überprüfen der korrekten Bildzuordnung');
  console.log('------------------------------------------------');
  
  let success = true;
  let imageHashes = {};
  
  // Check each location for the correct image
  for (const [key, locationId] of Object.entries(locationIds)) {
    if (!locationId) {
      console.error(`❌ Keine Standort-ID für ${key} verfügbar. Der vorherige Test könnte fehlgeschlagen sein.`);
      success = false;
      continue;
    }
    
    try {
      console.log(`\nPrüfe Bild für Standort ${key} (ID: ${locationId}):`);
      
      // 1. Get the full image
      console.log(`GET ${API_BASE_URL}/api/locations/${locationId}/image`);
      
      const imageResponse = await axios.get(
        `${API_BASE_URL}/api/locations/${locationId}/image`,
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {},
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`Status: ${imageResponse.status} ${imageResponse.statusText}`);
      console.log(`Content-Type: ${imageResponse.headers['content-type']}`);
      console.log(`Bilddaten empfangen: ${imageResponse.data.byteLength} Bytes`);
      
      // Calculate hash for comparison
      const imageHash = calculateSimpleHash(imageResponse.data);
      imageHashes[key] = imageHash;
      console.log(`Bild-Hash für Standort ${key}: ${imageHash}`);
      
      // 2. Get the thumbnail
      console.log(`GET ${API_BASE_URL}/api/locations/${locationId}/image?thumb=true`);
      
      const thumbnailResponse = await axios.get(
        `${API_BASE_URL}/api/locations/${locationId}/image?thumb=true`,
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {},
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`Status: ${thumbnailResponse.status} ${thumbnailResponse.statusText}`);
      console.log(`Content-Type: ${thumbnailResponse.headers['content-type']}`);
      console.log(`Thumbnail-Daten empfangen: ${thumbnailResponse.data.byteLength} Bytes`);
      
      if (imageResponse.status === 200 && thumbnailResponse.status === 200) {
        console.log(`✅ Bild und Thumbnail für Standort ${key} erfolgreich abgerufen`);
      } else {
        console.log(`❌ Probleme beim Abrufen von Bild oder Thumbnail für Standort ${key}`);
        success = false;
      }
    } catch (error) {
      console.error(`❌ Fehler beim Überprüfen des Bildes für Standort ${key}:`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response headers:', error.response.headers);
      } else {
        console.error(error.message);
      }
      success = false;
    }
  }
  
  // Cross-check the hashes to confirm they're different
  if (Object.keys(imageHashes).length === 2) {
    if (imageHashes.A !== imageHashes.B) {
      console.log('\n✅ Die Bilder für Standorte A und B sind unterschiedlich, wie erwartet.');
    } else {
      console.log('\n❌ FEHLER: Die Bilder für Standorte A und B haben den gleichen Hash!');
      console.log('Dies deutet darauf hin, dass das gleiche Bild für beide Standorte verwendet wird.');
      success = false;
    }
  }
  
  return success;
}

/**
 * Test 5: Clean up by deleting the test locations
 */
async function testCleanUp() {
  console.log('\n🧹 TEST 5: Aufräumen');
  console.log('------------------');
  
  let success = true;
  
  // Delete both test locations
  for (const [key, locationId] of Object.entries(locationIds)) {
    if (!locationId) {
      console.error(`❌ Keine Standort-ID für ${key} zum Aufräumen verfügbar. Vorherige Tests könnten fehlgeschlagen sein.`);
      continue;
    }
    
    try {
      console.log(`\nLösche Standort ${key} (ID: ${locationId}):`);
      console.log(`DELETE ${API_BASE_URL}/api/locations/${locationId}`);
      
      const response = await axios.delete(
        `${API_BASE_URL}/api/locations/${locationId}`,
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {}
        }
      );
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response data:', response.data);
      
      // Check if deletion was successful
      if (response.status === 200 && !response.data.error) {
        console.log(`✅ Teststandort ${key} erfolgreich gelöscht`);
      } else {
        console.log(`❌ Löschen des Teststandorts ${key} fehlgeschlagen`);
        success = false;
      }
    } catch (error) {
      console.error(`❌ Fehler beim Aufräumen des Standorts ${key}:`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response data:', error.response.data);
      } else {
        console.error(error.message);
      }
      success = false;
    }
  }
  
  return success;
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 STARTE TESTS FÜR MEHRERE STANDORTE MIT EIGENEN BILDERN');
  console.log('=======================================================');
  console.log(`Server URL: ${API_BASE_URL}`);
  console.log(`Access Code konfiguriert: ${ACCESS_CODE ? 'Ja' : 'Nein'}`);
  console.log('Bild-Pfade:');
  console.log(`  Standort A: ${IMAGE_PATHS.A}`);
  console.log(`  Standort B: ${IMAGE_PATHS.B}`);
  
  try {
    // Check if the image files exist
    for (const [key, path] of Object.entries(IMAGE_PATHS)) {
      if (!fs.existsSync(path)) {
        console.error(`❌ Bilddatei für Standort ${key} nicht gefunden unter: ${path}`);
        return;
      }
    }
    
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.error('❌ Login fehlgeschlagen, breche verbleibende Tests ab');
      return;
    }
    
    // Test 2: Create Locations
    const createSuccess = await testCreateLocations();
    if (!createSuccess) {
      console.error('❌ Erstellen der Standorte fehlgeschlagen, einige Tests werden möglicherweise übersprungen');
    }
    
    // Test 3: Upload Images
    const uploadSuccess = await testUploadDifferentImages();
    if (!uploadSuccess) {
      console.error('❌ Bildupload fehlgeschlagen, einige Tests werden möglicherweise fehlschlagen');
    }
    
    // Test 4: Verify Image Association
    await testVerifyImageAssociation();
    
    // Test 5: Clean Up
    await testCleanUp();
    
    console.log('\n🏁 ALLE TESTS FÜR MEHRERE STANDORTE MIT EIGENEN BILDERN ABGESCHLOSSEN');
  } catch (error) {
    console.error('\n💥 NICHT BEHANDELTER FEHLER WÄHREND DER TESTS:');
    console.error(error);
  }
}

// Check for ACCESS_CODE before running tests
if (!ACCESS_CODE) {
  console.error('❌ Umgebungsvariable ACCESS_CODE ist nicht gesetzt. Tests werden wahrscheinlich fehlschlagen.');
  console.error('Bitte setzen Sie die Umgebungsvariable ACCESS_CODE und versuchen Sie es erneut.');
  process.exit(1);
}

// Run the tests
runTests();