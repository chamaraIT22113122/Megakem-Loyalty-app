const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const QRCodeModel = require('./models/QRCode');
  
  const docs = await QRCodeModel.find({ batchNo: { $regex: 'MKL3 002 300726' } });
  console.log('Total docs:', docs.length);
  const pkgNos = [...new Set(docs.map(d => parseInt(d.packageNo, 10)))].sort((a,b)=>a-b);
  console.log('Packages:', pkgNos);
  process.exit(0);
}
run();
