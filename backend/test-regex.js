require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('./models/QRCode');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const res = await QRCode.find({ batchNo: { $regex: 'MKL39 002 050826', $options: 'i' } }).limit(1);
  console.log(res);
  process.exit(0);
}).catch(console.error);
