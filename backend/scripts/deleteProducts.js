const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const deleteProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Delete all products
    const result = await Product.deleteMany({});
    console.log(`\n🗑️  Deleted ${result.deletedCount} products`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

deleteProducts();
