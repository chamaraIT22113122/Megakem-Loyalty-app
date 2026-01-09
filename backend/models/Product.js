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
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  packSizePricing: [{
    packSize: String,    // e.g., "1kg", "10kg", "25kg"
    price: Number        // Price for this pack size
  }],
  pointsPerProduct: {
    type: Number,
    default: null,       // null means use price-based calculation
    min: 0
  },
  pointsPerPackSize: [{
    packSize: String,    // e.g., "1kg", "10kg", "25kg"
    points: Number       // Points earned for this pack size
  }],
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

// Index for faster product lookups - compound index with productNo and category (pack size)
productSchema.index({ productNo: 1, category: 1 }, { unique: true });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
