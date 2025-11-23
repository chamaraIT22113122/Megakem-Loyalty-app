const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  productNo: {
    type: String,
    required: [true, 'Product number is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  batches: [{
    batchNo: String,
    manufactureDate: Date,
    expiryDate: Date,
    quantity: Number
  }]
}, {
  timestamps: true
});

// Index for faster product lookups
productSchema.index({ productNo: 1 });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
