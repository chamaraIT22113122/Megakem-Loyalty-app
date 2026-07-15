const connectDB = require('./config/database');
const Scan = require('./models/Scan');
require('dotenv').config();

connectDB().then(async () => {
  try {
    const scans = await Scan.find({ memberId: 'MA4502' });
    console.log('Scans for MA4502:', scans);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
});
