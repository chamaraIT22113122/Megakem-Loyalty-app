const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Check if products already exist
    const existingProducts = await Product.find({});
    if (existingProducts.length > 0) {
      console.log('\n⚠️  Products already exist:');
      existingProducts.forEach(p => {
        console.log(`   • ${p.name} [${p.productNo}]`);
      });
      console.log('\nSkipping seed. Delete existing products first if you want to re-seed.');
      process.exit(0);
    }

    // Create sample products
    const products = [
      {
        name: 'Megakem Liquid Sealer Plus',
        productNo: 'MLSP',
        description: 'Premium liquid sealer for construction',
        category: 'Sealers',
        price: 2500
      },
      {
        name: 'Waterproof 100',
        productNo: 'WP100',
        description: 'Advanced waterproofing solution',
        category: 'Waterproofing',
        price: 3000
      },
      {
        name: 'Concrete Hardener',
        productNo: 'CH',
        description: 'High-strength concrete hardener',
        category: 'Hardeners',
        price: 1800
      }
    ];

    await Product.insertMany(products);

    console.log('\n✅ Sample products created successfully!\n');
    console.log('Products:');
    products.forEach(p => {
      console.log(`  • ${p.name} [${p.productNo}] - Rs. ${p.price.toLocaleString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedProducts();
