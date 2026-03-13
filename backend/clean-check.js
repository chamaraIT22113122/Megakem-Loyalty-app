const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Extract URI from .env manually to avoid dotenv clutter
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const uri = env.match(/MONGODB_URI=(.*)/)[1].trim();

const run = async () => {
  try {
    await mongoose.connect(uri);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('--- USER LIST ---');
    users.forEach(u => {
      console.log(`${u.email} [${u.role}] (Active: ${u.isActive})`);
    });
    console.log('-----------------');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
