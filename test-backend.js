const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Base URL for API (using local server URL)
const API_BASE_URL = 'http://localhost:10000';

// Access code for authentication (from environment variable)
const ACCESS_CODE = process.env.ACCESS_CODE;

// Cookie jar to store session cookie between requests
let sessionCookie = null;
let createdLocationId = null;

/**
 * Helper function to format responses for logging
 * @param {object} response - Axios response object
 */
function logResponse(response) {
  console.log(`\nStatus: ${response.status} ${response.statusText}`);
  console.log('Headers:', JSON.stringify(response.headers, null, 2));
  console.log('Response data:', JSON.stringify(response.data, null, 2));
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
  console.log('\n🔑 TEST 1: Login and Session Creation');
  console.log('--------------------------------------');
  
  try {
    console.log(`POST ${API_BASE_URL}/verify-access`);
    console.log('Request body:', { accessCode: ACCESS_CODE });
    
    const response = await axios.post(`${API_BASE_URL}/verify-access`, {
      accessCode: ACCESS_CODE
    });
    
    logResponse(response);
    
    // Store session cookie or ID for subsequent requests
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
 * Test 2: Create a new location
 */
async function testCreateLocation() {
  console.log('\n📍 TEST 2: Create Location');
  console.log('-------------------------');
  
  const testLocation = {
    title: "Testort vom Backend-Test",
    description: "Ein Testeintrag erstellt via automatisiertem API-Test",
    latitude: 50.1234,
    longitude: 8.1234,
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
    
    logResponse(response);
    
    // Check if creation was successful
    if (response.status === 201 && !response.data.error) {
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
 * Test 3: Get all locations
 */
async function testGetAllLocations() {
  console.log('\n📋 TEST 3: Get All Locations');
  console.log('---------------------------');
  
  try {
    console.log(`GET ${API_BASE_URL}/api/locations`);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/locations`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    logResponse(response);
    
    // Check if retrieval was successful and there's at least one location
    if (response.status === 200 && !response.data.error && response.data.data.length > 0) {
      console.log(`✅ Retrieved ${response.data.data.length} locations successfully`);
      return true;
    } else {
      console.log('❌ Location retrieval failed or no locations found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during get all locations test:');
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
 * Test 4: Get a specific location by ID
 */
async function testGetLocationById() {
  console.log('\n🔍 TEST 4: Get Location by ID');
  console.log('----------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`GET ${API_BASE_URL}/api/locations/${createdLocationId}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/locations/${createdLocationId}`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    logResponse(response);
    
    // Check if retrieval was successful and the location has all required fields
    if (response.status === 200 && !response.data.error && response.data.data) {
      const location = response.data.data;
      if (location.id && location.title && location.latitude && location.longitude) {
        console.log('✅ Retrieved specific location successfully with all required fields');
        return true;
      } else {
        console.log('❌ Retrieved location is missing required fields');
        return false;
      }
    } else {
      console.log('❌ Location retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during get location by ID test:');
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
 * Test 5: Update a location
 */
async function testUpdateLocation() {
  console.log('\n✏️ TEST 5: Update Location');
  console.log('--------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  const updateData = {
    title: "Aktualisierter Testort",
    description: "Dieser Eintrag wurde via automatisiertem API-Test aktualisiert"
  };
  
  try {
    console.log(`PUT ${API_BASE_URL}/api/locations/${createdLocationId}`);
    console.log('Request body:', updateData);
    
    const response = await axios.put(
      `${API_BASE_URL}/api/locations/${createdLocationId}`,
      updateData,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    logResponse(response);
    
    // Check if update was successful
    if (response.status === 200 && !response.data.error) {
      // Verify that the title was actually updated
      if (response.data.data.title === updateData.title) {
        console.log('✅ Location updated successfully');
        return true;
      } else {
        console.log('❌ Location update verification failed');
        return false;
      }
    } else {
      console.log('❌ Location update failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during update location test:');
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
 * Test 6: Delete a location
 */
async function testDeleteLocation() {
  console.log('\n🗑️ TEST 6: Delete Location');
  console.log('--------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`DELETE ${API_BASE_URL}/api/locations/${createdLocationId}`);
    
    const response = await axios.delete(
      `${API_BASE_URL}/api/locations/${createdLocationId}`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    logResponse(response);
    
    // Check if deletion was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Location deleted successfully');
      
      // Verify that the location is no longer accessible
      try {
        console.log(`Verifying deletion: GET ${API_BASE_URL}/api/locations/${createdLocationId}`);
        await axios.get(
          `${API_BASE_URL}/api/locations/${createdLocationId}`,
          { 
            headers: sessionCookie ? { Cookie: sessionCookie } : {},
          }
        );
        
        console.log('❌ Verification failed: Location still exists after deletion');
        return false;
      } catch (verifyError) {
        if (verifyError.response && verifyError.response.status === 404) {
          console.log('✅ Verification successful: Location no longer exists');
          return true;
        } else {
          console.log('❌ Unexpected error during deletion verification');
          return false;
        }
      }
    } else {
      console.log('❌ Location deletion failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during delete location test:');
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
  console.log('🧪 STARTING API TESTS');
  console.log('====================');
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
      console.error('❌ Create location failed, some tests may be skipped');
    }
    
    // Test 3: Get All Locations
    await testGetAllLocations();
    
    // Test 4: Get Location by ID
    await testGetLocationById();
    
    // Test 5: Update Location
    await testUpdateLocation();
    
    // Test 6: Delete Location
    await testDeleteLocation();
    
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