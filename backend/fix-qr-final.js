const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAndFixUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megakem_loyalty');
    console.log('Connected to DB');
    
    const user = await User.findOne({ username: 'qr_final' });
    if (user) {
      console.log('User found:', user.username);
      console.log('Before update:', JSON.stringify(user.permissions, null, 2));
      
      user.permissions = {
        canViewDashboard: true,
        canDelete: false,
        canExport: false,
        canManageUsers: false,
        canManageProducts: false,
        canManageQRCodes: true,
        canPrintQRCodes: true,
        canViewQRAnalytics: true
      };
      
      await user.save();
      console.log('After update:', JSON.stringify(user.permissions, null, 2));
    } else {
      console.log('User not found');
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkAndFixUser();
