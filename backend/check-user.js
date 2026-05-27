const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

const run = async () => {
  await connectDB();
  const user = await User.findOne({ username: 'qr_final' });
  console.log('--- USER DATA ---');
  console.log(JSON.stringify(user, null, 2));
  console.log('-----------------');
  process.exit(0);
};

run();
