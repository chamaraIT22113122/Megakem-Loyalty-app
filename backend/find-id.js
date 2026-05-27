const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const run = async () => {
  await connectDB();
  const id = '69b3aa8fc3987621c896f801';
  const user = await User.findById(id);
  const allUsers = await User.find({});
  
  let out = `USER BY ID ${id}: ${user ? JSON.stringify(user) : 'NOT FOUND'}\n`;
  out += `TOTAL USERS: ${allUsers.length}\n`;
  allUsers.forEach(u => {
    out += `${u.username} | ${u._id}\n`;
  });
  
  fs.writeFileSync('id-check.txt', out);
  process.exit(0);
};

run();
