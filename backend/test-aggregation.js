const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const QRCodeModel = require('./models/QRCode');
  
  const rawSummary = await QRCodeModel.aggregate([
    {
      $match: {
        status: { $ne: 'archived' }
      }
    },
    {
      $group: {
        _id: '$batchNo',
        totalQRs: { $sum: 1 },
        printed: { $sum: { $cond: [{ $eq: ['$status', 'printed'] }, 1, 0] } },
        scanned: { $sum: { $cond: [{ $eq: ['$status', 'scanned'] }, 1, 0] } },
        generated: { $sum: { $cond: [{ $eq: ['$status', 'generated'] }, 1, 0] } },
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
    
    if (prefix.includes('MKL3')) {
       console.log(`Processing: ${batchNo}, prefix: ${prefix}, package: ${packageNo}, generated: ${item.generated}, printed: ${item.printed}`);
    }

    if (!grouped[prefix]) {
      grouped[prefix] = { unprintedPackages: [] };
    }
    
    if (item.generated > 0 && item.printed === 0 && item.scanned === 0) {
      if (packageNo) {
        grouped[prefix].unprintedPackages.push(packageNo);
      }
    }
  });

  const target = Object.keys(grouped).find(k => k.includes('MKL3'));
  console.log('Unprinted for target:', grouped[target]?.unprintedPackages);
  process.exit(0);
}
run();
