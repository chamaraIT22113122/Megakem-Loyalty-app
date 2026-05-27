const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const bcrypt = require('bcryptjs');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    const db = mongoose.connection.db;
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@megakem.com';
    const user = await db.collection('users').findOne({ email: adminEmail });
    
    if (!user) {
      console.log(`❌ Admin user ${adminEmail} not found in database.`);
    } else {
      console.log(`✅ Admin user found: ${user.email}`);
      console.log(`Role: ${user.role}`);
      
      const pwdToTest = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';
      const isMatch = await bcrypt.compare(pwdToTest, user.password);
      console.log(`Password "${pwdToTest}" matches: ${isMatch}`);
      
      if (!isMatch) {
         console.log('💡 Updating password to match .env...');
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(pwdToTest, salt);
         await db.collection('users').updateOne(
           { _id: user._id },
           { $set: { password: hashedPassword } }
         );
         console.log('✅ Password updated successfully!');
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkAdmin();
