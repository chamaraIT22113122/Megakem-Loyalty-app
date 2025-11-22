const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB\n');

    const admin = await User.findOne({ email: 'admin@megakem.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found');
      process.exit(1);
    }

    console.log('Testing password: "Admin@123"');
    const isMatch = await admin.comparePassword('Admin@123');
    console.log(`Password match: ${isMatch ? '✅ YES' : '❌ NO'}\n`);

    if (!isMatch) {
      console.log('Resetting password to "Admin@123"...');
      admin.password = 'Admin@123';
      await admin.save();
      console.log('✅ Password has been reset!');
      
      // Test again
      const adminAfter = await User.findOne({ email: 'admin@megakem.com' }).select('+password');
      const isMatchAfter = await adminAfter.comparePassword('Admin@123');
      console.log(`New password match: ${isMatchAfter ? '✅ YES' : '❌ NO'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testPassword();
