const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const Scan = require('./models/Scan');
const Product = require('./models/Product');
const LoyaltyConfig = require('./models/LoyaltyConfig');

async function test() {
  try {
    console.log('Connecting to', process.env.MONGODB_URI || process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    
    const config = await LoyaltyConfig.getConfig();
    const pointsConfig = config.pointsCalculation || {};
    console.log('Config Method:', pointsConfig.method);
    console.log('Applicator Bonus:', pointsConfig.applicatorBonus);
    
    const scan = await Scan.findOne({ memberId: 'MA4502' }).sort({ timestamp: -1 });
    if (!scan) {
      console.log('Scan not found');
      return;
    }
    
    console.log('Scan:', { productNo: scan.productNo, qty: scan.qty, price: scan.price, points: scan.points, pointsEarned: scan.pointsEarned });
    
    const product = await Product.findOne({ productNo: scan.productNo ? scan.productNo.toUpperCase() : null });
    if (!product) {
      console.log('Product not found for productNo:', scan.productNo);
    } else {
      console.log('Product:', { productNo: product.productNo, pointsPerProduct: product.pointsPerProduct, pointsPerPackSize: product.pointsPerPackSize });
      let basePoints = 0;
      if (product.pointsPerPackSize && product.pointsPerPackSize.length > 0 && scan.qty) {
        const packSizePoints = product.pointsPerPackSize.find(p => p.packSize.toUpperCase() === scan.qty.toUpperCase());
        if (packSizePoints) {
          basePoints = packSizePoints.points || 0;
        }
      }
      if (basePoints === 0 && product.pointsPerProduct != null) {
        basePoints = product.pointsPerProduct;
      }
      console.log('Base Points Calculated:', basePoints);
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

test();
