const mongoose = require('mongoose');

const recycleBinSchema = new mongoose.Schema({
  originalCollection: {
    type: String,
    required: true,
    enum: ['qrcodes', 'members', 'products', 'users', 'changerequests', 'scans', 'rewards', 'reprintrequests', 'feedbacks']
  },
  documentId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  documentData: {
    type: Object,
    required: true
  },
  summary: {
    type: String, // e.g. "QR Code: MKL39 001 060" or "Member: John Doe"
    required: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// TTL index to automatically delete items when expiresAt is reached
recycleBinSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
recycleBinSchema.index({ originalCollection: 1 });

module.exports = mongoose.model('RecycleBin', recycleBinSchema);
