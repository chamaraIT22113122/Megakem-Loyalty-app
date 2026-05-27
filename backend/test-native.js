const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;

const run = async () => {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  try {
    console.log('Attempting to connect with native MongoDB driver...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    const db = client.db('megakem-loyalty');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ MongoDB Driver Error:');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    if (err.reason) console.error('Reason:', JSON.stringify(err.reason, null, 2));
    if (err.code) console.error('Code:', err.code);
  } finally {
    await client.close();
  }
};

run();
