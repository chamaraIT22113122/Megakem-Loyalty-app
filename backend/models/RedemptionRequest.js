const mongoose = require('mongoose');

const redemptionRequestSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    index: true
  },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  pointsUsed: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  processDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RedemptionRequest', redemptionRequestSchema);
