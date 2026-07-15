const connectDB = require('./config/database');
const Member = require('./models/Member');
require('dotenv').config();

connectDB().then(async () => {
  const year = 2024;
  const month = 12;
  try {
    const members = await Member.find({
      'monthlyPurchases': { 
        $elemMatch: { year, month } 
      }
    });
    console.log('Members count:', members.length);
    for (let m of members) {
      const purchase = m.monthlyPurchases.find(p => p.year === year && p.month === month);
      console.log('Member:', m.memberId, 'Purchase:', purchase);
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
});
