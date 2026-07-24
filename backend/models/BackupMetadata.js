const mongoose = require('mongoose');

const backupMetadataSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  size: {
    type: Number, // File size in bytes
    required: true
  },
  type: {
    type: String,
    enum: ['manual', 'auto', 'archive'],
    default: 'manual'
  },
  collectionsIncluded: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  }
});

module.exports = mongoose.model('BackupMetadata', backupMetadataSchema);
