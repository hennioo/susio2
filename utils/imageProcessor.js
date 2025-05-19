const sharp = require('sharp');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Default settings if not provided in .env
const THUMB_SIZE = parseInt(process.env.THUMB_SIZE || '300', 10);
const MAX_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '1920', 10);
const JPEG_QUALITY = parseInt(process.env.JPEG_QUALITY || '80', 10);
const PNG_COMPRESSION = parseInt(process.env.PNG_COMPRESSION || '9', 10);
const WEBP_QUALITY = parseInt(process.env.WEBP_QUALITY || '80', 10);

/**
 * Validates if the image format is allowed
 * @param {string} mimeType - The MIME type of the image
 * @returns {object} - Object with status and message
 */
function isValidImageFormat(mimeType) {
  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedFormats.includes(mimeType)) {
    return {
      valid: false,
      message: 'Ungültiges Dateiformat. Nur JPG, PNG und WebP sind erlaubt.'
    };
  }
  
  return {
    valid: true,
    message: ''
  };
}

/**
 * Check if the file extension matches the MIME type
 * @param {string} filename - The original filename
 * @param {string} mimeType - The MIME type of the file
 * @returns {object} - Object with status and message
 */
function isExtensionMatchingMimeType(filename, mimeType) {
  if (!filename || !mimeType) {
    return {
      valid: false,
      message: 'Dateiname oder MIME-Typ fehlt.'
    };
  }
  
  const extension = filename.split('.').pop().toLowerCase();
  
  const validCombinations = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp']
  };
  
  if (!validCombinations[mimeType] || !validCombinations[mimeType].includes(extension)) {
    return {
      valid: false,
      message: 'Dateiendung passt nicht zum Bildformat.'
    };
  }
  
  return {
    valid: true,
    message: ''
  };
}

/**
 * Processes an image buffer to create optimized version and thumbnail
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {string} mimeType - The MIME type of the image
 * @returns {Promise<{processedImage: Buffer, thumbnail: Buffer}>}
 */
async function processImage(imageBuffer, mimeType) {
  try {
    // Initialize the sharp instance with the input buffer
    let imageProcessor = sharp(imageBuffer);
    
    // Get image metadata to determine if resizing is needed
    const metadata = await imageProcessor.metadata();
    
    // Resize if width exceeds max width
    if (metadata.width > MAX_WIDTH) {
      imageProcessor = imageProcessor.resize({
        width: MAX_WIDTH,
        withoutEnlargement: true
      });
    }
    
    // Apply format-specific optimizations
    let processedImageBuffer;
    
    switch (mimeType) {
      case 'image/jpeg':
        processedImageBuffer = await imageProcessor
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer();
        break;
      case 'image/png':
        processedImageBuffer = await imageProcessor
          .png({ compressionLevel: PNG_COMPRESSION })
          .toBuffer();
        break;
      case 'image/webp':
        processedImageBuffer = await imageProcessor
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();
        break;
      default:
        // If format is not recognized, just return the resized image
        processedImageBuffer = await imageProcessor.toBuffer();
    }
    
    // Create thumbnail
    const thumbnailBuffer = await sharp(processedImageBuffer)
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();
    
    return {
      processedImage: processedImageBuffer,
      thumbnail: thumbnailBuffer
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Converts buffer to base64 string with proper data URI format
 * @param {Buffer} buffer - The image buffer
 * @param {string} mimeType - The MIME type of the image
 * @returns {string} - Base64 data URI
 */
function bufferToBase64DataUri(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Extracts the base64 data from a data URI
 * @param {string} dataUri - The data URI (e.g., data:image/jpeg;base64,/9j/4AAQ...)
 * @returns {string} - The base64 data without the URI prefix
 */
function extractBase64FromDataUri(dataUri) {
  if (!dataUri) return null;
  const matches = dataUri.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  return matches ? matches[2] : null;
}

/**
 * Get MIME type from a data URI
 * @param {string} dataUri - The data URI
 * @returns {string|null} - The MIME type or null if not found
 */
function getMimeTypeFromDataUri(dataUri) {
  if (!dataUri) return null;
  const matches = dataUri.match(/^data:([A-Za-z-+/]+);base64,/);
  return matches ? matches[1] : null;
}

/**
 * Converts a base64 string to a buffer
 * @param {string} base64String - The base64 string (can be with or without data URI prefix)
 * @returns {Buffer} - The buffer
 */
function base64ToBuffer(base64String) {
  // Check if it's a data URI and extract the base64 part if it is
  const base64Data = extractBase64FromDataUri(base64String) || base64String;
  return Buffer.from(base64Data, 'base64');
}

module.exports = {
  isValidImageFormat,
  isExtensionMatchingMimeType,
  processImage,
  bufferToBase64DataUri,
  extractBase64FromDataUri,
  getMimeTypeFromDataUri,
  base64ToBuffer,
  THUMB_SIZE,
  MAX_WIDTH
};