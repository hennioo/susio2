const crypto = require('crypto');

// In-memory session storage (as specified in requirements)
const sessions = new Map();

/**
 * Generates a random session ID
 * @returns {string} A random session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates the access code against the environment variable
 * @param {string} code - The access code to validate
 * @returns {boolean} True if the code is valid, false otherwise
 */
function validateAccessCode(code) {
  const validCode = process.env.ACCESS_CODE;
  
  if (!validCode) {
    console.error('❌ ACCESS_CODE environment variable is not set');
    return false;
  }

  return code === validCode;
}

/**
 * Creates a new session
 * @returns {string} The newly created session ID
 */
function createSession() {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    createdAt: new Date(),
    isAuthenticated: true
  });
  
  console.log(`✅ New session created: ${sessionId}`);
  return sessionId;
}

/**
 * Validates if a session is active and authenticated
 * @param {string} sessionId - The session ID to validate
 * @returns {boolean} True if the session is valid, false otherwise
 */
function validateSession(sessionId) {
  if (!sessionId) {
    return false;
  }
  
  const session = sessions.get(sessionId);
  
  // Check if session exists and is authenticated
  if (!session || !session.isAuthenticated) {
    return false;
  }
  
  // Check if session is not expired (optional: add expiry check)
  // For example, sessions expire after 24 hours
  const now = new Date();
  const sessionAge = now - session.createdAt;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (sessionAge > maxAge) {
    console.log(`Session expired: ${sessionId}`);
    sessions.delete(sessionId);
    return false;
  }
  
  return true;
}

/**
 * Authentication middleware for Express
 * Checks if the request has a valid session
 */
function requireAuth(req, res, next) {
  // Get session ID from cookie or query parameter
  const sessionId = req.cookies.sessionId || req.query.sessionId;
  
  console.log(`🔒 Validating session: ${sessionId}`);
  
  if (validateSession(sessionId)) {
    console.log(`✅ Valid session: ${sessionId}`);
    return next();
  }
  
  console.log(`❌ Invalid session: ${sessionId}`);
  return res.status(401).json({
    error: true,
    message: 'Unauthorized. Please log in first.'
  });
}

// Export the functions
module.exports = {
  validateAccessCode,
  createSession,
  validateSession,
  requireAuth,
  sessions // Export for debugging purposes
};