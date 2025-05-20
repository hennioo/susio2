const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const { pool } = require('../phase1_test');

/**
 * GET /api/stats
 * Returns statistics about the database
 */
router.get('/stats', requireAuth, async (req, res) => {
  console.log('📊 Fetching statistics');
  
  try {
    const client = await pool.connect();
    try {
      // Get total locations count
      const locationsCountResult = await client.query('SELECT COUNT(*) as count FROM locations');
      const totalLocations = parseInt(locationsCountResult.rows[0].count);
      
      // Get total images count
      const imagesCountResult = await client.query('SELECT COUNT(*) as count FROM locations WHERE image_data IS NOT NULL');
      const totalImages = parseInt(imagesCountResult.rows[0].count);
      
      // Get database size in MB
      const dbSizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as pretty_size,
          pg_database_size(current_database()) / (1024 * 1024) as size_mb
        FROM pg_database 
        WHERE datname = current_database()
      `;
      const dbSizeResult = await client.query(dbSizeQuery);
      const databaseSizeMB = parseFloat(dbSizeResult.rows[0].size_mb).toFixed(2);
      const databaseSizePretty = dbSizeResult.rows[0].pretty_size;
      
      // Get recent locations
      const recentLocationsResult = await client.query(`
        SELECT id, title, created_at 
        FROM locations 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      const recentLocations = recentLocationsResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at
      }));
      
      console.log(`✅ Statistics fetched successfully: ${totalLocations} locations, ${totalImages} images, DB size: ${databaseSizePretty}`);
      
      res.json({
        error: false,
        data: {
          totalLocations,
          totalImages,
          databaseSizeMB,
          recentLocations
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve statistics',
      details: error.message
    });
  }
});

module.exports = router;