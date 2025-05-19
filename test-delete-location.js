const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Base URL for API
const API_BASE_URL = 'http://localhost:10000';

// Access code for authentication (from environment variable)
const ACCESS_CODE = process.env.ACCESS_CODE;

// Path to the test image
const TEST_IMAGE_PATH = path.join(__dirname, 'attached_assets', 'IMG_5170.jpeg');

// Cookie jar to store session cookie between requests
let sessionCookie = null;
let createdLocationId = null;

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
    console.log('Session-Cookie gespeichert:', sessionCookie);
  }
}

/**
 * Test 1: Login and session creation
 */
async function testLogin() {
  console.log('\n🔑 TEST 1: Login und Session-Erstellung');
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
 * Test 2: Create a test location for deletion
 */
async function createLocationForDeletion() {
  console.log('\n📍 TEST 2: Test-Standort für Löschvorgang erstellen');
  console.log('------------------------------------------------');
  
  const testLocation = {
    title: "Test Delete Location",
    description: "Dieser Standort wird erstellt, um die Löschfunktion zu testen",
    latitude: 49.4521,
    longitude: 11.0767,
    date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  };
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations`);
    console.log('Request body:', testLocation);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations`, 
      testLocation, 
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if creation was successful
    if ((response.status === 201 || response.status === 200) && !response.data.error) {
      console.log('✅ Test-Standort erfolgreich erstellt');
      // Store the ID of the created location for later tests
      createdLocationId = response.data.data.id;
      console.log(`Erstellte Standort-ID: ${createdLocationId}`);
      return true;
    } else {
      console.log('❌ Standorterstellung fehlgeschlagen');
      return false;
    }
  } catch (error) {
    console.error('❌ Fehler bei der Standorterstellung:');
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
 * Test 3: Upload an image to the test location
 */
async function uploadImageToLocation() {
  console.log('\n🖼️ TEST 3: Bild zum Test-Standort hochladen');
  console.log('------------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ Keine Standort-ID verfügbar. Der vorherige Test ist möglicherweise fehlgeschlagen.');
    return false;
  }
  
  try {
    // Check if image file exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`❌ Testbild nicht gefunden unter: ${TEST_IMAGE_PATH}`);
      return false;
    }
    
    // Read the test image file
    console.log(`Lese Bilddatei: ${TEST_IMAGE_PATH}`);
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
    const imageDataUri = `data:image/jpeg;base64,${base64Image}`;
    
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [base64 Daten], fileName: "test-delete-image.jpg" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: imageDataUri,
        fileName: 'test-delete-image.jpg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        },
        maxContentLength: 10 * 1024 * 1024,
        maxBodyLength: 10 * 1024 * 1024
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if upload was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Testbild erfolgreich hochgeladen');
      return true;
    } else {
      console.log('❌ Bildupload fehlgeschlagen');
      return false;
    }
  } catch (error) {
    console.error('❌ Fehler beim Bildupload:');
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
 * Test 4: Verify image retrieval before deletion
 */
async function verifyImageBeforeDeletion() {
  console.log('\n🔍 TEST 4: Bildabruf vor dem Löschen überprüfen');
  console.log('---------------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ Keine Standort-ID verfügbar. Der vorherige Test ist möglicherweise fehlgeschlagen.');
    return false;
  }
  
  try {
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationId}/image`);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationId}/image`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        responseType: 'arraybuffer'
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Bild-Größe: ${response.data.byteLength} Bytes`);
    
    if (response.status === 200 && response.data.byteLength > 0) {
      console.log('✅ Bild erfolgreich abgerufen vor dem Löschen');
      return true;
    } else {
      console.log('❌ Bildabruf vor dem Löschen fehlgeschlagen');
      return false;
    }
  } catch (error) {
    console.error('❌ Fehler beim Bildabruf vor dem Löschen:');
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
 * Test 5: Delete the test location
 */
async function deleteTestLocation() {
  console.log('\n🗑️ TEST 5: Test-Standort löschen');
  console.log('------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ Keine Standort-ID verfügbar. Der vorherige Test ist möglicherweise fehlgeschlagen.');
    return false;
  }
  
  try {
    console.log(`DELETE ${API_BASE_URL}/api/locations/${createdLocationId}`);
    
    const response = await axios.delete(
      `${API_BASE_URL}/api/locations/${createdLocationId}`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {}
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    if (response.status === 200 && !response.data.error && response.data.success) {
      console.log('✅ Standort erfolgreich gelöscht');
      return true;
    } else {
      console.log('❌ Standortlöschung fehlgeschlagen');
      return false;
    }
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Standorts:');
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
 * Test 6: Verify location no longer exists
 */
async function verifyLocationDeleted() {
  console.log('\n🔍 TEST 6: Überprüfen, ob der Standort gelöscht wurde');
  console.log('--------------------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ Keine Standort-ID verfügbar. Der vorherige Test ist möglicherweise fehlgeschlagen.');
    return false;
  }
  
  try {
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationId}`);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/locations/${createdLocationId}`,
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {}
        }
      );
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response data:', response.data);
      
      console.log('❌ FEHLER: Standort existiert noch, obwohl er gelöscht sein sollte!');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`Status: ${error.response.status} ${error.response.statusText}`);
        console.log('Response data:', error.response.data);
        console.log('✅ Standort wurde korrekt gelöscht (404 Not Found)');
        return true;
      } else {
        throw error; // Re-throw für andere Fehler als 404
      }
    }
  } catch (error) {
    console.error('❌ Fehler bei der Überprüfung der Standortlöschung:');
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
 * Test 7: Verify image no longer exists
 */
async function verifyImageDeleted() {
  console.log('\n🔍 TEST 7: Überprüfen, ob das Bild gelöscht wurde');
  console.log('----------------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ Keine Standort-ID verfügbar. Der vorherige Test ist möglicherweise fehlgeschlagen.');
    return false;
  }
  
  try {
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationId}/image`);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/locations/${createdLocationId}/image`,
        { 
          headers: sessionCookie ? { Cookie: sessionCookie } : {},
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      console.log('❌ FEHLER: Bild existiert noch, obwohl es gelöscht sein sollte!');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`Status: ${error.response.status} ${error.response.statusText}`);
        console.log('Response data:', error.response.data);
        console.log('✅ Bild wurde korrekt gelöscht (404 Not Found)');
        return true;
      } else {
        throw error; // Re-throw für andere Fehler als 404
      }
    }
  } catch (error) {
    console.error('❌ Fehler bei der Überprüfung der Bildlöschung:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      if (error.response.headers['content-type'].includes('application/json')) {
        console.error('Response data:', JSON.parse(Buffer.from(error.response.data).toString()));
      }
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 STARTE TESTS ZUM LÖSCHEN VON STANDORTEN MIT BILDDATEN');
  console.log('=====================================================');
  console.log(`Server URL: ${API_BASE_URL}`);
  console.log(`Access Code konfiguriert: ${ACCESS_CODE ? 'Ja' : 'Nein'}`);
  console.log(`Test-Bild-Pfad: ${TEST_IMAGE_PATH}`);
  
  try {
    // Check if the image file exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error(`❌ Test-Bilddatei nicht gefunden unter: ${TEST_IMAGE_PATH}`);
      return;
    }
    
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.error('❌ Login fehlgeschlagen, breche verbleibende Tests ab');
      return;
    }
    
    // Test 2: Create Location
    const createSuccess = await createLocationForDeletion();
    if (!createSuccess) {
      console.error('❌ Standorterstellung fehlgeschlagen, breche verbleibende Tests ab');
      return;
    }
    
    // Test 3: Upload Image
    const uploadSuccess = await uploadImageToLocation();
    if (!uploadSuccess) {
      console.error('❌ Bildupload fehlgeschlagen, einige Tests werden möglicherweise beeinträchtigt');
    }
    
    // Test 4: Verify Image Before Deletion
    await verifyImageBeforeDeletion();
    
    // Test 5: Delete Location
    const deleteSuccess = await deleteTestLocation();
    if (!deleteSuccess) {
      console.error('❌ Standortlöschung fehlgeschlagen, breche verbleibende Tests ab');
      return;
    }
    
    // Test 6: Verify Location Deleted
    await verifyLocationDeleted();
    
    // Test 7: Verify Image Deleted
    await verifyImageDeleted();
    
    console.log('\n🏁 ALLE TESTS ZUR STANDORTLÖSCHUNG ABGESCHLOSSEN');
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