const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  memberName: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true
  },
  memberId: {
    type: String,
    required: [true, 'Member ID is required'],
    uppercase: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['applicator', 'customer'],
    default: 'applicator'
  },
  productName: {
    type: String,
    required: [true, 'Product name is required']
  },
  productNo: {
    type: String,
    required: [true, 'Product number is required']
  },
  batchNo: {
    type: String,
    required: [true, 'Batch number is required']
  },
  bagNo: {
    type: String,
    required: [true, 'Bag number is required']
  },
  qty: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
scanSchema.index({ timestamp: -1 });
scanSchema.index({ memberId: 1 });
scanSchema.index({ role: 1 });
scanSchema.index({ batchNo: 1, bagNo: 1, memberId: 1, role: 1 }); // For duplicate detection

module.exports = mongoose.model('Scan', scanSchema);
