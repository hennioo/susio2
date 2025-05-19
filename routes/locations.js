const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth } = require('../auth');
const { pool } = require('../phase1_test');

// Configure multer for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * GET /api/locations
 * Returns all locations from the database
 */
router.get('/locations', async (req, res) => {
  console.log('📊 Fetching all locations');
  
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM locations ORDER BY id');
      console.log(`✅ Found ${result.rows.length} locations`);
      res.json({
        error: false,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve locations',
      details: error.message
    });
  }
});

/**
 * GET /api/locations/:id
 * Returns a specific location by ID
 */
router.get('/locations/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`📝 Fetching location with ID: ${id}`);
  
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM locations WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        console.log(`❌ Location with ID ${id} not found`);
        return res.status(404).json({
          error: true,
          message: `Location with ID ${id} not found`
        });
      }
      
      console.log(`✅ Found location with ID ${id}`);
      res.json({
        error: false,
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error fetching location with ID ${id}:`, error);
    res.status(500).json({
      error: true,
      message: `Failed to retrieve location with ID ${id}`,
      details: error.message
    });
  }
});

/**
 * POST /api/locations
 * Creates a new location
 */
router.post('/locations', upload.single('image'), async (req, res) => {
  console.log('📝 Creating new location');
  
  try {
    const { title, description, latitude, longitude, date } = req.body;
    
    // Validate required fields
    if (!title || !latitude || !longitude) {
      console.log('❌ Missing required fields for new location');
      return res.status(400).json({
        error: true,
        message: 'Title, latitude and longitude are required'
      });
    }
    
    // Handle image upload (if provided)
    let image = null;
    let thumbnail = null;
    let imageType = null;
    
    if (req.file) {
      console.log(`📸 Processing uploaded image: ${req.file.originalname} (${req.file.size} bytes)`);
      
      // Convert image to base64
      image = req.file.buffer.toString('base64');
      // For this example, we'll just use the same image as thumbnail
      thumbnail = image;
      imageType = req.file.mimetype;
      
      console.log('✅ Image processed successfully');
    }
    
    const client = await pool.connect();
    try {
      // Insert new location into database
      const result = await client.query(`
        INSERT INTO locations 
        (title, description, latitude, longitude, date, image, thumbnail, image_type) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `, [title, description, latitude, longitude, date, image, thumbnail, imageType]);
      
      console.log(`✅ Created new location with ID: ${result.rows[0].id}`);
      res.status(201).json({
        error: false,
        message: 'Location created successfully',
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating location:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create location',
      details: error.message
    });
  }
});

/**
 * PUT /api/locations/:id
 * Updates a location by ID
 */
router.put('/locations/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  console.log(`📝 Updating location with ID: ${id}`);
  
  try {
    const { title, description, latitude, longitude, date } = req.body;
    
    // Check if location exists
    const client = await pool.connect();
    try {
      const checkResult = await client.query('SELECT * FROM locations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        console.log(`❌ Location with ID ${id} not found for update`);
        return res.status(404).json({
          error: true,
          message: `Location with ID ${id} not found`
        });
      }
      
      const existingLocation = checkResult.rows[0];
      
      // Prepare update data, using existing values if not provided
      const updatedLocation = {
        title: title || existingLocation.title,
        description: description || existingLocation.description,
        latitude: latitude || existingLocation.latitude,
        longitude: longitude || existingLocation.longitude,
        date: date || existingLocation.date,
        image: existingLocation.image,
        thumbnail: existingLocation.thumbnail,
        image_type: existingLocation.image_type
      };
      
      // Handle image upload (if provided)
      if (req.file) {
        console.log(`📸 Processing updated image: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // Convert image to base64
        updatedLocation.image = req.file.buffer.toString('base64');
        updatedLocation.thumbnail = updatedLocation.image;
        updatedLocation.image_type = req.file.mimetype;
        
        console.log('✅ Updated image processed successfully');
      }
      
      // Update location in database
      const updateResult = await client.query(`
        UPDATE locations 
        SET title = $1, description = $2, latitude = $3, longitude = $4, 
            date = $5, image = $6, thumbnail = $7, image_type = $8 
        WHERE id = $9 
        RETURNING *
      `, [
        updatedLocation.title, 
        updatedLocation.description, 
        updatedLocation.latitude, 
        updatedLocation.longitude, 
        updatedLocation.date, 
        updatedLocation.image, 
        updatedLocation.thumbnail, 
        updatedLocation.image_type, 
        id
      ]);
      
      console.log(`✅ Updated location with ID: ${id}`);
      res.json({
        error: false,
        message: 'Location updated successfully',
        data: updateResult.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error updating location with ID ${id}:`, error);
    res.status(500).json({
      error: true,
      message: `Failed to update location with ID ${id}`,
      details: error.message
    });
  }
});

/**
 * DELETE /api/locations/:id
 * Deletes a location by ID including all associated image data
 */
router.delete('/locations/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Deleting location with ID: ${id}`);
  
  try {
    const client = await pool.connect();
    try {
      // Check if location exists and get its image data
      const checkResult = await client.query('SELECT id, image_name, image_data, thumbnail_data FROM locations WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        console.log(`❌ Location with ID ${id} not found for deletion`);
        return res.status(404).json({
          error: true,
          message: `Location with ID ${id} not found`
        });
      }
      
      // Log image data that will be deleted
      const location = checkResult.rows[0];
      if (location.image_name || location.image_data || location.thumbnail_data) {
        console.log(`🖼️ Removing image data for location ${id}: ${location.image_name || 'unnamed'}`);
      }
      
      // Delete location including all image data
      await client.query('DELETE FROM locations WHERE id = $1', [id]);
      
      console.log(`✅ Deleted location with ID: ${id} and all associated image data`);
      res.json({
        error: false,
        message: `Location with ID ${id} deleted successfully`,
        success: true
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error deleting location with ID ${id}:`, error);
    res.status(500).json({
      error: true,
      message: `Failed to delete location with ID ${id}`,
      details: error.message
    });
  }
});

module.exports = router;