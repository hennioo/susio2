const express = require('express');
const router = express.Router();
const { validateSession } = require('../auth');

/**
 * GET /api/session-status
 * Überprüft den aktuellen Session-Status
 * Gibt 200 OK zurück, wenn die Session gültig ist
 * Gibt 401 Unauthorized zurück, wenn die Session ungültig ist
 */
router.get('/session-status', (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  console.log(`Überprüfe Session-Status für: ${sessionId ? sessionId.substring(0, 8) + '...' : 'keine Session'}`);
  
  if (validateSession(sessionId)) {
    console.log('✅ Session gültig');
    return res.json({
      authenticated: true,
      message: 'Session gültig'
    });
  }
  
  console.log('❌ Session ungültig oder abgelaufen');
  return res.status(401).json({
    authenticated: false,
    message: 'Bitte erneut anmelden'
  });
});

module.exports = router;