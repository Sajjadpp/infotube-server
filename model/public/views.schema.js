const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  // Reference to the video being viewed
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true
  },
  
  // Reference to the user who viewed (if logged in)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Device/browser information
  device: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'smarttv', 'unknown'],
    default: 'unknown'
  },
  
  // Location data (if available)
  location: {
    country: String,
    region: String,
    city: String,
    ipAddress: String
  },
  
  // View duration tracking (in seconds)
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Watch percentage (0-100)
  watchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Engagement flags
  engagement: {
    liked: Boolean,
    shared: Boolean,
    commented: Boolean,
    saved: Boolean
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // For shorts-specific tracking
  isShort: {
    type: Boolean,
    default: false
  },
  
  // Referral source
  source: {
    type: String,
    enum: ['homepage', 'search', 'external', 'notification', 'profile', 'hashtag', 'unknown'],
    default: 'unknown'
  }
}, {
  // Auto-create createdAt/updatedAt timestamps
  timestamps: true
});

// Compound index for frequent queries
viewSchema.index({ video: 1, createdAt: -1 });
viewSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model('View', viewSchema);