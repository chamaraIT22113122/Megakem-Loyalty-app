const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const QRCodeModel = require('./models/QRCode');
  
  const docs = await QRCodeModel.find({ batchNo: 'MKL3 002 300726 012' });
  console.log('Docs found:', docs.length);
  docs.forEach(d => console.log(`- ID: ${d._id}, status: ${d.status}, createdAt: ${d.createdAt}`));
  
  process.exit(0);
}
run();
