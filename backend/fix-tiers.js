const mongoose = require('mongoose');
const Member = require('./models/Member');
const LoyaltyConfig = require('./models/LoyaltyConfig');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const config = await LoyaltyConfig.getConfig();
    const members = await Member.find({});
    let updated = 0;
    
    console.log(`Current thresholds: ${JSON.stringify(config.tierThresholds)}`);
    
    for (const m of members) {
      const oldTier = m.tier;
      m.updateTier(config.tierThresholds);
      
      if (oldTier !== m.tier) {
        console.log(`Member ${m.memberId}: ${oldTier} -> ${m.tier}`);
      }
      
      await m.save();
      updated++;
    }
    
    console.log(`Successfully synced ${updated} members`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}).catch(console.error);
