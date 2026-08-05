const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  managerAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null means Main Admin, or it can be a specific Admin
  },
  actionType: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true
  },
  entityType: {
    type: String, // e.g., 'Product', 'User', 'QRCode', 'Applicator'
    required: true
  },
  entityId: {
    type: String, // The ID of the resource being changed (if applicable)
    default: null
  },
  endpoint: {
    type: String, // e.g., '/api/products/123'
    required: true
  },
  method: {
    type: String,
    enum: ['POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed, // The JSON body payload
    default: {}
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'failed'],
    default: 'pending'
  },
  executionError: {
    type: String,
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema);

module.exports = ChangeRequest;
