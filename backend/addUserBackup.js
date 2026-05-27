const mongoose = require('mongoose');
const User = require('./models/User');
const dns = require('dns');
require('dotenv').config();

// DNS fix
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const backupUsers = [
  {
    _id: "692202ab2820a1f2018eef9e",
    username: "admin",
    email: "admin@megakem.com",
    password: "$2b$10$iIk0i4vhok7HwtDJaeyJ2OZot9hgA9e1gz2MGbHDbo6N14ZbX52Yu",
    role: "admin",
    isActive: true,
    totalScans: 28,
    points: 240,
    tier: "bronze"
  },
  {
    _id: "693f0f7f45b9100047bb47c6",
    username: "co admin",
    email: "coadmin@megakem.com",
    password: "$2b$10$8ahXgwdzxFhWmEDXVll/reIs6nCTeE4eFQHMa0fs/AKMAwPsjj25O",
    role: "co-admin",
    isActive: true,
    points: 0,
    tier: "bronze",
    totalScans: 0
  },
  {
    _id: "6940da13675e65fa8c1ee507",
    username: "coadmin2",
    email: "coadmin2@megakem.com",
    password: "$2b$10$R7Zqy7SBT//E9Bghz6wpb.g12ssog2abt7Xb/rToAqjxhKrWqWT.S",
    role: "co-admin",
    isActive: true,
    points: 0,
    tier: "bronze",
    totalScans: 0
  }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    for (const userData of backupUsers) {
      const { _id, ...updateData } = userData;
      
      // Delete existing user with same email or username to avoid duplicate key errors
      await mongoose.connection.collection('users').deleteMany({
        $or: [{ email: userData.email }, { username: userData.username }]
      });
      
      // Use raw collection to insert hashed password directly and bypass pre-save middleware
      await mongoose.connection.collection('users').insertOne({
        _id: new mongoose.Types.ObjectId(_id),
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Added user: ${userData.username} (${userData.email}) with ID: ${_id}`);
    }

    // Since the user just asked to change admin password to Admin@123, 
    // and the backup hash might be different, I'll reset it again to be sure.
    const admin = await User.findOne({ email: 'admin@megakem.com' });
    if (admin) {
      admin.password = 'Admin@123';
      await admin.save();
      console.log('🔄 Re-applied Admin@123 password to the admin account.');
    }

    console.log('\n🚀 Done adding users.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
