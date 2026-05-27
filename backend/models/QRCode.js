const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  qrId: {
    type: String,
    unique: true,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  productNo: String,
  batchNo: {
    type: String,
    required: true
  },
  packageNo: String,
  manufactureDate: Date,
  expiryDate: Date,
  qrLink: {
    type: String,
    required: true
  },
  customLink: String,
  qrData: String, // Base64 encoded QR image
  status: {
    type: String,
    enum: ['generated', 'printed', 'scanned', 'archived'],
    default: 'generated'
  },
  printedDate: Date,
  printedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  printerModel: {
    type: String,
    default: 'Zebra ZD320'
  },
  printSettings: {
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    dpi: {
      type: Number,
      default: 203
    },
    layout: {
      type: String,
      enum: ['standard', 'compact', 'detailed'],
      default: 'standard'
    }
  },
  tracingInfo: {
    qrScanned: Boolean,
    scanCount: { type: Number, default: 0 },
    lastScanDate: Date,
    lastScanBy: mongoose.Schema.Types.ObjectId
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
qrCodeSchema.index({ batchNo: 1, productNo: 1 });
qrCodeSchema.index({ status: 1 });
qrCodeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('QRCode', qrCodeSchema);
