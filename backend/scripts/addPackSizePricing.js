const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const addPackSizePricing = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Example: Add pack size pricing to products
    // Adjust these based on your actual products
    
    // Update MLSP (Megakem Liquid Sealer Plus)
    await Product.findOneAndUpdate(
      { productNo: 'MLSP' },
      {
        $set: {
          packSizePricing: [
            { packSize: '1kg', price: 500 },
            { packSize: '5kg', price: 2200 },
            { packSize: '10kg', price: 4000 },
            { packSize: '25kg', price: 9500 }
          ]
        }
      }
    );
    console.log('✅ Updated MLSP with pack size pricing');

    // Update WP100 (Waterproof 100)
    await Product.findOneAndUpdate(
      { productNo: 'WP100' },
      {
        $set: {
          packSizePricing: [
            { packSize: '1kg', price: 600 },
            { packSize: '5kg', price: 2700 },
            { packSize: '10kg', price: 5000 },
            { packSize: '20kg', price: 9200 }
          ]
        }
      }
    );
    console.log('✅ Updated WP100 with pack size pricing');

    // Update CH (Concrete Hardener)
    await Product.findOneAndUpdate(
      { productNo: 'CH' },
      {
        $set: {
          packSizePricing: [
            { packSize: '1kg', price: 400 },
            { packSize: '5kg', price: 1800 },
            { packSize: '10kg', price: 3300 },
            { packSize: '25kg', price: 7800 }
          ]
        }
      }
    );
    console.log('✅ Updated CH with pack size pricing');

    console.log('\n✅ Pack size pricing added successfully!');
    console.log('\nNow the system will automatically:');
    console.log('  • Extract pack size from batch number (e.g., 001 → 1kg, 010 → 10kg)');
    console.log('  • Match product code and pack size to get the correct price');
    console.log('  • Display price in cart and scan history');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

addPackSizePricing();
