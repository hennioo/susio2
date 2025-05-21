const express = require('express');
const router = express.Router();
const { validateSession } = require('../auth');

/**
 * GET /api/session-status
 * Überprüft den aktuellen Session-Status mit erweiterter Funktionalität
 * OPTIMIERT FÜR RENDER: Fokus auf Header-basierte Authentifizierung statt Cookies
 */
router.get('/session-status', (req, res) => {
  // Detaillierte Debug-Informationen
  console.log(`[DEBUG] ====== SESSION-STATUS-CHECK ======`);
  console.log(`[DEBUG] Zeitstempel: ${new Date().toISOString()}`);
  console.log(`[DEBUG] Client IP: ${req.ip}`);
  console.log(`[DEBUG] User-Agent: ${req.get('user-agent')}`);
  console.log(`[DEBUG] Headers:`, req.headers);
  
  // PRIORITÄT: X-Session-Id Header (wegen Cookie-Problemen bei Render)
  // Zuerst prüfen wir den Header, dann erst Cookies als Fallback
  let sessionId = req.headers['x-session-id'];
  let sessionSource = 'header';
  
  // Fallback: Falls kein Header, versuchen wir Cookies
  if (!sessionId && req.cookies.sessionId) {
    sessionId = req.cookies.sessionId;
    sessionSource = 'cookie';
    console.log(`[DEBUG] Fallback: Session-ID aus Cookie gefunden`);
  }
  
  console.log(`[DEBUG] Session-Status-Check für: ${sessionId ? sessionId.substring(0, 8) + '...' : 'keine Session'} (Quelle: ${sessionSource})`);
  
  if (validateSession(sessionId)) {
    console.log(`[DEBUG] ✅ Session gültig`);
    
    // Erfolgreiche Antwort mit Session-ID zurückgeben
    // Dies ermöglicht dem Client, die Session-ID zu speichern und im Header zu senden
    // Wichtig für Kontinuität bei Render-Deployment
    return res.json({
      authenticated: true,
      message: 'Session gültig',
      sessionId: sessionId // Session-ID wird zurückgegeben, um clientseitige Speicherung zu ermöglichen
    });
  }
  
  console.log(`[DEBUG] ❌ Session ungültig oder abgelaufen`);
  console.log(`[DEBUG] ====== SESSION-STATUS-CHECK ENDE ======`);
  
  return res.status(401).json({
    authenticated: false,
    message: 'Bitte erneut anmelden'
  });
});

module.exports = router;