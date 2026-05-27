const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const checkInfo = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');
    console.log('Host:', conn.connection.host);
    const admin = conn.connection.db.admin();
    const status = await admin.serverStatus();
    console.log('ReplicaSet:', status.repl.set);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkInfo();
