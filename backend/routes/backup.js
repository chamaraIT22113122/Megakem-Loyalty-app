const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const BackupMetadata = require('../models/BackupMetadata');
const { encryptData, decryptData } = require('../utils/encryption');

// Middleware to protect routes to only the main admin
const mainAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'admin@megakem.com') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as main admin' });
  }
};


const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const convertTypes = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    if (/^[0-9a-fA-F]{24}$/.test(obj)) return new mongoose.Types.ObjectId(obj);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) return new Date(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(convertTypes);
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) newObj[key] = convertTypes(obj[key]);
    return newObj;
  }
  return obj;
};

// @route   GET /api/backup/export
// @desc    Export specific or all database collections
// @access  Private/Admin
router.get('/export', protect, admin, mainAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    let collectionsToExport = [];
    
    if (req.query.collections) {
      collectionsToExport = req.query.collections.split(',');
    } else {
      const collections = await db.listCollections().toArray();
      collectionsToExport = collections.map(c => c.name);
    }
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      database: db.databaseName,
      collections: {}
    };

    for (const colName of collectionsToExport) {
      const data = await db.collection(colName).find({}).toArray();
      if (colName === 'users') {
          backupData.collections[colName] = data.map(user => {
              const u = { ...user };
              delete u.password;
              return u;
          });
      } else {
          backupData.collections[colName] = data;
      }
    }

    res.json({ success: true, data: backupData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during backup export', error: error.message });
  }
});

// @route   POST /api/backup/create-local
// @desc    Create a backup and store it on the server
// @access  Private/Admin
router.post('/create-local', protect, admin, mainAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    let collectionsToExport = req.body.collections || [];
    if (collectionsToExport.length === 0) {
      const collections = await db.listCollections().toArray();
      collectionsToExport = collections.map(c => c.name);
    }
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      database: db.databaseName,
      collections: {}
    };

    for (const colName of collectionsToExport) {
      const data = await db.collection(colName).find({}).toArray();
      if (colName === 'users') {
          backupData.collections[colName] = data.map(user => { const u = { ...user }; delete u.password; return u; });
      } else {
          backupData.collections[colName] = data;
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `manual-backup-${timestamp}.enc`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    const useCompression = req.body.compression !== false;
    const fileContent = JSON.stringify(backupData);
    const encryptedContent = encryptData(fileContent, useCompression);
    fs.writeFileSync(filePath, encryptedContent, 'utf8');
    
    const stats = fs.statSync(filePath);
    
    const metadata = await BackupMetadata.create({
      filename: fileName,
      size: stats.size,
      type: 'manual',
      collectionsIncluded: collectionsToExport
    });

    res.json({ success: true, message: 'Local backup created', data: metadata });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating local backup', error: error.message });
  }
});

// @route   GET /api/backup/list
// @desc    List all server-side backups (excluding archives)
// @access  Private/Admin
router.get('/list', protect, admin, mainAdmin, async (req, res) => {
  try {
    const backups = await BackupMetadata.find({ type: { $ne: 'archive' } }).sort({ timestamp: -1 });
    res.json({ success: true, data: backups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error listing backups', error: error.message });
  }
});

// @route   GET /api/backup/archives/list
// @desc    List all cold storage archives
// @access  Private/Admin

// @route   DELETE /api/backup/local/:id
// @desc    Delete a server-side backup
// @access  Private/Admin
router.delete('/local/:id', protect, admin, mainAdmin, async (req, res) => {
  try {
    const metadata = await BackupMetadata.findById(req.params.id);
    if (!metadata) return res.status(404).json({ success: false, message: 'Backup not found' });
    
    const filePath = path.join(BACKUP_DIR, metadata.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await metadata.deleteOne();
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting backup', error: error.message });
  }
});

// @route   GET /api/backup/download/:id
// @desc    Download a server-side backup file
// @access  Private/Admin
router.get('/download/:id', protect, admin, mainAdmin, async (req, res) => {
  try {
    const metadata = await BackupMetadata.findById(req.params.id);
    if (!metadata) return res.status(404).json({ success: false, message: 'Backup not found' });
    
    const filePath = path.join(BACKUP_DIR, metadata.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Backup file missing from disk' });
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let dataToSend = fileContent;
    
    // Decrypt if it's an encrypted backup
    if (metadata.filename.endsWith('.enc')) {
      dataToSend = decryptData(fileContent);
    }
    
    const downloadFilename = metadata.filename.replace('.enc', '.json');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${downloadFilename}`);
    res.send(dataToSend);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error downloading backup', error: error.message });
  }
});

// Helper for importing data
const importDataFn = async (backupData, merge = false, selectedCollections = null) => {
  if (!backupData || !backupData.collections) throw new Error('Invalid backup format');
  
  const collections = backupData.collections;
  const connection = mongoose.connection;
  let restoredCounts = {};

  for (const colName in collections) {
    if (selectedCollections && Array.isArray(selectedCollections) && !selectedCollections.includes(colName)) continue;
    
    const documents = collections[colName];
    if (!documents || documents.length === 0) continue;
    
    const convertedDocs = documents.map(doc => convertTypes(doc));
    const dbCollection = connection.collection(colName);
    
    if (merge) {
      const bulkOps = convertedDocs.map(doc => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true
        }
      }));
      await dbCollection.bulkWrite(bulkOps);
    } else {
      await dbCollection.deleteMany({});
      await dbCollection.insertMany(convertedDocs);
    }
    restoredCounts[colName] = convertedDocs.length;
  }
  
  // Ensure admin user exists and reset password to environment default so login works
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@megakem.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456!';
  const admin = await User.findOne({ email: adminEmail });
  if (admin) {
    admin.password = adminPassword;
    await admin.save();
  }
  return restoredCounts;
};

// @route   POST /api/backup/import
// @desc    Import/restore entire database from uploaded JSON or encrypted string
// @access  Private/Admin
router.post('/import', protect, admin, mainAdmin, async (req, res) => {
  try {
    const { backupData, encryptedString, merge, selectedCollections } = req.body;
    let dataToImport = backupData;
    
    if (encryptedString) {
      const decrypted = decryptData(encryptedString);
      dataToImport = JSON.parse(decrypted);
    }
    
    const restoredCounts = await importDataFn(dataToImport, merge === true || merge === 'true', selectedCollections);
    res.json({ success: true, message: 'Database restored successfully', restoredCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during backup import', error: error.message });
  }
});

// @route   POST /api/backup/restore-from-server/:id
// @desc    Restore database from a server-side backup
// @access  Private/Admin
router.post('/restore-from-server/:id', protect, admin, mainAdmin, async (req, res) => {
  try {
    const { merge, selectedCollections } = req.body;
    const metadata = await BackupMetadata.findById(req.params.id);
    if (!metadata) return res.status(404).json({ success: false, message: 'Backup not found' });
    
    const filePath = path.join(BACKUP_DIR, metadata.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Backup file missing from disk' });
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let backupData;
    
    // Decrypt if necessary
    if (metadata.filename.endsWith('.enc')) {
      const decrypted = decryptData(fileContent);
      backupData = JSON.parse(decrypted);
    } else {
      backupData = JSON.parse(fileContent);
    }
    
    const restoredCounts = await importDataFn(backupData, merge === true || merge === 'true', selectedCollections);
    res.json({ success: true, message: 'Database restored successfully from server', restoredCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error during server restore', error: error.message });
  }
});

// @route   GET /api/backup/stats
// @desc    Get storage and database statistics and predictions
// @access  Private/Admin
router.get('/stats', protect, admin, mainAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const dbStats = await db.stats();
    
    // Get backup storage size
    const backups = await BackupMetadata.find({ type: { $ne: 'archive' } });
    const backupStorageUsed = backups.reduce((acc, curr) => acc + curr.size, 0);
    const autoBackups = backups.filter(b => b.type === 'auto');
    const lastAutoBackup = autoBackups.length > 0 ? Math.max(...autoBackups.map(b => new Date(b.timestamp).getTime())) : null;
    
    const archives = await BackupMetadata.find({ type: 'archive' });
    const archiveStorageUsed = archives.reduce((acc, curr) => acc + curr.size, 0);

    // Simple Prediction: average size of auto backup * 30 days
    let predictedGrowth30Days = 0;
    if (autoBackups.length > 0) {
      const avgSize = autoBackups.reduce((acc, curr) => acc + curr.size, 0) / autoBackups.length;
      predictedGrowth30Days = avgSize * 30; // predict 30 days of auto backups
    }

    res.json({ 
      success: true, 
      data: {
        databaseSize: dbStats.dataSize,
        databaseStorage: dbStats.storageSize,
        backupStorageUsed,
        totalBackups: backups.length,
        archiveStorageUsed,
        totalArchives: archives.length,
        lastAutoBackup,
        predictedGrowth30Days
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching stats', error: error.message });
  }
});

module.exports = router;
