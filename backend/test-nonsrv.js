const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Construct non-srv URI
const nonSrvUri = "mongodb://bitumixlive_db_user:Megakem%40123@ac-uru8az9-shard-00-00.w6gayib.mongodb.net:27017,ac-uru8az9-shard-00-01.w6gayib.mongodb.net:27017,ac-uru8az9-shard-00-02.w6gayib.mongodb.net:27017/megakem-loyalty?ssl=true&replicaSet=atlas-uru8az9-shard-0&authSource=admin&retryWrites=true&w=majority";

const test = async () => {
  try {
    console.log('Testing non-SRV connection string...');
    await mongoose.connect(nonSrvUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Success with non-SRV string!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

test();
