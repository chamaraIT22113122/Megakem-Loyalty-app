const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

// Backup Encryption Settings (must match autoBackup.js)
const BACKUP_ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'megakem-backup-key-change-in-production-123456';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(BACKUP_ENCRYPTION_KEY).digest();

/**
 * Decrypt text helper
 */
function decrypt(text) {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Decryption failed. Please check your BACKUP_ENCRYPTION_KEY. Details: ' + err.message);
  }
}

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

/**
 * Restores all collections from the backup JSON file to the active connection
 */
const restoreBackup = async (connection) => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(f => f.startsWith('backup-') && (f.endsWith('.json') || f.endsWith('.enc')));

    if (backupFiles.length === 0) {
      console.warn('⚠️ No backup files found in backups directory.');
      return;
    }

    // Sort by name (timestamp format ensures correct lexical sorting)
    backupFiles.sort();
    const latestBackupFile = backupFiles[backupFiles.length - 1];
    const backupPath = path.join(backupDir, latestBackupFile);
    console.log(`📂 Reading backup from ${backupPath}...`);
    
    let dataStr = await fs.readFile(backupPath, 'utf8');

    if (latestBackupFile.endsWith('.enc')) {
      console.log('🔑 Decrypting encrypted backup file...');
      dataStr = decrypt(dataStr);
    }
    
    const backupData = JSON.parse(dataStr);
    
    if (!backupData.collections) {
      console.warn('⚠️ No collections found in backup file.');
      return;
    }
    
    const collections = backupData.collections;
    for (const colName in collections) {
      const documents = collections[colName];
      if (!documents || documents.length === 0) {
        console.log(`ℹ️ Collection "${colName}" is empty in backup. Skipping.`);
        continue;
      }
      
      console.log(`🔄 Processing ${documents.length} records for "${colName}"...`);
      const convertedDocs = documents.map(doc => convertTypes(doc));
      
      const dbCollection = connection.collection(colName);
      
      // Clean existing data in the collection to prevent conflicts or duplicates
      await dbCollection.deleteMany({});
      
      // Insert backup documents
      await dbCollection.insertMany(convertedDocs);
      console.log(`✅ Restored ${convertedDocs.length} documents into collection "${colName}"`);
    }
    
    // Reset admin password to the .env configured default to ensure standard login works
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@megakem.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456!Change';
    const admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.password = adminPassword;
      await admin.save();
      console.log(`🔑 Automatically reset admin (${adminEmail}) password to environment default.`);
    }
    
    console.log('🎉 Full database restore completed successfully!');
  } catch (error) {
    console.error('❌ Error during backup restore:', error.message);
    throw error;
  }
};

module.exports = { restoreBackup };
