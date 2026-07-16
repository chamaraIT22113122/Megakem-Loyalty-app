const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['payment', 'general'],
    default: 'general'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'info'],
    default: 'info'
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['Member', 'User']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
