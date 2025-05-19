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

// Sample base64 image for testing
const SAMPLE_IMAGE = 'data:image/jpeg;base64,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';

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
 * Test 2: Create a test location to upload an image to
 */
async function testCreateLocation() {
  console.log('\n📍 TEST 2: Create Test Location');
  console.log('------------------------------');
  
  const testLocation = {
    title: "Bildupload Testort",
    description: "Ein Testeintrag für den Bildupload-Test",
    latitude: 49.4875,
    longitude: 8.4660,
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
      console.log('✅ Location created successfully');
      // Store the ID of the created location for later tests
      createdLocationId = response.data.data.id;
      console.log(`Created location ID: ${createdLocationId}`);
      return true;
    } else {
      console.log('❌ Location creation failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during location creation test:');
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
 * Test 3: Upload a base64 image to the location
 */
async function testUploadBase64Image() {
  console.log('\n🖼️ TEST 3: Upload Base64 Image');
  console.log('----------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [base64 data], fileName: "test-image.jpg" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_IMAGE,
        fileName: 'test-image.jpg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        },
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if upload was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Image uploaded successfully');
      return true;
    } else {
      console.log('❌ Image upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during image upload test:');
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
 * Test 4: Retrieve the uploaded image
 */
async function testGetImage() {
  console.log('\n🖼️ TEST 4: Get Uploaded Image');
  console.log('---------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
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
    console.log('Response headers:', response.headers);
    console.log(`Image data received: ${response.data.byteLength} bytes`);
    
    // Check if image retrieval was successful
    if (response.status === 200 && response.data.byteLength > 0) {
      console.log('✅ Image retrieved successfully');
      return true;
    } else {
      console.log('❌ Image retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during image retrieval test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
      console.error('Response data length:', error.response.data ? error.response.data.length : 0);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 5: Retrieve the thumbnail
 */
async function testGetThumbnail() {
  console.log('\n🖼️ TEST 5: Get Thumbnail');
  console.log('----------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
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
    console.log('Response headers:', response.headers);
    console.log(`Thumbnail data received: ${response.data.byteLength} bytes`);
    
    // Check if thumbnail retrieval was successful
    if (response.status === 200 && response.data.byteLength > 0) {
      console.log('✅ Thumbnail retrieved successfully');
      return true;
    } else {
      console.log('❌ Thumbnail retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during thumbnail retrieval test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response headers:', error.response.headers);
      console.error('Response data length:', error.response.data ? error.response.data.length : 0);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 6: Test validation with invalid MIME type
 */
async function testInvalidMimeType() {
  console.log('\n🛑 TEST 6: Invalid MIME Type');
  console.log('--------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  const invalidMimeType = SAMPLE_IMAGE.replace('image/jpeg', 'image/invalid');
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [invalid mime type], fileName: "test-invalid.jpg" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: invalidMimeType,
        fileName: 'test-invalid.jpg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept 4xx status codes for this test
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if validation properly rejected the invalid MIME type
    if (response.status === 400 && response.data.error) {
      console.log('✅ Invalid MIME type correctly rejected');
      return true;
    } else {
      console.log('❌ Invalid MIME type was not properly validated');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during invalid MIME type test:');
    console.error(error.message);
    return false;
  }
}

/**
 * Test 7: Test validation with mismatched extension
 */
async function testMismatchedExtension() {
  console.log('\n🛑 TEST 7: Mismatched Extension');
  console.log('-----------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [jpeg data], fileName: "test.png" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_IMAGE,
        fileName: 'test.png' // This is wrong, the image is actually JPEG
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept 4xx status codes for this test
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if validation properly rejected the mismatched extension
    if (response.status === 400 && response.data.error) {
      console.log('✅ Mismatched extension correctly rejected');
      return true;
    } else {
      console.log('❌ Mismatched extension was not properly validated');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during mismatched extension test:');
    console.error(error.message);
    return false;
  }
}

/**
 * Test 8: Clean up by deleting the test location
 */
async function testCleanUp() {
  console.log('\n🧹 TEST 8: Clean Up');
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
    console.error('❌ Error during clean up test:');
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
  console.log('🧪 STARTING IMAGE UPLOAD TESTS');
  console.log('============================');
  console.log(`Server URL: ${API_BASE_URL}`);
  console.log(`Access Code configured: ${ACCESS_CODE ? 'Yes' : 'No'}`);
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.error('❌ Login failed, aborting remaining tests');
      return;
    }
    
    // Test 2: Create Location
    const createSuccess = await testCreateLocation();
    if (!createSuccess) {
      console.error('❌ Create location failed, aborting remaining tests');
      return;
    }
    
    // Test 3: Upload Image
    const uploadSuccess = await testUploadBase64Image();
    if (!uploadSuccess) {
      console.error('❌ Image upload failed, some tests may be skipped');
    }
    
    // Test 4: Get Image
    await testGetImage();
    
    // Test 5: Get Thumbnail
    await testGetThumbnail();
    
    // Test 6: Invalid MIME Type
    await testInvalidMimeType();
    
    // Test 7: Mismatched Extension
    await testMismatchedExtension();
    
    // Test 8: Clean Up
    await testCleanUp();
    
    console.log('\n🏁 ALL TESTS COMPLETED');
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