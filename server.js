const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, testDatabaseConnection, createLocationsTable, createCoupleImageTable, initializeDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const locationsRoutes = require('./routes/locations');
const uploadsRoutes = require('./routes/uploads');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json({ limit: '15mb' })); // Erhöhte Größenbegrenzung für JSON-Daten
app.use(express.urlencoded({ extended: true, limit: '15mb' })); // Erhöhte Größenbegrenzung für URL-kodierte Daten
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));

// Statische Dateien aus dem public-Ordner bereitstellen
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/api/locations', uploadsRoutes);
app.use('/api', locationsRoutes);

// API Info Route
app.get('/api-info', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { margin-bottom: 10px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .endpoint { background: #f4f4f4; padding: 10px; border-radius: 5px; }
          .method { font-weight: bold; color: #008000; }
        </style>
      </head>
      <body>
        <h1>API Server</h1>
        <p>Willkommen zum API-Server. Bitte melden Sie sich an, um auf die API-Endpunkte zuzugreifen.</p>
        <p><a href="/">Zurück zur Hauptseite</a></p>
        
        <h2>Verfügbare Endpunkte:</h2>
        <ul>
          <li class="endpoint"><span class="method">GET</span> /login - Anmeldeseite</li>
          <li class="endpoint"><span class="method">POST</span> /verify-access - Zugangscode überprüfen</li>
          <li class="endpoint"><span class="method">GET</span> /api/locations - Alle Standorte abrufen</li>
          <li class="endpoint"><span class="method">GET</span> /api/locations/:id - Standort nach ID abrufen</li>
          <li class="endpoint"><span class="method">POST</span> /api/locations - Neuen Standort hinzufügen</li>
          <li class="endpoint"><span class="method">PUT</span> /api/locations/:id - Standort aktualisieren</li>
          <li class="endpoint"><span class="method">DELETE</span> /api/locations/:id - Standort löschen</li>
          <li class="endpoint"><span class="method">POST</span> /api/locations/:id/upload - Bild für Standort hochladen</li>
          <li class="endpoint"><span class="method">GET</span> /api/locations/:id/image - Bild für Standort abrufen</li>
          <li class="endpoint"><span class="method">GET</span> /api/locations/:id/image?thumb=true - Thumbnail für Standort abrufen</li>
        </ul>
      </body>
    </html>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'An unexpected error occurred',
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database
    const success = await initializeDatabase();
    if (!success) {
      console.error('❌ Cannot proceed with server startup due to database initialization error');
      process.exit(1);
    }
    
    // Start the server - explicitly bind to 0.0.0.0 to allow external access
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📝 API documentation available at http://localhost:${PORT}/`);
      console.log(`🔐 Login page available at http://localhost:${PORT}/login`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Export the startServer function for use in workflow
module.exports = { startServer };

// If this file is run directly, start the server
if (require.main === module) {
  startServer();
}