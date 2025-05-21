const express = require('express');
const router = express.Router();
const { validateAccessCode, createSession } = require('../auth');

/**
 * GET /login
 * Returns a simple login page
 */
router.get('/login', (req, res) => {
  console.log('Serving login page');
  res.send(`
    <html>
      <head>
        <title>Login</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; max-width: 600px; margin: 0 auto; padding-top: 50px; }
          .container { background: #f9f9f9; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input[type="password"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px; }
          button { background: #0066cc; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; }
          button:hover { background: #0055aa; }
          .error { color: #cc0000; margin-top: 10px; }
          .success { color: #008800; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Login</h1>
          <p>Enter the access code to continue:</p>
          
          <form id="loginForm">
            <div class="form-group">
              <label for="accessCode">Access Code:</label>
              <input type="password" id="accessCode" name="accessCode" required>
            </div>
            <button type="submit">Login</button>
            <div id="message"></div>
          </form>
        </div>

        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const accessCode = document.getElementById('accessCode').value;
            const messageDiv = document.getElementById('message');
            
            try {
              const response = await fetch('/verify-access', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                credentials: 'include', // Wichtig für das Senden und Empfangen von Cookies
                body: JSON.stringify({ accessCode })
              });
              
              const data = await response.json();
              
              if (data.error) {
                messageDiv.className = 'error';
                messageDiv.textContent = data.message;
              } else {
                messageDiv.className = 'success';
                messageDiv.textContent = 'Login successful! Redirecting...';
                
                // Store session ID in cookie
                document.cookie = \`sessionId=\${data.sessionId}; path=/\`;
                
                // Redirect to map page after a short delay
                setTimeout(() => {
                  window.location.href = '/map.html';
                }, 1500);
              }
            } catch (error) {
              messageDiv.className = 'error';
              messageDiv.textContent = 'An error occurred. Please try again.';
              console.error('Login error:', error);
            }
          });
        </script>
      </body>
    </html>
  `);
});

/**
 * POST /verify-access
 * Verifies the access code and creates a session
 * WICHTIGER HINWEIS: Fokus auf Header-basierte Authentifizierung wegen Cookie-Problemen auf Render
 */
router.post('/verify-access', (req, res) => {
  const { accessCode } = req.body;
  
  // Ausführlichere Debug-Informationen für Session-Probleme
  console.log(`[DEBUG] ====== LOGIN-VERSUCH ======`);
  console.log(`[DEBUG] Zeitstempel: ${new Date().toISOString()}`);
  console.log(`[DEBUG] Client IP: ${req.ip}`);
  console.log(`[DEBUG] User-Agent: ${req.get('user-agent')}`);
  console.log(`[DEBUG] Origin: ${req.get('origin') || 'Kein Origin-Header'}`);
  console.log(`[DEBUG] Referer: ${req.get('referer') || 'Kein Referer-Header'}`);
  console.log(`[DEBUG] Request-Headers:`, req.headers);
  
  if (!accessCode) {
    console.log('[DEBUG] ❌ Kein Zugangscode angegeben');
    return res.status(400).json({
      error: true,
      message: 'Bitte gib einen Zugangscode ein'
    });
  }
  
  if (validateAccessCode(accessCode)) {
    const sessionId = createSession();
    console.log(`[DEBUG] ✅ Zugangscode gültig. Session erstellt: ${sessionId.substring(0, 8)}...`);
    
    // Umgebungsinformationen erfassen
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`[DEBUG] Request-URL: ${fullUrl}`);
    console.log(`[DEBUG] Protokoll: ${protocol}`);
    console.log(`[DEBUG] Host: ${host}`);
    console.log(`[DEBUG] Umgebung: ${isProduction ? 'Produktion' : 'Entwicklung'}`);
    console.log(`[DEBUG] Sichere Verbindung (HTTPS): ${isSecure ? 'Ja' : 'Nein'}`);
    
    // VEREINFACHTE AUTHENTIFIZIERUNG: Wir fokussieren uns auf Header-basierte Auth
    // da Cookies auf Render mit SameSite=None und verschiedenen Browsern Probleme machen
    
    // Erfolgsantwort mit Session-ID für client-seitige Speicherung
    const response = {
      error: false,
      message: 'Zugangscode akzeptiert',
      // KRITISCH: Session-ID wird explizit zurückgegeben
      sessionId: sessionId,
      debug: {
        sessionCreated: true,
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'production' : 'development',
        secure_connection: isSecure
      }
    };
    
    // Spezielle Debug-Header hinzufügen
    res.set('X-Debug-Session', 'Created');
    res.set('X-Debug-Time', new Date().toISOString());
    res.set('X-Session-Method', 'header-only');
    
    console.log('[DEBUG] Sende Antwort mit Session-ID für Header-basierte Auth');
    console.log(`[DEBUG] ====== LOGIN-VERSUCH ENDE ======`);
    
    return res.json(response);
  }
  
  console.log('❌ Ungültiger Zugangscode');
  return res.status(401).json({
    error: true,
    message: 'Ungültiger Zugangscode'
  });
});

/**
 * POST /logout
 * Invalidates the current session and clears the session cookie
 */
router.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  
  console.log('Logging out session:', sessionId);
  
  // Import the invalidateSession function from auth module
  const { invalidateSession } = require('../auth');
  
  if (sessionId && invalidateSession(sessionId)) {
    console.log('✅ Session invalidated successfully');
    
    // Clear the session cookie
    // Ermittle, ob wir in der Produktion oder Entwicklung sind
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: true, // Immer secure in Render-Umgebung verwenden
      sameSite: 'none', // Für Cross-Origin in Produktionsumgebung
      path: '/'
    });
    
    return res.json({
      error: false,
      message: 'Logged out successfully'
    });
  }
  
  console.log('❌ No valid session to logout');
  return res.status(400).json({
    error: true,
    message: 'No valid session'
  });
});

module.exports = router;