require('dotenv').config();
const mongoose = require('mongoose');
const Member = require('./models/Member');
const Scan = require('./models/Scan');
const LoyaltyConfig = require('./models/LoyaltyConfig');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const role = 'applicator';
    const year = 2026;
    const month = 7;
    const members = await Member.find({ role });
    const config = await LoyaltyConfig.getConfig();
    
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);

    const memberIds = members.filter(m => m.memberId).map(m => m.memberId.toUpperCase());
    const aggregatedScans = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          memberId: { $in: memberIds }
        }
      },
      {
        $group: {
          _id: "$memberId",
          totalPurchase: { $sum: "$price" }
        }
      }
    ]);

    const purchaseMap = {};
    aggregatedScans.forEach(item => {
      purchaseMap[item._id] = item.totalPurchase || 0;
    });

    const results = [];
    const promises = members.map(async (member) => {
      if (!member.memberId) return;
      const purchaseValue = purchaseMap[member.memberId.toUpperCase()] || 0;
      
      member.setMonthlyPurchase(purchaseValue, yearInt, monthInt);
      const cashReward = member.calculateCashReward(yearInt, monthInt, config.cashRewardTiers);
      await member.save();

      const purchase = member.monthlyPurchases.find(
        p => p.year === yearInt && p.month === monthInt
      );

      results.push({
        memberId: member.memberId,
        cashReward
      });
    });

    await Promise.all(promises);
    console.log('SUCCESS, processed members:', results.length);
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => console.error('DB_ERROR:', err));
