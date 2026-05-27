const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS resolver to use Google's public DNS (8.8.8.8)
// This fixes querySrv ECONNREFUSED errors caused by local DNS blocking SRV lookups
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  console.log('🌐 DNS configured (8.8.8.8, 8.8.4.4, 1.1.1.1)');
} catch (err) {
  console.warn('⚠️  Could not set custom DNS servers:', err.message);
}

let mongoServer = null;

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    let uri = process.env.MONGODB_URI;

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      family: 4, // Force IPv4
    });
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('IP address is on your Atlas cluster\'s IP whitelist')) {
      console.log('🚨 ACTION REQUIRED: Your IP is not whitelisted on MongoDB Atlas.');
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`👉 Your current Public IP is: ${data.ip}`);
        console.log(`👉 Please log in to https://cloud.mongodb.com and add ${data.ip} to "Network Access".`);
      } catch (ipError) {
        console.log('👉 Please log in to https://cloud.mongodb.com and add your current IP to "Network Access".');
      }
    }

    try {
      console.log('💡 Trying to start a local persistent MongoDB server as fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const path = require('path');
      const fs = require('fs');
      
      const dbPath = path.join(__dirname, '../db-data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: 'wiredTiger'
        }
      });
      const fallbackUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(fallbackUri);
      console.log(`📦 Local Persistent MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (memError) {
      console.error(`💡 Error starting local MongoDB: ${memError.message}`);
      console.error('💡 Starting server in offline mode. Some features may not work.');
      console.warn('⚠️  Database not connected - running with limited functionality');
      return null;
    }
  }
};

module.exports = connectDB;
