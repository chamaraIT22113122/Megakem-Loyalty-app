const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const RecycleBin = require('./models/RecycleBin');
  
  // Dummy data to insert
  const dummyItems = [
    {
      originalCollection: 'qrcodes',
      documentId: new mongoose.Types.ObjectId(),
      documentData: {
        batchNo: 'TEST BATCH 001',
        packageNo: '100',
        status: 'generated',
        dummyData: true
      },
      summary: 'QR Code: TEST BATCH 001 (Pkg 100)',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      deletedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // deleted 2 hours ago
    },
    {
      originalCollection: 'qrcodes',
      documentId: new mongoose.Types.ObjectId(),
      documentData: {
        batchNo: 'TEST BATCH 001',
        packageNo: '101',
        status: 'printed',
        dummyData: true
      },
      summary: 'QR Code: TEST BATCH 001 (Pkg 101)',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deletedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // deleted 5 hours ago
    },
    {
      originalCollection: 'products',
      documentId: new mongoose.Types.ObjectId(),
      documentData: {
        name: 'Test Product XYZ',
        productNo: 'TP-XYZ',
        dummyData: true
      },
      summary: 'Product: Test Product XYZ',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deletedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // deleted 1 day ago
    },
    {
      originalCollection: 'members',
      documentId: new mongoose.Types.ObjectId(),
      documentData: {
        name: 'John Doe',
        phone: '0712345678',
        dummyData: true
      },
      summary: 'Member: John Doe (0712345678)',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // deleted 2 days ago
    }
  ];

  await RecycleBin.insertMany(dummyItems);
  
  console.log(`Inserted ${dummyItems.length} dummy items into the Recycle Bin.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
