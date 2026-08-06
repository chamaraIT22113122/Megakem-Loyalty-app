require('dotenv').config({path: './backend/.env'});
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const QRCodeModel = require('./backend/models/QRCode');
  const rawSummary = await QRCodeModel.aggregate([
    {
      $group: {
        _id: '$batchNo',
        totalQRs: { $sum: 1 },
        printed: {
          $sum: { $cond: [{ $eq: ['$status', 'printed'] }, 1, 0] }
        },
        scanned: {
          $sum: { $cond: [{ $eq: ['$status', 'scanned'] }, 1, 0] }
        },
        generated: {
          $sum: { $cond: [{ $eq: ['$status', 'generated'] }, 1, 0] }
        }
      }
    }
  ]);
  
  const grouped = {};
  rawSummary.forEach(item => {
    const batchNo = item._id || '';
    let prefix = batchNo;
    let packageNo = '';
    const parts = batchNo.trim().split(/[_\s]+/);
    if (parts.length >= 4) {
      const delimiter = batchNo.includes('_') ? '_' : ' ';
      prefix = parts.slice(0, 3).join(delimiter);
      packageNo = parts.slice(3).join(delimiter);
    } else if (parts.length === 5) {
      prefix = parts.slice(0, 4).join(' ');
      packageNo = parts[4];
    }
    
    if (!grouped[prefix]) {
      grouped[prefix] = {
        _id: prefix,
        totalQRs: 0,
        printed: 0,
        scanned: 0,
        generated: 0,
        unprintedPackages: []
      };
    }
    
    if (item.generated > 0 && item.printed === 0 && item.scanned === 0) {
      if (packageNo) {
        grouped[prefix].unprintedPackages.push(packageNo);
      }
    }
    
    grouped[prefix].totalQRs += item.totalQRs;
    grouped[prefix].printed += item.printed;
    grouped[prefix].scanned += item.scanned;
    grouped[prefix].generated += item.generated;
  });
  
  console.log(Object.values(grouped).slice(0, 20));
  process.exit(0);
});
