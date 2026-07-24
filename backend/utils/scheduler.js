const cron = require('node-cron');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const BackupMetadata = require('../models/BackupMetadata');
const { checkAndResetPoints } = require('../scripts/pointsReset');
const { encryptData } = require('./encryption');

const BACKUP_DIR = path.join(__dirname, '../backups');

const performAutoBackup = async () => {
  console.log('📦 Starting automatic database backup...');
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      database: db.databaseName,
      collections: {}
    };

    const collectionNames = collections.map(c => c.name);

    for (const colName of collectionNames) {
      const data = await db.collection(colName).find({}).toArray();
      if (colName === 'users') {
          backupData.collections[colName] = data.map(user => { const u = { ...user }; delete u.password; return u; });
      } else {
          backupData.collections[colName] = data;
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `auto-backup-${timestamp}.enc`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    const LoyaltyConfig = require('../models/LoyaltyConfig');
    const config = await LoyaltyConfig.getConfig();
    const useCompression = config.compression?.enabled !== false;

    const fileContent = JSON.stringify(backupData);
    const encryptedContent = encryptData(fileContent, useCompression);
    fs.writeFileSync(filePath, encryptedContent, 'utf8');
    
    const stats = fs.statSync(filePath);
    
    await BackupMetadata.create({
      filename: fileName,
      size: stats.size,
      type: 'auto',
      collectionsIncluded: collectionNames
    });

    console.log(`✅ Automatic backup completed successfully: ${fileName}`);
    
    // Attempt to upload to Google Drive if configured
    const { uploadToGoogleDrive } = require('./googleDriveUpload');
    await uploadToGoogleDrive(filePath, fileName);

    // Cleanup is now called from cron task with correct retention days
    // cleanupOldBackups();

  } catch (error) {
    console.error('❌ Automatic backup failed:', error.message);
  }
};

const cleanupOldBackups = async (retentionDays = 30) => {
  try {
    const RETENTION_MS = retentionDays * 24 * 60 * 60 * 1000;
    const oldDate = new Date(Date.now() - RETENTION_MS);
    
    const oldBackups = await BackupMetadata.find({ timestamp: { $lt: oldDate } });
    
    for (const backup of oldBackups) {
      const filePath = path.join(BACKUP_DIR, backup.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await backup.deleteOne();
      console.log(`🧹 Deleted old backup: ${backup.filename}`);
    }
  } catch (error) {
    console.error('⚠️ Error cleaning up old backups:', error.message);
  }
};

const performArchiving = async () => {
  try {
    const LoyaltyConfig = require('../models/LoyaltyConfig');
    const Scan = require('../models/Scan');
    
    const config = await LoyaltyConfig.getConfig();
    if (config.archiving?.enabled !== true) return;
    
    const thresholdMonths = config.archiving.thresholdMonths || 12;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - thresholdMonths);
    
    const scansToArchive = await Scan.find({ createdAt: { $lt: cutoffDate } });
    if (scansToArchive.length === 0) return;
    
    console.log(`🗄️ Starting cold storage archiving for ${scansToArchive.length} old records...`);
    
    const archiveData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      database: mongoose.connection.db.databaseName,
      isArchive: true,
      collections: { scans: scansToArchive }
    };
    
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `archive-${timestampStr}.enc`;
    const filePath = path.join(BACKUP_DIR, fileName);
    
    const fileContent = JSON.stringify(archiveData);
    const encryptedContent = encryptData(fileContent, true);
    fs.writeFileSync(filePath, encryptedContent, 'utf8');
    
    const stats = fs.statSync(filePath);
    await BackupMetadata.create({
      filename: fileName,
      size: stats.size,
      type: 'archive',
      collectionsIncluded: ['scans']
    });
    
    await Scan.deleteMany({ createdAt: { $lt: cutoffDate } });
    console.log(`✅ Archiving complete. Deleted ${scansToArchive.length} records from live database.`);
  } catch (error) {
    console.error('❌ Archiving failed:', error.message);
  }
};

let autoBackupTask = null;
let autoArchiveTask = null;

const initScheduler = async () => {
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const LoyaltyConfig = require('../models/LoyaltyConfig');
  const config = await LoyaltyConfig.getConfig();
  const backupEnabled = config.autoBackup?.enabled !== false;
  const retentionDays = config.autoBackup?.retentionDays || 30;
  
  let cronExpression = '0 0 * * *'; // default daily
  if (config.autoBackup?.frequency === 'weekly') cronExpression = '0 0 * * 0';
  if (config.autoBackup?.frequency === 'monthly') cronExpression = '0 0 1 * *';

  if (backupEnabled) {
    autoBackupTask = cron.schedule(cronExpression, () => {
      performAutoBackup();
      cleanupOldBackups(retentionDays);
    });
    console.log(`⏰ Auto-backup scheduled: ${cronExpression} (Retention: ${retentionDays} days)`);
  }
  
  if (config.archiving?.enabled) {
    autoArchiveTask = cron.schedule('0 2 * * 0', () => { // Run weekly at 2 AM on Sunday
      performArchiving();
    });
    console.log('⏰ Auto-archiving engine scheduled (Weekly).');
  }

  // Schedule daily points reset at midnight
  cron.schedule('0 0 * * *', () => {
    checkAndResetPoints();
  });
  
  console.log('⏰ Scheduler initialized for points reset.');
};

const updateBackupSchedule = async () => {
  if (autoBackupTask) {
    autoBackupTask.stop();
    autoBackupTask = null;
  }
  if (autoArchiveTask) {
    autoArchiveTask.stop();
    autoArchiveTask = null;
  }
  
  const LoyaltyConfig = require('../models/LoyaltyConfig');
  const config = await LoyaltyConfig.getConfig();
  const backupEnabled = config.autoBackup?.enabled !== false;
  const retentionDays = config.autoBackup?.retentionDays || 30;
  
  let cronExpression = '0 0 * * *'; // default daily
  if (config.autoBackup?.frequency === 'weekly') cronExpression = '0 0 * * 0';
  if (config.autoBackup?.frequency === 'monthly') cronExpression = '0 0 1 * *';

  if (backupEnabled) {
    autoBackupTask = cron.schedule(cronExpression, () => {
      performAutoBackup();
      cleanupOldBackups(retentionDays);
    });
    console.log(`⏰ Auto-backup schedule updated: ${cronExpression} (Retention: ${retentionDays} days)`);
  } else {
    console.log('⏰ Auto-backup disabled via configuration.');
  }

  if (config.archiving?.enabled) {
    autoArchiveTask = cron.schedule('0 2 * * 0', () => { // Run weekly at 2 AM on Sunday
      performArchiving();
    });
    console.log('⏰ Auto-archiving engine scheduled (Weekly).');
  }
};

module.exports = { initScheduler, performAutoBackup, updateBackupSchedule };
