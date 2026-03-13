const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megakem_loyalty');
    console.log('Connected to DB');
    
    const user = await User.findOne({ username: 'qr_final' });
    if (user) {
      console.log('User found:', user.username);
      console.log('Role:', user.role);
      console.log('Permissions:', JSON.stringify(user.permissions, null, 2));
    } else {
      console.log('User not found');
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkUser();
