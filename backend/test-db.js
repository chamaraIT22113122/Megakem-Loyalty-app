const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testConnection = async () => {
  try {
    console.log('Testing connection to:', process.env.MONGODB_URI.split('@')[1]); // Don't show credentials
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connection Success!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
    console.error('Stack Trace:', err.stack);
    process.exit(1);
  }
};

testConnection();
