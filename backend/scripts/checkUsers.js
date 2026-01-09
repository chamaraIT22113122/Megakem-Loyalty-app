const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB\n');

    const users = await User.find().select('username email role isActive');
    console.log('👥 All users:');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
    });

    const adminUsers = users.filter(u => u.role === 'admin');
    console.log(`\n👑 Admin users: ${adminUsers.length}`);
    adminUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.username} (${user.email}) - Active: ${user.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();