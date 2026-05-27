const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  module: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for performance on searches
auditLogSchema.index({ timestamp: -1, module: 1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
