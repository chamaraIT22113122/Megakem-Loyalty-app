const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

mongoose.connect(process.env.MONGODB_URI, {
}).then(async () => {
  const Member = require('./models/Member');
  
  const analytics = await Member.aggregate([
    { $unwind: "$monthlyPurchases" },
    { $match: { "monthlyPurchases.year": 2026 } },
    { $group: { 
        _id: "$monthlyPurchases.month", 
        totalRewards: { $sum: "$monthlyPurchases.cashReward" } 
    }},
    { $sort: { _id: 1 } }
  ]);
  
  console.log(JSON.stringify(analytics, null, 2));
  process.exit(0);
}).catch(console.error);
