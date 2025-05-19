const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const { pool } = require('../db');
const uploadHandler = require('../utils/uploadHandler');

/**
 * POST /api/locations/:id/upload
 * Upload an image for a specific location
 * Accepts multipart/form-data with a file field named 'image'
 */
router.post('/:id/upload', requireAuth, (req, res, next) => {
  // Handle multipart/form-data uploads
  uploadHandler.upload.single('image')(req, res, async (err) => {
    const locationId = parseInt(req.params.id, 10);
    
    // Check if location ID is valid
    if (isNaN(locationId)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid location ID'
      });
    }
    
    // Handle multer errors
    if (err) {
      console.error('Error in file upload:', err.message);
      return res.status(400).json({
        error: true,
        message: err.message
      });
    }
    
    try {
      // If no file was uploaded, check for base64 data in request body
      if (!req.file && req.body.imageData) {
        try {
          const result = await uploadHandler.handleBase64Upload(
            locationId,
            req.body.imageData,
            req.body.fileName || 'image.jpg',
            req // Pass request object for logging client IP
          );
          
          if (result.error) {
            return res.status(400).json(result);
          }
          
          return res.status(200).json(result);
        } catch (error) {
          console.error(`[UPLOAD_ERROR] Base64 processing error for location ${locationId}: ${error.message}`);
          return res.status(400).json({
            error: true,
            message: error.message
          });
        }
      }
      
      // If no file or base64 data was provided
      if (!req.file && !req.body.imageData) {
        return res.status(400).json({
          error: true,
          message: 'Es wurde keine Bilddatei oder Base64-Daten übermittelt.'
        });
      }
      
      // Process the uploaded file
      try {
        const result = await uploadHandler.handleFileUpload(locationId, req.file);
        
        if (result.error) {
          return res.status(400).json(result);
        }
        
        return res.status(200).json(result);
      } catch (error) {
        console.error(`[UPLOAD_ERROR] File processing error for location ${locationId}: ${error.message}`);
        return res.status(400).json({
          error: true,
          message: error.message
        });
      }
    } catch (error) {
      console.error('Error processing upload:', error);
      return res.status(500).json({
        error: true,
        message: 'Server error processing the upload'
      });
    }
  });
});

/**
 * GET /api/locations/:id/image
 * Get the image for a specific location
 * Optional query parameter ?thumb=true to get the thumbnail instead
 */
router.get('/:id/image', requireAuth, async (req, res) => {
  try {
    const locationId = parseInt(req.params.id, 10);
    const getThumbnail = req.query.thumb === 'true';
    
    // Check if location ID is valid
    if (isNaN(locationId)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid location ID'
      });
    }
    
    // Query the database to get the image or thumbnail
    const query = getThumbnail
      ? 'SELECT thumbnail_data as image_data, image_type FROM locations WHERE id = $1'
      : 'SELECT image_data, image_type FROM locations WHERE id = $1';
    
    const result = await pool.query(query, [locationId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: `Location with ID ${locationId} not found`
      });
    }
    
    const { image_data, image_type } = result.rows[0];
    
    if (!image_data) {
      return res.status(404).json({
        error: true,
        message: getThumbnail 
          ? 'Thumbnail not found for this location' 
          : 'Image not found for this location'
      });
    }
    
    // Extract the base64 data from the data URI
    const dataUriRegex = /^data:([A-Za-z-+/]+);base64,(.+)$/;
    const matches = image_data.match(dataUriRegex);
    
    if (!matches) {
      return res.status(500).json({
        error: true,
        message: 'Invalid image data format'
      });
    }
    
    // Set the content type and send the image data
    res.setHeader('Content-Type', image_type);
    
    // Send the base64 data as binary
    const buffer = Buffer.from(matches[2], 'base64');
    res.send(buffer);
    
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving the image'
    });
  }
});

module.exports = router;