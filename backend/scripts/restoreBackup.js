const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
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

/**
 * Restores all collections from the backup JSON file to the active connection
 */
const restoreBackup = async (connection) => {
  try {
    const backupPath = path.join(__dirname, '../backups/backup-2026-05-04T11-16-41-559Z.json');
    console.log(`📂 Reading backup from ${backupPath}...`);
    
    const dataStr = await fs.readFile(backupPath, 'utf8');
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
