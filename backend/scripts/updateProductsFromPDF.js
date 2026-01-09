const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

// Products from the PDF document
const productsFromPDF = [
  { productNo: 'MKL39', name: 'Ecolastic 32 Kg Set', basePrice: 18000 },
  { productNo: 'MKL51', name: 'Megaproof (Inhouse) 20 kg', basePrice: 19068 },
  { productNo: 'MKL3', name: 'Megalastic Super 540 36 Kg Set', basePrice: 24153 },
  { productNo: 'MKL47', name: 'Ecolastic 7.2 Kg Set', basePrice: 4750 },
  { productNo: 'MKL50', name: 'Megaproof (Inhouse) 10 kg', basePrice: 10169 },
  { productNo: 'MKL49', name: 'Megaproof (Inhouse) 4 kg', basePrice: 4322 },
  { productNo: 'MKL46', name: 'Ecolastic 3.6 Kg Set', basePrice: 2750 },
  { productNo: 'MKL7', name: 'Megabond Ultra Tile Adhesive 25Kg', basePrice: 2373 },
  { productNo: 'MKL12', name: 'Megatitanium - White 20Kg', basePrice: 10750 },
  { productNo: 'MKL10', name: 'MEGATITANIUM - GREY 20KG', basePrice: 7203 },
  { productNo: 'MKL48', name: 'Megaproof (Inhouse) 1 kg', basePrice: 1356 },
  { productNo: 'MKL16', name: 'Megatitanium - Light Grey 20Kg', basePrice: 7203 },
  { productNo: 'MKL35', name: 'Megacoat Skim Coat 20Kg', basePrice: 1483 },
  { productNo: 'MKL11', name: 'Megatitanium - Grey 5Kg', basePrice: 2000 },
  { productNo: 'MKL13', name: 'Megatitanium - White 5Kg', basePrice: 2966 },
  { productNo: 'MKL6', name: 'Megalastic Super 540 7.2 Kg Set', basePrice: 6017 },
  { productNo: 'MKL14', name: 'MegaTitanium - Yellow - 20Kg', basePrice: 10602 },
  { productNo: 'MKL40', name: 'Megakem Tile Grout 1Kg', basePrice: 220 }
];

const updateProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    let created = 0;
    let updated = 0;

    for (const productData of productsFromPDF) {
      try {
        // Try to find existing product by productNo
        let product = await Product.findOne({ productNo: productData.productNo.toUpperCase() });

        if (product) {
          // Update existing product
          product.name = productData.name;
          product.price = productData.basePrice;
          product.isActive = true;
          await product.save();
          updated++;
          console.log(`✅ Updated: ${productData.productNo} - ${productData.name}`);
        } else {
          // Create new product
          product = await Product.create({
            productNo: productData.productNo.toUpperCase(),
            name: productData.name,
            description: productData.name,
            price: productData.basePrice,
            isActive: true
          });
          created++;
          console.log(`➕ Created: ${productData.productNo} - ${productData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${productData.productNo}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Total: ${productsFromPDF.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

updateProducts();







