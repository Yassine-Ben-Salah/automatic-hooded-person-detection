const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    enum: ['Assault', 'Balaclava', 'Intrusion', 'Suspect', 'Weapons', 'Bags Theft', 'Undefined']
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: 'Main Camera'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'false_alarm', 'confirmed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient querying
detectionSchema.index({ label: 1, timestamp: -1 });
detectionSchema.index({ status: 1 });

const Detection = mongoose.model('Detection', detectionSchema);

module.exports = Detection; 