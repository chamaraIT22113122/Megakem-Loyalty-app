const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8']);

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const uriMatch = env.match(/MONGODB_URI=(.*)/);
const uri = uriMatch[1].trim();

const run = async () => {
  try {
    await mongoose.connect(uri, { family: 4 });
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('--- USER LIST ---');
    users.forEach(u => {
      console.log(`Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
    });
    console.log('-----------------');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
