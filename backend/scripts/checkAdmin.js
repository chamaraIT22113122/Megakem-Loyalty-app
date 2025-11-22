const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB\n');

    const admins = await User.find({ role: 'admin' });
    
    console.log(`Found ${admins.length} admin user(s):\n`);
    
    admins.forEach((admin, index) => {
      console.log(`Admin #${index + 1}:`);
      console.log(`  ID: ${admin._id}`);
      console.log(`  Username: "${admin.username}"`);
      console.log(`  Email: "${admin.email}"`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  IsActive: ${admin.isActive}`);
      console.log(`  Created: ${admin.createdAt}`);
      console.log('');
    });

    // Try to find with exact email
    const specificAdmin = await User.findOne({ email: 'admin@megakem.com' }).select('+password');
    if (specificAdmin) {
      console.log('✅ Found admin with email "admin@megakem.com"');
      console.log(`   Has password hash: ${!!specificAdmin.password}`);
      console.log(`   Password hash length: ${specificAdmin.password?.length || 0}`);
    } else {
      console.log('❌ No admin found with email "admin@megakem.com"');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkAdmin();
