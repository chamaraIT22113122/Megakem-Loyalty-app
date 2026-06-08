const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// DNS fix
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config();

const QRCodeSchema = new mongoose.Schema({}, { strict: false });
const QRCodeModel = mongoose.model('QRCode', QRCodeSchema, 'qrcodes');

async function checkQRs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const qrCodes = await QRCodeModel.find({ productName: /Ecolastic/ }).sort({ createdAt: -1 }).limit(10);
    console.log('Last 10 generated Ecolastic QR codes:');
    qrCodes.forEach(q => {
      console.log({
        productNo: q.get('productNo'),
        productName: q.get('productName'),
        batchNo: q.get('batchNo'),
        packageNo: q.get('packageNo'),
        qrLink: q.get('qrLink'),
        status: q.get('status')
      });
    });
    
    const uniqueBatches = await QRCodeModel.distinct('batchNo');
    console.log('Unique Batch Numbers in DB:', uniqueBatches);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkQRs();
