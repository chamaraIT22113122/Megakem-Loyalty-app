const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const fixProductIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Drop the old unique index on productNo
    try {
      await Product.collection.dropIndex('productNo_1');
      console.log('✅ Dropped old productNo unique index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Old index already removed or does not exist');
      } else {
        console.log('⚠️  Error dropping index:', error.message);
      }
    }

    // Create new compound unique index on productNo + category
    await Product.collection.createIndex(
      { productNo: 1, category: 1 }, 
      { unique: true, name: 'productNo_category_unique' }
    );
    console.log('✅ Created new compound unique index: productNo + category');

    console.log('\n✅ Index update complete!');
    console.log('   You can now create products with same code but different pack sizes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

fixProductIndexes();
