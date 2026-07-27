const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['applicator', 'customer'],
    default: 'applicator'
  },
  name: {
    type: String
  },
  phone: {
    type: String
  },
  applicatorId: {
    type: String
  },
  role: {
    type: String,
    default: 'applicator'
  },
  batchNumber: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: true
  },
  imageUrls: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
