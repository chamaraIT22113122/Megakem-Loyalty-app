const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const run = async () => {
  await connectDB();
  const users = await User.find({});
  let out = '';
  users.forEach(u => {
    out += `ID: ${u._id} | User: ${u.username} | Permissions: ${JSON.stringify(u.permissions)}\n`;
  });
  fs.writeFileSync('user-list.txt', out);
  console.log('Saved to user-list.txt');
  process.exit(0);
};

run();
