import express from 'express';
import pool from '../database/connection.js';
import cloudinary from '../config/cloudinary.js';
import { v2 as cloudinaryUpload } from 'cloudinary';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All waypoints routes require authentication
router.use(authenticateToken);

// Get all waypoints
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM waypoints ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching waypoints:', error);
    res.status(500).json({ error: 'Failed to fetch waypoints' });
  }
});

// Get a single waypoint by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM waypoints WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waypoint not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching waypoint:', error);
    res.status(500).json({ error: 'Failed to fetch waypoint' });
  }
});

// Create a new waypoint
router.post('/', async (req, res) => {
  try {
    const { name, latitude, longitude, notes, image_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO waypoints (name, latitude, longitude, notes, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, latitude, longitude, notes || null, image_url || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating waypoint:', error);
    res.status(500).json({ error: 'Failed to create waypoint' });
  }
});

// Update a waypoint
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, notes, image_url } = req.body;
    
    const result = await pool.query(
      `UPDATE waypoints 
       SET name = $1, latitude = $2, longitude = $3, notes = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, latitude, longitude, notes || null, image_url || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Waypoint not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating waypoint:', error);
    res.status(500).json({ error: 'Failed to update waypoint' });
  }
});

// Delete a waypoint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get waypoint to check if it has an image
    const waypointResult = await pool.query(
      'SELECT image_url FROM waypoints WHERE id = $1',
      [id]
    );
    
    if (waypointResult.rows.length === 0) {
      return res.status(404).json({ error: 'Waypoint not found' });
    }
    
    // Delete image from Cloudinary if it exists
    if (waypointResult.rows[0].image_url) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = waypointResult.rows[0].image_url.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        await cloudinaryUpload.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with waypoint deletion even if image deletion fails
      }
    }
    
    // Delete waypoint from database
    const result = await pool.query(
      'DELETE FROM waypoints WHERE id = $1 RETURNING *',
      [id]
    );
    
    res.json({ message: 'Waypoint deleted successfully', waypoint: result.rows[0] });
  } catch (error) {
    console.error('Error deleting waypoint:', error);
    res.status(500).json({ error: 'Failed to delete waypoint' });
  }
});

export default router;

