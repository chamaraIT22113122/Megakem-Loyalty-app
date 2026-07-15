const Product = require('../models/Product');

const seedPoints = async () => {
  try {
    const pointsData = [
      {
        name: /^Megaproof Hi-Build$/i,
        pointsPerPackSize: [
          { packSize: '1 kg', points: 50 },
          { packSize: '4 kg', points: 200 },
          { packSize: '10 kg', points: 450 },
          { packSize: '20 kg', points: 1000 }
        ]
      },
      {
        name: /^Megaproof Hi-Build Grey$/i,
        pointsPerPackSize: [
          { packSize: '1 kg', points: 50 },
          { packSize: '4 kg', points: 200 },
          { packSize: '10 kg', points: 450 },
          { packSize: '20 kg', points: 1000 }
        ]
      },
      {
        name: /^Megakem Ecolastic$/i,
        pointsPerPackSize: [
          { packSize: '3.6 kg', points: 200 },
          { packSize: '7.2 kg', points: 300 },
          { packSize: '32 kg', points: 750 }
        ]
      },
      {
        name: /^Megalastic Super 540$/i,
        pointsPerPackSize: [
          { packSize: '7.2 kg', points: 500 },
          { packSize: '36 kg', points: 1500 }
        ]
      }
    ];

    let updatedCount = 0;

    // Debug: print all products
    const allProducts = await Product.find({}, 'name productNo');
    console.log('--- ALL PRODUCTS IN DB ---');
    allProducts.forEach(p => console.log(`${p.productNo}: ${p.name}`));
    console.log('--------------------------');

    for (const item of pointsData) {
      const products = await Product.find({ name: item.name });
      console.log(`Found ${products.length} products matching ${item.name}`);
      
      for (const product of products) {
        product.pointsPerPackSize = [];
        
        for (const pack of item.pointsPerPackSize) {
          product.pointsPerPackSize.push({
            packSize: pack.packSize,
            points: pack.points
          });
        }
        
        product.isLoyaltyEnabled = true;
        
        await product.save();
        console.log(`Updated points for ${product.name} (${product.productNo})`);
        updatedCount++;
      }
    }

    console.log(`Seeding complete! Updated ${updatedCount} products.`);
  } catch (error) {
    console.error('Error seeding points:', error);
  }
};

module.exports = seedPoints;
