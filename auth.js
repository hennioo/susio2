const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Persistenter Session-Speicher mit Datei-Backup
// Bei jedem Deployment werden sonst alle Sessions verloren
let sessions = new Map();

// Pfad zur Session-Speicher-Datei
const SESSION_FILE_PATH = path.join(__dirname, '.session_store.json');

// Versuche, gespeicherte Sessions zu laden
try {
  if (fs.existsSync(SESSION_FILE_PATH)) {
    const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf8'));
    
    // Sessions aus Datei wiederherstellen
    sessions = new Map(Object.entries(sessionData).map(([key, value]) => {
      // Datum-Objekte wiederherstellen
      return [key, {
        ...value,
        createdAt: new Date(value.createdAt)
      }];
    }));
    
    console.log(`✅ Loaded ${sessions.size} sessions from storage`);
  } else {
    console.log('ℹ️ No session storage file found, starting with empty sessions');
  }
} catch (error) {
  console.error('❌ Error loading sessions from file:', error);
  // Sessions zurücksetzen, falls Problem beim Laden
  sessions = new Map();
}

// Speichert Sessions in Datei
function saveSessionsToFile() {
  try {
    // Map in Objekt umwandeln für JSON-Speicherung
    const sessionObj = {};
    sessions.forEach((value, key) => {
      sessionObj[key] = value;
    });
    
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(sessionObj, null, 2));
    console.log(`✅ Saved ${sessions.size} sessions to storage`);
  } catch (error) {
    console.error('❌ Error saving sessions to file:', error);
  }
}

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
  
  // Session in Datei speichern, damit sie Neustarts überlebt
  saveSessionsToFile();
  
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
 * Invalidates a session by removing it from the sessions map
 * @param {string} sessionId - The session ID to invalidate
 * @returns {boolean} True if the session was invalidated, false otherwise
 */
function invalidateSession(sessionId) {
  if (!sessionId) {
    return false;
  }
  
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log(`✅ Session invalidated: ${sessionId}`);
    
    // Sessions-Datei aktualisieren
    saveSessionsToFile();
    
    return true;
  }
  
  console.log(`❌ Session not found to invalidate: ${sessionId}`);
  return false;
}

/**
 * Authentication middleware for Express
 * Checks if the request has a valid session
 * Unterstützt mehrere Authentifizierungsmethoden: 
 * - Cookie-basiert (traditionell)
 * - Header-basiert (für Fallback mit localStorage)
 * - Query-Parameter (für spezielle Anwendungsfälle)
 */
function requireAuth(req, res, next) {
  // Session-ID aus mehreren möglichen Quellen extrahieren
  const sessionId = req.cookies.sessionId || 
                    req.headers['x-session-id'] || 
                    req.query.sessionId;
  
  // Detaillierte Debugging-Informationen
  const source = req.cookies.sessionId ? 'cookie' : 
               (req.headers['x-session-id'] ? 'header' : 
               (req.query.sessionId ? 'query' : 'nicht gefunden'));
  
  console.log(`🔒 Validating session: ${sessionId ? sessionId.substring(0, 8) + '...' : 'keine'} (Quelle: ${source})`);
  
  if (validateSession(sessionId)) {
    console.log(`✅ Valid session: ${sessionId ? sessionId.substring(0, 8) + '...' : 'keine'}`);
    return next();
  }
  
  console.log(`❌ Invalid session: ${sessionId ? sessionId.substring(0, 8) + '...' : 'keine'}`);
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
  invalidateSession,
  requireAuth,
  sessions // Export for debugging purposes
};