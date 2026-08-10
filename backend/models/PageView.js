const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
  },
  referrer: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  deviceType: {
    type: String,
    enum: ['Mobile', 'Tablet', 'Desktop', 'Unknown'],
    default: 'Unknown',
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Indexes for fast querying in analytics
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ path: 1, timestamp: -1 });
pageViewSchema.index({ deviceType: 1 });

module.exports = mongoose.model('PageView', pageViewSchema);
