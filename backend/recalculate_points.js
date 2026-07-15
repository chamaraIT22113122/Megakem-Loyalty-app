require('dotenv').config();
const mongoose = require('mongoose');
const Scan = require('./models/Scan');
const Member = require('./models/Member');
const LoyaltyConfig = require('./models/LoyaltyConfig');

async function recalculate() {
  try {
    console.log('Connecting to MongoDB...');
    const dns = require('dns');
    try {
      dns.setDefaultResultOrder('ipv4first');
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch(e) {}
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loyalty', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4
    });
    console.log('Connected.');

    const config = await LoyaltyConfig.getConfig();
    const thresholds = config.tierThresholds || { bronze: 0, silver: 5000, gold: 15000, platinum: 30000 };

    const Product = require('./models/Product');
    const products = await Product.find({});
    const productMap = {};
    for (const p of products) {
      if (p.productNo) productMap[p.productNo.toUpperCase()] = p;
    }

    console.log('1. Updating all Scans...');
    const scans = await Scan.find();
    let updatedScans = 0;
    for (const scan of scans) {
      let scanPoints = 0;
      if (scan.productNo) {
        const p = await Product.findOne({ productNo: scan.productNo.toUpperCase() });
        scanPoints = p && p.pointsPerProduct != null ? p.pointsPerProduct : 0;
      }

      if (scan.points !== scanPoints || scan.pointsEarned !== scanPoints) {
        scan.points = scanPoints;
        scan.pointsEarned = scanPoints;
        await scan.save();
        updatedScans++;
      }
    }
    console.log(`Updated ${updatedScans} out of ${scans.length} scans.`);

    console.log('2. Updating all Members...');
    const members = await Member.find();
    console.log(`2. Updating all Members (${members.length} found)...`);
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      console.log(`Processing member ${i+1}/${members.length}: ${member.memberId}`);
      const memberScans = await Scan.find({ memberId: member.memberId.toUpperCase() });
      console.log(`  Found ${memberScans.length} scans for ${member.memberId}`);
      
      let totalPoints = 0;
      
      if (member.monthlyPurchases) {
        member.monthlyPurchases.forEach(mp => {
          mp.pointsEarned = 0;
        });
      }

      for (const scan of memberScans) {
        totalPoints += (scan.points || 0);
        
        if (member.monthlyPurchases && scan.timestamp) {
          const date = new Date(scan.timestamp);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          
          const mp = member.monthlyPurchases.find(m => m.year === year && m.month === month);
          if (mp) {
            mp.pointsEarned += (scan.points || 0);
          }
        }
      }
      
      member.points = totalPoints;
      
      const config = await LoyaltyConfig.getConfig();
      
      if (member.monthlyPurchases) {
        member.monthlyPurchases.forEach(mp => {
           // force recalculate cashReward
           mp.rewardCalculated = false;
           member.calculateCashReward(mp.year, mp.month, config.cashRewardTiers);
        });
      }
      
      if (member.monthlyPurchases) {
        member.annualPoints = member.monthlyPurchases.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
      } else {
        member.annualPoints = totalPoints;
      }
      
      console.log(`  Updating tier...`);
      if (typeof member.updateTier === 'function') {
        member.updateTier(thresholds);
      }
      
      console.log(`  Calculating annual points and tier...`);
      if (config && config.annualTiers && config.annualTiers.length > 0 && typeof member.calculateAnnualPointsAndTier === 'function') {
        member.calculateAnnualPointsAndTier(config.annualTiers);
      }
      
      console.log(`  Saving member...`);
      await member.save();
      console.log(`  Saved.`);
    }
    
    console.log(`Recalculated points for ${members.length} members.`);
    console.log('Done.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

recalculate();
