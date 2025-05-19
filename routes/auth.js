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
                
                // Redirect to main page after a short delay
                setTimeout(() => {
                  window.location.href = '/';
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
  
  console.log('Verifying access code');
  
  if (!accessCode) {
    console.log('❌ No access code provided');
    return res.status(400).json({
      error: true,
      message: 'Access code is required'
    });
  }
  
  if (validateAccessCode(accessCode)) {
    const sessionId = createSession();
    
    // Set session cookie
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      // secure: true, // Enable in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log('✅ Access code verified successfully');
    return res.json({
      error: false,
      message: 'Access granted',
      sessionId
    });
  }
  
  console.log('❌ Invalid access code');
  return res.status(401).json({
    error: true,
    message: 'Invalid access code'
  });
});

module.exports = router;