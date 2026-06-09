const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const User = require('./models/User');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const testPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    
    // Find the production user
    const user = await User.findOne({ email: 'production@megakem.com' });
    if (!user) {
      console.log('❌ User production@megakem.com not found');
      process.exit(1);
    }
    
    console.log('👤 Found user:', user.username, 'Role:', user.role);
    
    // Reset password using the standard Mongoose save flow
    user.password = 'Admin@123';
    await user.save();
    console.log('✅ Password reset to "Admin@123" and saved.');
    
    // Re-fetch and test comparison
    const updatedUser = await User.findOne({ email: 'production@megakem.com' }).select('+password');
    const isMatch = await updatedUser.comparePassword('Admin@123');
    console.log('🔐 Verification comparison check:', isMatch ? 'SUCCESS' : 'FAILED');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

testPassword();
