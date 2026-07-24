require('dotenv').config();
const mongoose = require('mongoose');
const { performAutoBackup } = require('../utils/scheduler');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB. Running auto backup...');
    await performAutoBackup();
    console.log('Auto backup finished. Check Google Drive!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
