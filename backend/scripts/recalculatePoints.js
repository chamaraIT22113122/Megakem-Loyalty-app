const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const Product = require('../models/Product');
require('dotenv').config();

const recalculatePoints = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Find all scans with 0 points
    const scansToUpdate = await Scan.find({ 
      $or: [
        { points: 0 },
        { points: null },
        { points: { $exists: false } }
      ]
    }).sort({ timestamp: -1 });

    console.log(`\n📊 Found ${scansToUpdate.length} scans with 0 or missing points`);

    if (scansToUpdate.length === 0) {
      console.log('✅ No updates needed!');
      process.exit(0);
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const scan of scansToUpdate) {
      try {
        let productPoints = 0;
        
        // Try to find the product
        const product = await Product.findOne({ productNo: scan.productNo });
        
        if (product) {
          // Check if product has pack-size specific points
          if (product.pointsPerPackSize && product.pointsPerPackSize.length > 0 && scan.qty) {
            const packPoints = product.pointsPerPackSize.find(ps => 
              ps.packSize.toUpperCase() === scan.qty.toUpperCase()
            );
            if (packPoints) {
              productPoints = packPoints.points || 0;
            }
          }
          
          // If no pack-size points, check for fixed points per product
          if (productPoints === 0 && product.pointsPerProduct !== null && product.pointsPerProduct !== undefined) {
            productPoints = product.pointsPerProduct;
          }
          
          // If no fixed points, use price-based calculation (1 point per 1000 Rs)
          if (productPoints === 0 && scan.price > 0) {
            productPoints = Math.floor(scan.price / 1000);
          }
          
          // Update the scan
          scan.points = productPoints;
          await scan.save();
          updatedCount++;
          
          if (updatedCount % 100 === 0) {
            console.log(`   Processed ${updatedCount} scans...`);
          }
        } else {
          // Product not found, try price-based calculation
          if (scan.price > 0) {
            productPoints = Math.floor(scan.price / 1000);
            scan.points = productPoints;
            await scan.save();
            updatedCount++;
          } else {
            skippedCount++;
          }
        }
      } catch (err) {
        console.error(`Error updating scan ${scan._id}:`, err.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} scan records!`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} scans (no product data or price)`);
    }
    console.log('   Points have been recalculated based on product configuration.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

recalculatePoints();
