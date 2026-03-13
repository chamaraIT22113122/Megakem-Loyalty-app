const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const uris = [
  process.env.MONGODB_URI,
  process.env.MONGODB_URI.split('?')[0], // Simplified
  "mongodb://bitumixlive_db_user:Megakem%40123@ac-uru8az9-shard-00-00.w6gayib.mongodb.net:27017,ac-uru8az9-shard-00-01.w6gayib.mongodb.net:27017,ac-uru8az9-shard-00-02.w6gayib.mongodb.net:27017/megakem-loyalty?ssl=true&replicaSet=atlas-uru8az9-shard-0&authSource=admin&retryWrites=true&w=majority"
];

const test = async (uri, label) => {
  console.log(`\n--- Testing ${label} ---`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Success with ${label}`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(`❌ Fail with ${label}: ${err.message}`);
    return false;
  }
};

const run = async () => {
  for (let i = 0; i < uris.length; i++) {
    await test(uris[i], `URI ${i+1}`);
  }
};

run();
