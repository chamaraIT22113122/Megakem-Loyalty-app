require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Scan = require('./models/Scan');
  
  const total = await Scan.countDocuments();
  console.log('Total scans:', total);
  
  if (total > 0) {
    const sample = await Scan.findOne();
    console.log('Sample scan fields:', Object.keys(sample.toObject()));
    console.log('Sample productName:', sample.productName);
    console.log('Sample productNo:', sample.productNo);
  }
  
  const topProducts = await Scan.aggregate([
    { $group: { _id: '$productName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  console.log('Top products:', JSON.stringify(topProducts, null, 2));
  
  process.exit(0);
}).catch(console.error);
