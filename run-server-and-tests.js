const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { pool, initializeDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const locationsRoutes = require('./routes/locations');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/api', locationsRoutes);

// Default route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>API Server</h1>
        <p>API Server is running.</p>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'An unexpected error occurred',
  });
});

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

// Access code for authentication
const ACCESS_CODE = process.env.ACCESS_CODE;

/**
 * Test 1: Login and session creation
 */
async function testLogin() {
  console.log('\n🔑 TEST 1: Login and Session Creation');
  console.log('--------------------------------------');
  
  try {
    console.log(`POST http://localhost:${PORT}/verify-access`);
    console.log('Request body:', { accessCode: ACCESS_CODE });
    
    const response = await axios.post(`http://localhost:${PORT}/verify-access`, {
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
    title: "Testort",
    description: "Ein Testeintrag erstellt via API-Test",
    latitude: 50.1234,
    longitude: 8.1234,
    date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
  };
  
  try {
    console.log(`POST http://localhost:${PORT}/api/locations`);
    console.log('Request body:', testLocation);
    
    const response = await axios.post(
      `http://localhost:${PORT}/api/locations`, 
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
    console.log(`GET http://localhost:${PORT}/api/locations`);
    
    const response = await axios.get(
      `http://localhost:${PORT}/api/locations`,
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
    console.log(`GET http://localhost:${PORT}/api/locations/${createdLocationId}`);
    
    const response = await axios.get(
      `http://localhost:${PORT}/api/locations/${createdLocationId}`,
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
    description: "Dieser Eintrag wurde via API-Test aktualisiert"
  };
  
  try {
    console.log(`PUT http://localhost:${PORT}/api/locations/${createdLocationId}`);
    console.log('Request body:', updateData);
    
    const response = await axios.put(
      `http://localhost:${PORT}/api/locations/${createdLocationId}`,
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
    console.log(`DELETE http://localhost:${PORT}/api/locations/${createdLocationId}`);
    
    const response = await axios.delete(
      `http://localhost:${PORT}/api/locations/${createdLocationId}`,
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
        console.log(`Verifying deletion: GET http://localhost:${PORT}/api/locations/${createdLocationId}`);
        await axios.get(
          `http://localhost:${PORT}/api/locations/${createdLocationId}`,
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
  console.log(`Server URL: http://localhost:${PORT}`);
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
  } finally {
    // Stop the server after tests complete
    process.exit(0);
  }
}

// Start server and run tests
async function startServerAndRunTests() {
  try {
    // Initialize database
    console.log('Initializing database...');
    const success = await initializeDatabase();
    if (!success) {
      console.error('❌ Cannot proceed with server startup due to database initialization error');
      process.exit(1);
    }
    
    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      
      // Wait a moment for the server to be fully ready before starting tests
      setTimeout(() => {
        runTests();
      }, 1000);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Check for ACCESS_CODE before running
if (!ACCESS_CODE) {
  console.error('❌ ACCESS_CODE environment variable is not set. Tests will likely fail.');
  console.error('Please set the ACCESS_CODE environment variable and try again.');
  process.exit(1);
}

// Start the server and run tests
startServerAndRunTests();