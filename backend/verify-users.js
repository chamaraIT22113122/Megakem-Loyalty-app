const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const verifyUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}, { projection: { email: 1, username: 1 } }).toArray();
    
    console.log('--- Current Users in Database ---');
    users.forEach(u => {
      console.log(`- ${u.username || 'N/A'} (${u.email})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

verifyUsers();
