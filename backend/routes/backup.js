const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, isAdmin } = require('../middleware/auth');
const User = require('../models/User');

/**
 * Recursively converts string representation of ObjectIds and Dates to proper BSON types
 */
const convertTypes = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Match 24-character hexadecimal string (MongoDB ObjectId)
    if (/^[0-9a-fA-F]{24}$/.test(obj)) {
      return new mongoose.Types.ObjectId(obj);
    }
    // Match ISO date string formats
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertTypes);
  }
  
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = convertTypes(obj[key]);
    }
    return newObj;
  }
  
  return obj;
};

// @route   GET /api/backup/export
// @desc    Export entire database collections
// @access  Private/Admin
router.get('/export', verifyToken, isAdmin, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      database: db.databaseName,
      collections: {}
    };

    for (const col of collections) {
      const data = await db.collection(col.name).find({}).toArray();
      // Optionally exclude sensitive information like user passwords from export
      if (col.name === 'users') {
          backupData.collections[col.name] = data.map(user => {
              const u = { ...user };
              delete u.password;
              return u;
          });
      } else {
          backupData.collections[col.name] = data;
      }
    }

    res.json({
      success: true,
      data: backupData
    });
  } catch (error) {
    console.error('Backup export error:', error);
    res.status(500).json({ success: false, message: 'Server error during backup export', error: error.message });
  }
});


// @route   POST /api/backup/import
// @desc    Import/restore entire database
// @access  Private/Admin
router.post('/import', verifyToken, isAdmin, async (req, res) => {
  try {
    const backupData = req.body.backupData;

    if (!backupData || !backupData.collections) {
      return res.status(400).json({ success: false, message: 'Invalid backup format. Collections missing.' });
    }

    const collections = backupData.collections;
    const connection = mongoose.connection;
    let restoredCounts = {};

    for (const colName in collections) {
      const documents = collections[colName];
      if (!documents || documents.length === 0) {
        continue;
      }
      
      const convertedDocs = documents.map(doc => convertTypes(doc));
      const dbCollection = connection.collection(colName);
      
      // Clean existing data in the collection
      await dbCollection.deleteMany({});
      
      // Insert backup documents
      await dbCollection.insertMany(convertedDocs);
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

    res.json({
      success: true,
      message: 'Database restored successfully',
      restoredCounts
    });
  } catch (error) {
    console.error('Backup import error:', error);
    res.status(500).json({ success: false, message: 'Server error during backup import', error: error.message });
  }
});

module.exports = router;
