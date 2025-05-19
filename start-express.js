const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Simple test route
app.get('/', (req, res) => {
  res.json({
    message: 'Express server is running!',
    accessCode: process.env.ACCESS_CODE ? 'Access code is configured.' : 'Access code is missing!',
    databaseUrl: process.env.DATABASE_URL ? 'Database URL is configured.' : 'Database URL is missing!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Express server running on port ${PORT}`);
  console.log(`📝 Server available at http://localhost:${PORT}/`);
});