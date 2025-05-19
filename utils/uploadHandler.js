const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { pool } = require('../db');
const imageProcessor = require('./imageProcessor');

// Load environment variables
dotenv.config();

// Maximum file size in bytes (default 5MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || '5242880', 10); // 5MB

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, callback) => {
    // Validate image format
    const formatValidation = imageProcessor.isValidImageFormat(file.mimetype);
    if (!formatValidation.valid) {
      console.log(`[VALIDATION_ERROR] Rejected file upload: ${file.originalname}, MIME: ${file.mimetype}, IP: ${req.ip || 'unknown'}`);
      return callback(new Error(formatValidation.message), false);
    }
    
    // Validate extension matches MIME type
    const extension = path.extname(file.originalname).toLowerCase().substring(1);
    const extensionValidation = imageProcessor.isExtensionMatchingMimeType(file.originalname, file.mimetype);
    
    if (!extensionValidation.valid) {
      console.log(`[VALIDATION_ERROR] File extension mismatch: ${file.originalname}, MIME: ${file.mimetype}, IP: ${req.ip || 'unknown'}`);
      return callback(new Error(extensionValidation.message), false);
    }
    
    callback(null, true);
  }
});

/**
 * Handles file upload and image processing
 * @param {number} locationId - The ID of the location to attach the image to
 * @param {object} file - The uploaded file object from multer
 * @returns {Promise<object>} - Result of the database update
 */
async function handleFileUpload(locationId, file) {
  try {
    // Check if location exists
    const checkResult = await pool.query(
      'SELECT id FROM locations WHERE id = $1',
      [locationId]
    );
    
    if (checkResult.rows.length === 0) {
      throw new Error(`Location with ID ${locationId} does not exist`);
    }
    
    // Process the image (resize, optimize, create thumbnail)
    const { processedImage, thumbnail } = await imageProcessor.processImage(
      file.buffer,
      file.mimetype
    );
    
    // Convert to base64 for storage
    const imageBase64 = imageProcessor.bufferToBase64DataUri(
      processedImage,
      file.mimetype
    );
    
    const thumbnailBase64 = imageProcessor.bufferToBase64DataUri(
      thumbnail,
      file.mimetype
    );
    
    // Update the database with the processed image and thumbnail
    const result = await pool.query(
      `UPDATE locations 
       SET image=$1, 
           thumbnail=$2, 
           image_type=$3, 
           image_name=$4, 
           image_data=$5, 
           thumbnail_data=$6
       WHERE id=$7
       RETURNING *`,
      [
        imageBase64.substring(0, 100) + '...', // For backward compatibility, storing only a preview
        thumbnailBase64.substring(0, 100) + '...', // For backward compatibility, storing only a preview
        file.mimetype,
        file.originalname,
        imageBase64,
        thumbnailBase64,
        locationId
      ]
    );
    
    return {
      error: false,
      message: 'Image uploaded and processed successfully',
      data: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        image_type: result.rows[0].image_type,
        image_name: result.rows[0].image_name,
        has_image: !!result.rows[0].image_data,
        has_thumbnail: !!result.rows[0].thumbnail_data,
      }
    };
  } catch (error) {
    console.error('Error handling file upload:', error);
    return {
      error: true,
      message: error.message
    };
  }
}

/**
 * Handles base64 image upload
 * @param {number} locationId - The ID of the location to attach the image to
 * @param {string} base64Data - Base64 encoded image data (may include data URI prefix)
 * @param {string} fileName - Original file name
 * @param {object} req - Express request object for logging
 * @returns {Promise<object>} - Result of the database update
 */
async function handleBase64Upload(locationId, base64Data, fileName, req) {
  try {
    // Check if location exists
    const checkResult = await pool.query(
      'SELECT id FROM locations WHERE id = $1',
      [locationId]
    );
    
    if (checkResult.rows.length === 0) {
      throw new Error(`Location with ID ${locationId} does not exist`);
    }
    
    // Extract MIME type from the data URI
    const mimeType = imageProcessor.getMimeTypeFromDataUri(base64Data);
    
    // Validate image format
    const formatValidation = imageProcessor.isValidImageFormat(mimeType);
    if (!mimeType || !formatValidation.valid) {
      // Log validation error
      console.log(`[VALIDATION_ERROR] Rejected base64 image: ${fileName}, MIME: ${mimeType || 'unknown'}, IP: ${req?.ip || 'unknown'}`);
      throw new Error(formatValidation.message || 'Ungültiges Dateiformat. Nur JPG, PNG und WebP sind erlaubt.');
    }
    
    // Validate file extension against MIME type
    const extensionValidation = imageProcessor.isExtensionMatchingMimeType(fileName, mimeType);
    if (!extensionValidation.valid) {
      // Log validation error
      console.log(`[VALIDATION_ERROR] Base64 extension mismatch: ${fileName}, MIME: ${mimeType}, IP: ${req?.ip || 'unknown'}`);
      throw new Error(extensionValidation.message);
    }
    
    // Convert base64 to buffer for processing
    const imageBuffer = imageProcessor.base64ToBuffer(base64Data);
    
    // Check file size
    if (imageBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image size exceeds the maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // Process the image (resize, optimize, create thumbnail)
    const { processedImage, thumbnail } = await imageProcessor.processImage(
      imageBuffer,
      mimeType
    );
    
    // Convert processed images back to base64
    const processedImageBase64 = imageProcessor.bufferToBase64DataUri(
      processedImage,
      mimeType
    );
    
    const thumbnailBase64 = imageProcessor.bufferToBase64DataUri(
      thumbnail,
      mimeType
    );
    
    // Update the database with the processed image and thumbnail
    const result = await pool.query(
      `UPDATE locations 
       SET image=$1, 
           thumbnail=$2, 
           image_type=$3, 
           image_name=$4, 
           image_data=$5, 
           thumbnail_data=$6
       WHERE id=$7
       RETURNING *`,
      [
        processedImageBase64.substring(0, 100) + '...', // For backward compatibility
        thumbnailBase64.substring(0, 100) + '...', // For backward compatibility
        mimeType,
        fileName,
        processedImageBase64,
        thumbnailBase64,
        locationId
      ]
    );
    
    return {
      error: false,
      message: 'Image uploaded and processed successfully',
      data: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        image_type: result.rows[0].image_type,
        image_name: result.rows[0].image_name,
        has_image: !!result.rows[0].image_data,
        has_thumbnail: !!result.rows[0].thumbnail_data,
      }
    };
  } catch (error) {
    console.error('Error handling base64 upload:', error);
    return {
      error: true,
      message: error.message
    };
  }
}

module.exports = {
  upload,
  handleFileUpload,
  handleBase64Upload,
  MAX_FILE_SIZE
};