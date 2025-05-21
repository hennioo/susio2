const express = require('express');
const router = express.Router();
const { validateSession } = require('../auth');

/**
 * GET /api/session-status
 * Überprüft den aktuellen Session-Status mit erweiterter Funktionalität
 * 1. Prüft zuerst reguläre Cookies
 * 2. Falls kein Cookie, prüft auf Header-basierte Session
 * 3. Gibt die Session-ID in der Antwort zurück, wenn sie gültig ist
 */
router.get('/session-status', (req, res) => {
  // Detaillierte Debug-Informationen
  console.log(`[DEBUG] ====== SESSION-STATUS-CHECK ======`);
  console.log(`[DEBUG] Zeitstempel: ${new Date().toISOString()}`);
  console.log(`[DEBUG] Client IP: ${req.ip}`);
  console.log(`[DEBUG] User-Agent: ${req.get('user-agent')}`);
  console.log(`[DEBUG] Headers:`, req.headers);
  
  // 1. Zuerst Cookie-basierte Session prüfen
  let sessionId = req.cookies.sessionId;
  let sessionSource = 'cookie';
  
  // 2. Falls kein Cookie-basierte Session, Header-basierte Session prüfen
  if (!sessionId && req.headers['x-session-id']) {
    sessionId = req.headers['x-session-id'];
    sessionSource = 'header';
    console.log(`[DEBUG] Session-ID aus Header gefunden`);
  }
  
  console.log(`[DEBUG] Session-Status-Check für: ${sessionId ? sessionId.substring(0, 8) + '...' : 'keine Session'} (Quelle: ${sessionSource})`);
  
  if (validateSession(sessionId)) {
    console.log(`[DEBUG] ✅ Session gültig`);
    
    // Session-ID in Cookie erneuern/bestätigen
    // Bei jeder erfolgreichen Validierung setzen wir den Cookie neu, um das Ablaufdatum zu erneuern
    const protocol = req.protocol;
    const host = req.get('host');
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    // Cookie-Optionen optimiert für maximale Kompatibilität
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    };
    
    // In lokaler Umgebung anpassen
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      delete cookieOptions.sameSite;
      cookieOptions.secure = false;
    }
    
    // Cookie erneuern, um Session-Timeout zu verhindern
    res.cookie('sessionId', sessionId, cookieOptions);
    console.log(`[DEBUG] Cookie erneuert mit Optionen:`, cookieOptions);
    
    // Erfolgreiche Antwort mit Session-ID zurückgeben
    // Dies ermöglicht dem Client, die Session-ID zu speichern und bei Bedarf im Header zu senden
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