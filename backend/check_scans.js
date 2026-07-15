const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Scan = require('./models/Scan');
  const scans = await Scan.find({ memberId: 'MA4502' });
  console.log(JSON.stringify(scans, null, 2));
  process.exit(0);
}).catch(console.error);
