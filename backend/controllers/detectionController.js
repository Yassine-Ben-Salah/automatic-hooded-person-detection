const Detection = require('../models/Detection');
const axios = require('axios');

// @desc    Get latest detection from model and save to database
// @route   POST /api/detections/capture
// @access  Private
exports.captureDetection = async (req, res) => {
  try {
    // Get latest detections from Python model API
    const response = await axios.get(`${process.env.MODEL_API_URL}/detections`);
    const { detections } = response.data;
    
    if (!detections || detections.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No objects detected',
        detections: []
      });
    }
    
    // Save detections to database
    const savedDetections = await Promise.all(
      detections.map(async (detection) => {
        const newDetection = new Detection({
          label: detection.label,
          confidence: detection.confidence
        });
        
        return await newDetection.save();
      })
    );
    
    // Emit detection event via Socket.IO
    const io = req.app.get('io');
    io.emit('newDetection', { detections: savedDetections });
    
    res.status(201).json({
      success: true,
      count: savedDetections.length,
      detections: savedDetections
    });
  } catch (error) {
    console.error('Error capturing detection:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all detections with pagination
// @route   GET /api/detections
// @access  Private
exports.getDetections = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    const total = await Detection.countDocuments();
    
    // Filter options
    const filter = {};
    if (req.query.label) filter.label = req.query.label;
    if (req.query.status) filter.status = req.query.status;
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get detections with sorting
    const detections = await Detection.find(filter)
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('reviewedBy', 'username');
    
    res.json({
      success: true,
      count: detections.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      detections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get detection by ID
// @route   GET /api/detections/:id
// @access  Private
exports.getDetectionById = async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id)
      .populate('reviewedBy', 'username');
    
    if (detection) {
      res.json({
        success: true,
        detection
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update detection status
// @route   PUT /api/detections/:id
// @access  Private/Admin
exports.updateDetection = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const detection = await Detection.findById(req.params.id);
    
    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }
    
    // Update detection fields
    if (status) detection.status = status;
    if (notes) detection.notes = notes;
    
    // Set reviewer
    detection.reviewedBy = req.user._id;
    
    const updatedDetection = await detection.save();
    
    res.json({
      success: true,
      detection: updatedDetection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete detection
// @route   DELETE /api/detections/:id
// @access  Private/Admin
exports.deleteDetection = async (req, res) => {
  try {
    const detection = await Detection.findById(req.params.id);
    
    if (!detection) {
      return res.status(404).json({
        success: false,
        message: 'Detection not found'
      });
    }
    
    await detection.deleteOne();
    
    res.json({
      success: true,
      message: 'Detection removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get detection statistics
// @route   GET /api/detections/stats
// @access  Private
exports.getDetectionStats = async (req, res) => {
  try {
    // Get counts by label
    const labelStats = await Detection.aggregate([
      {
        $group: {
          _id: '$label',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get counts by status
    const statusStats = await Detection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await Detection.countDocuments({
      timestamp: { $gte: today }
    });
    
    // Get count for last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const weeklyCount = await Detection.countDocuments({
      timestamp: { $gte: lastWeek }
    });
    
    // Get daily counts for the last 7 days
    const dailyCounts = await Detection.aggregate([
      {
        $match: {
          timestamp: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Format daily counts
    const formattedDailyCounts = dailyCounts.map(item => {
      const date = new Date(item._id.year, item._id.month - 1, item._id.day);
      return {
        date: date.toISOString().split('T')[0],
        count: item.count
      };
    });
    
    res.json({
      success: true,
      stats: {
        total: await Detection.countDocuments(),
        today: todayCount,
        weekly: weeklyCount,
        byLabel: labelStats,
        byStatus: statusStats,
        dailyCounts: formattedDailyCounts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}; 