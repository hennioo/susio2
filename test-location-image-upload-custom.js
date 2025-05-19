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

// Path to the custom test image
const CUSTOM_IMAGE_PATH = path.join(__dirname, 'attached_assets', 'IMG_5176.jpeg');

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
    console.log('Session cookie stored:', sessionCookie);
  }
}

/**
 * Test 1: Login and session creation
 */
async function testLogin() {
  console.log('\n🔑 TEST 1: Login and Session Creation');
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
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during login test:');
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
 * Test 2: Create a new location for custom image upload
 */
async function createCustomLocation() {
  console.log('\n📍 TEST 2: Create Custom Test Location');
  console.log('-------------------------------------');
  
  const testLocation = {
    title: "Custom Test Location",
    description: "Ein spezieller Testeintrag für den benutzerdefinierten Bildupload-Test",
    latitude: 47.3769,
    longitude: 8.5417,
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
      console.log('✅ Custom location created successfully');
      // Store the ID of the created location for later tests
      createdLocationId = response.data.data.id;
      console.log(`Created location ID: ${createdLocationId}`);
      return true;
    } else {
      console.log('❌ Custom location creation failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during location creation:');
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
 * Test 3: Upload the custom image to the location
 */
async function uploadCustomImage() {
  console.log('\n🖼️ TEST 3: Upload Custom Image');
  console.log('-----------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available. Previous test may have failed.');
    return false;
  }
  
  try {
    // Read the custom image file
    console.log(`Reading image file: ${CUSTOM_IMAGE_PATH}`);
    const imageBuffer = fs.readFileSync(CUSTOM_IMAGE_PATH);
    
    // Convert to base64
    const base64Image = imageBuffer.toString('base64');
    const imageDataUri = `data:image/jpeg;base64,${base64Image}`;
    
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [base64 data], fileName: "custom-image.jpg" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: imageDataUri,
        fileName: 'custom-image.jpg'
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
      console.log('✅ Custom image uploaded successfully');
      return true;
    } else {
      console.log('❌ Custom image upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during custom image upload:');
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
 * Test 4: Retrieve the uploaded custom image
 */
async function retrieveCustomImage() {
  console.log('\n🖼️ TEST 4: Retrieve Custom Image');
  console.log('------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available. Previous test may have failed.');
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
    console.log(`Image data received: ${response.data.byteLength} bytes`);
    
    // Verify image was retrieved successfully
    if (response.status === 200 && response.data.byteLength > 0) {
      console.log('✅ Custom image retrieved successfully');
      
      // Optional: Compare with original
      const originalSize = fs.statSync(CUSTOM_IMAGE_PATH).size;
      console.log(`Original image size: ${originalSize} bytes`);
      console.log(`Returned image size: ${response.data.byteLength} bytes`);
      console.log(`Size difference: ${Math.abs(originalSize - response.data.byteLength)} bytes`);
      console.log(`Note: Size difference is expected due to compression and processing`);
      
      return true;
    } else {
      console.log('❌ Custom image retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during custom image retrieval:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 5: Retrieve the thumbnail of the custom image
 */
async function retrieveCustomThumbnail() {
  console.log('\n🖼️ TEST 5: Retrieve Custom Image Thumbnail');
  console.log('----------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationId}/image?thumb=true`);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationId}/image?thumb=true`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
        responseType: 'arraybuffer'
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Thumbnail data received: ${response.data.byteLength} bytes`);
    
    // Verify thumbnail was retrieved successfully
    if (response.status === 200 && response.data.byteLength > 0) {
      console.log('✅ Custom image thumbnail retrieved successfully');
      return true;
    } else {
      console.log('❌ Custom image thumbnail retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during custom image thumbnail retrieval:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 6: Clean up by deleting the test location
 */
async function cleanUp() {
  console.log('\n🧹 TEST 6: Clean Up');
  console.log('------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for clean up. Previous tests may have failed.');
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
    
    // Check if deletion was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Test location deleted successfully');
      return true;
    } else {
      console.log('❌ Test location deletion failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during clean up:');
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
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 STARTING CUSTOM IMAGE UPLOAD TESTS');
  console.log('====================================');
  console.log(`Server URL: ${API_BASE_URL}`);
  console.log(`Access Code configured: ${ACCESS_CODE ? 'Yes' : 'No'}`);
  console.log(`Custom image path: ${CUSTOM_IMAGE_PATH}`);
  
  try {
    // Check if the image file exists
    if (!fs.existsSync(CUSTOM_IMAGE_PATH)) {
      console.error(`❌ Custom image file not found at: ${CUSTOM_IMAGE_PATH}`);
      return;
    }
    
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.error('❌ Login failed, aborting remaining tests');
      return;
    }
    
    // Test 2: Create Custom Location
    const createSuccess = await createCustomLocation();
    if (!createSuccess) {
      console.error('❌ Create location failed, aborting remaining tests');
      return;
    }
    
    // Test 3: Upload Custom Image
    const uploadSuccess = await uploadCustomImage();
    if (!uploadSuccess) {
      console.error('❌ Image upload failed, some tests may be skipped');
    }
    
    // Test 4: Retrieve Custom Image
    await retrieveCustomImage();
    
    // Test 5: Retrieve Custom Thumbnail
    await retrieveCustomThumbnail();
    
    // Test 6: Clean Up
    await cleanUp();
    
    console.log('\n🏁 ALL CUSTOM IMAGE UPLOAD TESTS COMPLETED');
  } catch (error) {
    console.error('\n💥 UNHANDLED ERROR DURING TESTS:');
    console.error(error);
  }
}

// Check for ACCESS_CODE before running tests
if (!ACCESS_CODE) {
  console.error('❌ ACCESS_CODE environment variable is not set. Tests will likely fail.');
  console.error('Please set the ACCESS_CODE environment variable and try again.');
  process.exit(1);
}

// Run the tests
runTests();