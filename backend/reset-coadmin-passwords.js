const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const bcrypt = require('bcryptjs');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    const db = mongoose.connection.db;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    const result = await db.collection('users').updateMany(
      { role: 'co-admin' },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`✅ Successfully reset passwords for ${result.matchedCount} co-admin users to "Admin@123"`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting co-admin passwords:', err.message);
    process.exit(1);
  }
};

resetPasswords();
