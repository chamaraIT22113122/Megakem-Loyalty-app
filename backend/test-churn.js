require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Member = require('./models/Member');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const members = await Member.find({ role: 'applicator' });
  console.log('Total applicators:', members.length);
  
  const atRisk = await Member.find({
    role: 'applicator',
    totalScans: { $gte: 5 },
    $or: [
      { lastScanDate: { $lt: thirtyDaysAgo } },
      { lastScanDate: null }
    ]
  });
  console.log('At risk:', atRisk.length);
  
  const fiveScans = await Member.find({ role: 'applicator', totalScans: { $gte: 5 } });
  console.log('Total with >= 5 scans:', fiveScans.length);
  if(fiveScans.length > 0) {
    console.log('Sample 5+ scans lastScanDate:', fiveScans[0].lastScanDate);
  }
  
  process.exit(0);
}).catch(console.error);
