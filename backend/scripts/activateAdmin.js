const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const activateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB\n');

    const admin = await User.findOne({ email: 'admin@megakem.com' });

    if (!admin) {
      console.log('❌ Admin user with email "admin@megakem.com" not found');
      process.exit(1);
    }

    if (admin.isActive) {
      console.log('✅ Admin account is already active');
      process.exit(0);
    }

    admin.isActive = true;
    await admin.save();

    console.log('✅ Admin account activated successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

activateAdmin();