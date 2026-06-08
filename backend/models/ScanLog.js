const mongoose = require('mongoose');

/**
 * ScanLog — records every QR scan attempt for traceability.
 * Upgrade 5: Traceability & Scanning Logs
 *
 * Captures: success, fraud (invalid_sig), duplicates, invalid formats,
 * product-not-found events, and legacy unsigned scans.
 */
const scanLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['success', 'duplicate', 'invalid_sig', 'invalid_format', 'product_not_found', 'legacy'],
    required: true,
    index: true
  },
  productNo: {
    type: String,
    index: true
  },
  batchNo: {
    type: String,
    index: true
  },
  packageNo: String,
  memberId: {
    type: String,
    index: true
  },
  role: {
    type: String,
    enum: ['applicator', 'customer', 'admin', 'anonymous', null]
  },
  // Signature status: 'valid', 'invalid', 'missing' (missing = legacy unsigned QR)
  signature: {
    type: String,
    enum: ['valid', 'invalid', 'missing'],
    default: 'missing'
  },
  city: String,
  ipAddress: String,
  userAgent: String,
  // Extra context for the event (error message, rejection reason, etc.)
  notes: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for common query patterns
scanLogSchema.index({ eventType: 1, timestamp: -1 });
scanLogSchema.index({ productNo: 1, timestamp: -1 });
scanLogSchema.index({ memberId: 1, eventType: 1 });

// Auto-expire old logs after 1 year to keep collection size manageable
scanLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('ScanLog', scanLogSchema);
