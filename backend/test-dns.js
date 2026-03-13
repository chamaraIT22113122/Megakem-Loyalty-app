const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Try using Google DNS
dns.setServers(['8.8.8.8']);

dotenv.config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
  try {
    console.log('Testing with Google DNS...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Success!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

testConnection();
