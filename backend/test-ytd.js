const connectDB = require('./config/database');
const mongoose = require('mongoose');
const Member = require('./models/Member');
require('dotenv').config();

connectDB().then(async () => {
  try {
    const year = 2024;
    const analytics = await Member.aggregate([
      { $unwind: '$monthlyPurchases' },
      { $match: { 'monthlyPurchases.year': year } },
      { $group: { 
          _id: '$monthlyPurchases.month', 
          totalRewards: { $sum: '$monthlyPurchases.cashReward' } 
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedData = months.map((m, index) => {
      const match = analytics.find(a => a._id === (index + 1));
      return {
        month: m,
        liability: match ? match.totalRewards : 0
      };
    });
    console.log('Formatted Data Length:', formattedData.length);
    console.log(formattedData);
  } catch (err) {
    console.error('API Error:', err);
  }
  process.exit(0);
});
