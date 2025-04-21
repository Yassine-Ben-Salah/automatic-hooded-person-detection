const express = require('express');
const router = express.Router();
const { 
  captureDetection, 
  getDetections, 
  getDetectionById, 
  updateDetection, 
  deleteDetection,
  getDetectionStats
} = require('../controllers/detectionController');
const { protect, admin } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all detections & capture new detection
router.route('/')
  .get(getDetections);

router.post('/capture', captureDetection);

// Get detection statistics
router.get('/stats', getDetectionStats);

// Get, update, delete detection by ID
router.route('/:id')
  .get(getDetectionById)
  .put(updateDetection)
  .delete(admin, deleteDetection);

module.exports = router; 