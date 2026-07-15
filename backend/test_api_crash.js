require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch(e) {}
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Member = require('./models/Member');
  const Scan = require('./models/Scan');
  const LoyaltyConfig = require('./models/LoyaltyConfig');
  const Product = require('./models/Product');
  try {
    const year=2026, month=7, role='applicator';
    const query = { role };
    const members = await Member.find(query);
    const config = await LoyaltyConfig.getConfig();
    const pointsConfig = config.pointsCalculation || { method: 'price_based', priceDivisor: 1000, applicatorBonus: 0.1 };
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    
    const scans = await Scan.find({
      role,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const purchaseMap = {};
    const pointsMap = {};
    for (const m of members) {
      purchaseMap[m.memberId] = 0;
      pointsMap[m.memberId] = 0;
    }

    for (const scan of scans) {
      const mId = scan.memberId;
      if (purchaseMap[mId] !== undefined) {
        purchaseMap[mId] += (scan.price || 0);
        let scanPoints = scan.pointsEarned !== undefined ? scan.pointsEarned : (scan.points || 0);
        if (scanPoints === 0 && (scan.price > 0 || scan.qty)) {
          const p = await Product.findOne({ productNo: scan.productNo ? scan.productNo.toUpperCase() : null });
          scanPoints = p && p.pointsPerProduct != null ? p.pointsPerProduct : 0;
        }
        pointsMap[mId] += scanPoints;
      }
    }

    for (const member of members) {
      const pValue = purchaseMap[member.memberId] || 0;
      const pEarned = pointsMap[member.memberId] || 0;
      
      member.setMonthlyPurchase(pValue, pEarned, parseInt(year), parseInt(month));
      const cashReward = member.calculateCashReward(parseInt(year), parseInt(month), config.cashRewardTiers);
      member.calculateAnnualPointsAndTier(config.annualTiers);
      await member.save();
    }
    console.log('SUCCESS');
  } catch(e) {
    console.error('ERROR:', e.message, e.stack);
  } finally {
    mongoose.disconnect();
  }
}).catch(e => console.error('DB ERROR:', e.message));
