const mongoose = require('mongoose');
const User = require('../models/User');
const dns = require('dns');
require('dotenv').config();

// Override DNS resolver to use Google's public DNS (8.8.8.8)
// This fixes querySrv ECONNREFUSED errors caused by local DNS blocking SRV lookups
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

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
