const connectDB = require('./config/database');
const Scan = require('./models/Scan');

const run = async () => {
  await connectDB();
  
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  
  const todayScans = await Scan.countDocuments({ timestamp: { $gte: startOfDay } });
  const allScans = await Scan.countDocuments({});
  
  console.log('Today Scans:', todayScans);
  console.log('Total Scans:', allScans);
  process.exit(0);
};

run().catch(console.error);
