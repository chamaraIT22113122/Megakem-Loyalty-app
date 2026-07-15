require('dotenv').config();
const mongoose = require('mongoose');
const LoyaltyConfig = require('./models/LoyaltyConfig');
const fs = require('fs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const config = await LoyaltyConfig.getConfig();
    fs.writeFileSync('db_config.json', JSON.stringify(config.cashRewardTiers, null, 2));
  } catch (err) {
    fs.writeFileSync('db_config.json', JSON.stringify({ error: err.message }));
  } finally {
    mongoose.disconnect();
  }
}).catch(err => {
  fs.writeFileSync('db_config.json', JSON.stringify({ error: err.message }));
});
