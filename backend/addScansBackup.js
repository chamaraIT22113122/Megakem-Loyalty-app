const mongoose = require('mongoose');
const Scan = require('./models/Scan');
const dns = require('dns');
require('dotenv').config();

// DNS fix
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const backupScans = [
  {
    _id: "696f00e9fcb10af53160291a",
    memberName: "APP-123",
    memberId: "APP-123",
    phone: "",
    role: "applicator",
    productName: "Megakem Tile Grout 1Kg",
    productNo: "MKL40",
    batchNo: "MKL40 001 050525 001",
    bagNo: "001",
    qty: "1kg",
    price: 220,
    points: 0,
    location: "malabe",
    userId: "692202ab2820a1f2018eef9e",
    timestamp: "2026-01-20T04:13:29.605+00:00"
  },
  {
    _id: "696f243241d70577e4e5d85b",
    memberName: "APP-222",
    memberId: "APP-222",
    phone: "",
    role: "applicator",
    productName: "Ecolastic 7.2 Kg",
    productNo: "MKL47",
    batchNo: "MKL47 001 050525 001",
    bagNo: "001",
    qty: "7.2kg",
    price: 4750,
    points: 4,
    location: "Panagoda",
    timestamp: "2026-01-20T06:44:02.555+00:00"
  },
  {
    _id: "696f0172fcb10af531602ba2",
    memberName: "Nuwan",
    memberId: "CUS-0713381444",
    phone: "0713381444",
    role: "customer",
    productName: "Megalastic Super 540 7.2 Kg",
    productNo: "MKL6",
    batchNo: "MKL6 001 050525 001",
    bagNo: "001",
    qty: "7.2kg",
    price: 6017,
    points: 6,
    location: "Kandy",
    userId: "692202ab2820a1f2018eef9e",
    timestamp: "2026-01-20T04:15:46.069+00:00"
  }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    for (const scanData of backupScans) {
      const { _id, userId, ...data } = scanData;
      
      // Use raw collection to insert exactly as provided
      await mongoose.connection.collection('scans').updateOne(
        { _id: new mongoose.Types.ObjectId(_id) },
        { 
          $set: { 
            ...data, 
            userId: userId ? new mongoose.Types.ObjectId(userId) : null,
            timestamp: new Date(data.timestamp),
            updatedAt: new Date() 
          }, 
          $setOnInsert: { createdAt: new Date() } 
        },
        { upsert: true }
      );
      
      console.log(`✅ Added/Updated scan: ${scanData.productName} for ${scanData.memberName}`);
    }

    console.log('\n🚀 Done adding scans.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
