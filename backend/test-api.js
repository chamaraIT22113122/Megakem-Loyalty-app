const connectDB = require('./config/database');
const mongoose = require('mongoose');
const Member = require('./models/Member');
const Scan = require('./models/Scan');
const LoyaltyConfig = require('./models/LoyaltyConfig');
require('dotenv').config();

connectDB().then(async () => {
  const req = { query: { year: 2024, month: 12, role: 'applicator' } };
  try {
    const { year, month, role = 'applicator' } = req.query;
    
    const query = { role };
    const members = await Member.find(query);

    const results = [];
    const config = await LoyaltyConfig.getConfig();

    if (year && month) {
      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      const startDate = new Date(yearInt, monthInt - 1, 1);
      const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59, 999);

      // Aggregation for all members at once
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

      const promises = members.map(async (member) => {
        if (!member.memberId) return;
        const purchaseValue = purchaseMap[member.memberId.toUpperCase()] || 0;
        
        member.setMonthlyPurchase(purchaseValue, yearInt, monthInt);
        const cashReward = member.calculateCashReward(yearInt, monthInt, config.cashRewardTiers);
        
        // Sanitize any existing NaN values in the array that were corrupted in previous runs
        if (member.monthlyPurchases) {
          member.monthlyPurchases.forEach(p => {
            if (isNaN(p.cashReward)) p.cashReward = 0;
            if (isNaN(p.totalPurchaseValue)) p.totalPurchaseValue = 0;
          });
        }
        
        await member.save();

        const purchase = member.monthlyPurchases.find(
          p => p.year === yearInt && p.month === monthInt
        );

        results.push({
          memberId: member.memberId,
          memberName: member.memberName,
          year: yearInt,
          month: monthInt,
          totalPurchaseValue: purchase ? purchase.totalPurchaseValue : 0,
          cashReward: cashReward,
          rewardCalculated: purchase ? purchase.rewardCalculated : false,
          rewardPaid: purchase ? purchase.rewardPaid : false,
          status: purchase ? purchase.status : 'CALCULATED'
        });
      });

      await Promise.all(promises);
    }
    console.log('Results length:', results.length);
  } catch (err) {
    console.error('API Error:', err);
  }
  process.exit(0);
});
