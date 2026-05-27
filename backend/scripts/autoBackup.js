const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const dns = require('dns');
require('dotenv').config();

// DNS fix for MongoDB Atlas
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Perform a full database backup to JSON
 */
const performBackup = async () => {
  console.log('📦 Starting automatic database backup...');
  let connection = null;

  try {
    connection = await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      database: db.databaseName,
      collections: {}
    };

    for (const col of collections) {
      const data = await db.collection(col.name).find({}).toArray();
      backupData.collections[col.name] = data;
      console.log(`   • Backed up ${col.name} (${data.length} documents)`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup completed successfully: ${fileName}`);

    // Cleanup old backups (keep last 7 days)
    cleanupOldBackups();

    // NOTE: In a real production environment, you would upload this file to S3/Cloud Storage here.
    // Example: await uploadToS3(filePath, fileName);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  } finally {
    if (connection) {
      await mongoose.connection.close();
    }
  }
};

/**
 * Delete backups older than 7 days
 */
const cleanupOldBackups = () => {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > SEVEN_DAYS_MS) {
      fs.unlinkSync(filePath);
      console.log(`🧹 Deleted old backup: ${file}`);
    }
  });
};

// Schedule backup: Every day at 02:00 AM
// '0 2 * * *'
cron.schedule('0 2 * * *', () => {
  performBackup();
});

// Also export the function so it can be triggered manually
module.exports = { performBackup };

// If run directly, perform a backup now
if (require.main === module) {
  performBackup();
}
