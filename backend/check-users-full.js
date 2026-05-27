const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const checkUsersFull = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('--- User Status Report ---');
    users.forEach(u => {
      console.log(`- Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

checkUsersFull();
