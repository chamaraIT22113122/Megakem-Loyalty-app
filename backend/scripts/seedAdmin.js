const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@megakem.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📝 Admin Credentials:');
    console.log('   Email: admin@megakem.com');
    console.log('   Password: Admin@123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
