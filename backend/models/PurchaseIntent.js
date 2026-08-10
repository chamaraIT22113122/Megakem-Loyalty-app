const mongoose = require('mongoose');

const purchaseIntentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  inquiryNumber: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  memberId: {
    type: String,
    trim: true
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  },
  visitorId: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'lost'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for easier querying by product or visitor
purchaseIntentSchema.index({ product: 1 });
purchaseIntentSchema.index({ visitorId: 1 });
purchaseIntentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PurchaseIntent', purchaseIntentSchema);
