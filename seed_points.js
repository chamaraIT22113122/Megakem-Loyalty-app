const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const Product = require('./backend/models/Product');

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

    for (const item of pointsData) {
      const products = await Product.find({ name: item.name });
      console.log(`Found ${products.length} products matching ${item.name}`);
      
      for (const product of products) {
        // Update pointsPerPackSize, or add if missing
        // First clear existing
        product.pointsPerPackSize = [];
        
        for (const pack of item.pointsPerPackSize) {
          product.pointsPerPackSize.push({
            packSize: pack.packSize,
            points: pack.points
          });
        }
        
        // Also enable loyalty if it wasn't
        product.isLoyaltyEnabled = true;
        
        await product.save();
        console.log(`Updated points for ${product.name} (${product.productNo})`);
      }
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding points:', error);
    process.exit(1);
  }
};

seedPoints();
