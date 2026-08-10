const mongoose = require('mongoose');
const QRCodeModel = require('../backend/models/QRCode');
require('dotenv').config({path: '../backend/.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const printLogs = await QRCodeModel.aggregate([
    { $match: { status: 'printed' } },
    {
      $group: {
        _id: { batchNo: '$batchNo', printedDate: '$printedDate' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.printedDate': -1 } },
    { $limit: 10 }
  ]);
  console.log(JSON.stringify(printLogs, null, 2));
  process.exit(0);
});
