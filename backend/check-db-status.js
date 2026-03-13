const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8']);
dotenv.config({ path: path.join(__dirname, '.env') });

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    console.log('--- Database Status ---');
    console.log('Database Name:', mongoose.connection.name);
    
    if (collections.length === 0) {
      console.log('Status: EMPTY (0 collections)');
    } else {
      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`Collection: ${coll.name} | Documents: ${count}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkData();
