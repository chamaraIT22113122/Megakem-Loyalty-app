const connectDB = require('./config/database');
const Member = require('./models/Member');
require('dotenv').config();

connectDB().then(async () => {
  const year = 2024;
  try {
    const analytics = await Member.aggregate([
      { $unwind: '$monthlyPurchases' },
      { $match: { 'monthlyPurchases.year': year } },
      { $group: { 
          _id: '$monthlyPurchases.month', 
          totalRewards: { $sum: '$monthlyPurchases.cashReward' } 
      }},
      { $sort: { _id: 1 } }
    ]);
    console.log('Analytics:', analytics);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
});
