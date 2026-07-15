const express = require('express');
const Member = require('./models/Member');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.get('/test', async (req, res) => {
    try {
      const year = 2026;
      const analytics = await Member.aggregate([
        { $unwind: "$monthlyPurchases" },
        { $match: { "monthlyPurchases.year": year } },
        { $group: { 
            _id: "$monthlyPurchases.month", 
            totalRewards: { $sum: "$monthlyPurchases.cashReward" } 
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
      res.json(formattedData);
    } catch(err) {
      res.status(500).json({ error: String(err.stack) });
    }
  });

  app.listen(5001, () => {
    console.log('Listening on 5001');
    const http = require('http');
    http.get('http://localhost:5001/test', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log('YTD:', data));
    });
  });
});
