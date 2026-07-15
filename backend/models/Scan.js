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
  phone: {
    type: String,
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
    default: ''
  },
  qty: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date
  },
  connectedHardware: {
    type: String,
    trim: true,
    default: ''
  },
  connectedHardwareId: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true
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

// Auto-assign role based on memberId prefix before saving
scanSchema.pre('save', async function() {
  if (this.memberId) {
    const id = this.memberId.toUpperCase();
    if (id.startsWith('MA')) {
      this.role = 'applicator';
    } else if (id.startsWith('MH') || id.startsWith('CUS-')) {
      this.role = 'customer';
    }
  }
});

// Index for faster queries
scanSchema.index({ timestamp: -1 });
scanSchema.index({ memberId: 1 });
scanSchema.index({ role: 1 });
scanSchema.index({ batchNo: 1, bagNo: 1, memberId: 1, role: 1 }); // For duplicate detection

module.exports = mongoose.model('Scan', scanSchema);
