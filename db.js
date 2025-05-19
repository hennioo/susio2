const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Check if DATABASE_URL is defined
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ Environment variable DATABASE_URL is not defined');
  console.error('Please create a .env file with DATABASE_URL variable');
  process.exit(1); // Exit with error code
}

// Create a new pool with the configuration
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }, // As requested for Supabase connection
});

/**
 * Tests the database connection
 * @returns {Promise<boolean>} True if connection was successful, false otherwise
 */
async function testDatabaseConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Error connecting to database:');
    console.error(error.message);
    console.error(error.stack);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Checks if a table exists in the database
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<boolean>} True if the table exists, false otherwise
 */
async function tableExists(tableName) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error(`❌ Error checking if table ${tableName} exists:`);
    console.error(error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Creates the locations table if it doesn't exist
 */
async function createLocationsTable() {
  console.log('Checking if locations table exists...');
  const exists = await tableExists('locations');
  
  if (exists) {
    console.log('✅ locations table already exists');
    return;
  }
  
  console.log('Creating locations table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE locations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        latitude DECIMAL(9,6) NOT NULL,
        longitude DECIMAL(9,6) NOT NULL,
        date TEXT,
        image TEXT,
        thumbnail TEXT,
        image_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ locations table created successfully');
  } catch (error) {
    console.error('❌ Error creating locations table:');
    console.error(error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Creates the couple_image table if it doesn't exist
 */
async function createCoupleImageTable() {
  console.log('Checking if couple_image table exists...');
  const exists = await tableExists('couple_image');
  
  if (exists) {
    console.log('✅ couple_image table already exists');
    return;
  }
  
  console.log('Creating couple_image table...');
  const client = await pool.connect();
  
  try {
    await client.query(`
      CREATE TABLE couple_image (
        id SERIAL PRIMARY KEY,
        image TEXT,
        image_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ couple_image table created successfully');
  } catch (error) {
    console.error('❌ Error creating couple_image table:');
    console.error(error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initializes the database by creating required tables if they don't exist
 */
async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Test the connection first
    const connectionSuccessful = await testDatabaseConnection();
    if (!connectionSuccessful) {
      console.error('❌ Cannot proceed with database initialization due to connection error');
      return false;
    }
    
    // Create tables if they don't exist
    await createLocationsTable();
    await createCoupleImageTable();
    
    console.log('✅ Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error during database initialization:');
    console.error(error.message);
    console.error(error.stack);
    return false;
  }
}

// Export the pool and utility functions to be used in other modules
module.exports = {
  pool,
  testDatabaseConnection,
  tableExists,
  createLocationsTable,
  createCoupleImageTable,
  initializeDatabase
};