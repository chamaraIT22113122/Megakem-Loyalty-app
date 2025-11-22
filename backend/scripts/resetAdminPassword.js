const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@megakem.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating new admin...');
      const newAdmin = await User.create({
        username: 'admin',
        email: 'admin@megakem.com',
        password: 'Admin@123',
        role: 'admin',
        isActive: true
      });
      console.log('✅ New admin user created!');
    } else {
      // Reset password
      admin.password = 'Admin@123';
      await admin.save();
      console.log('✅ Admin password reset successfully!');
    }

    console.log('');
    console.log('📝 Admin Credentials:');
    console.log('   Email: admin@megakem.com');
    console.log('   Password: Admin@123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();
