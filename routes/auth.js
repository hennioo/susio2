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
 */
router.post('/verify-access', (req, res) => {
  const { accessCode } = req.body;
  
  console.log(`Zugangscode-Überprüfung - ${new Date().toISOString()}`);
  
  if (!accessCode) {
    console.log('❌ Kein Zugangscode angegeben');
    return res.status(400).json({
      error: true,
      message: 'Bitte gib einen Zugangscode ein'
    });
  }
  
  if (validateAccessCode(accessCode)) {
    const sessionId = createSession();
    console.log(`✅ Zugangscode gültig. Session erstellt: ${sessionId.substring(0, 8)}...`);
    
    // Ermittle, ob wir in der Produktion oder Entwicklung sind
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`Umgebung: ${isProduction ? 'Produktion' : 'Entwicklung'}, Sichere Verbindung: ${isSecure}`);
    
    // Cookie-Optionen basierend auf der Umgebung
    // Anmerkung: Bei Render/HTTPS muss secure auf JEDEN FALL true sein, wenn SameSite: 'none' gesetzt ist
    // SameSite=None erfordert zwingend Secure=true, sonst wird der Cookie sofort verworfen
    const cookieOptions = {
      httpOnly: true,
      secure: true, // Immer secure in Render-Umgebung (muss true sein für SameSite=None)
      sameSite: 'none', // 'none' ist nötig für Cross-Origin in Produktionsumgebung
      path: '/', // Wichtig: Expliziter Pfad für bessere Browser-Kompatibilität
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    };
    
    // Session-Cookie setzen
    res.cookie('sessionId', sessionId, cookieOptions);
    console.log('Session-Cookie gesetzt mit Optionen:', JSON.stringify(cookieOptions));
    
    return res.json({
      error: false,
      message: 'Zugangscode akzeptiert',
      // Wir senden die sessionId nicht mehr zurück, da sie über httpOnly Cookie gesendet wird
    });
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