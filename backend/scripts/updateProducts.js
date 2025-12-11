const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const updateProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Get all existing products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products\n`);

    if (products.length === 0) {
      console.log('No products to update.');
      process.exit(0);
    }

    // Display current products and update them
    for (const product of products) {
      console.log(`Current Product:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  Product No: ${product.productNo}`);
      
      // Check if productNo needs to be extracted from name or updated
      let updatedName = product.name;
      let updatedProductNo = product.productNo;

      // If productNo is empty or looks like a full name, try to extract code
      if (!product.productNo || product.productNo.length > 10) {
        // Try to extract product code from name (usually first word or acronym)
        const words = product.name.split(' ');
        if (words.length > 1) {
          // Create acronym from first letters
          updatedProductNo = words
            .filter(w => w.length > 2) // Skip short words like "the", "of"
            .map(w => w[0])
            .join('')
            .toUpperCase();
        } else {
          updatedProductNo = product.name.substring(0, 4).toUpperCase();
        }
        console.log(`  → Generated Product Code: ${updatedProductNo}`);
      }

      // Update the product
      await Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            productNo: updatedProductNo
          } 
        }
      );
      
      console.log(`  ✅ Updated successfully\n`);
    }

    console.log('✨ All products updated successfully!');
    console.log('\nUpdated Products:');
    
    const updatedProducts = await Product.find({});
    updatedProducts.forEach(p => {
      console.log(`  • ${p.name} [${p.productNo}]`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

updateProducts();
