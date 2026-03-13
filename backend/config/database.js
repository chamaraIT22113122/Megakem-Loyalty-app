const mongoose = require('mongoose');
const dns = require('dns');

// Configure DNS fallback for MongoDB SRV resolution issues
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('🌐 DNS fallback configured (8.8.8.8, 1.1.1.1)');
} catch (err) {
  console.warn('⚠️  Could not set custom DNS servers:', err.message);
}

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      family: 4, // Force IPv4
    });
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('💡 Please check your MongoDB Atlas IP whitelist settings');
    process.exit(1);
  }
};

module.exports = connectDB;
