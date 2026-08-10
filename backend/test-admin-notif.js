require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const AdminNotification = require('./models/AdminNotification');
    const count = await AdminNotification.countDocuments();
    console.log('✅ AdminNotification model works. Count:', count);
    console.log('Schema fields:', Object.keys(AdminNotification.schema.paths));
  } catch(e) {
    console.error('❌ AdminNotification model error:', e.message);
  }
  process.exit(0);
}).catch(e => {
  console.error('DB Error:', e.message);
  process.exit(1);
});
