const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const replaceProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Delete all existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} existing products`);

    // Create new default Megakem products
    const products = [
      {
        name: 'Ecolastic 32 Kg Set',
        productNo: 'MKL39',
        description: 'Ecolastic waterproofing solution',
        category: '32kg',
        price: 18000
      },
      {
        name: 'Megaproof (Inhouse) 20 kg',
        productNo: 'MKL51',
        description: 'In-house waterproofing compound',
        category: '20kg',
        price: 19068
      },
      {
        name: 'Megalastic Super 540 36 Kg Set',
        productNo: 'MKL3',
        description: 'Super strength waterproofing set',
        category: '36kg',
        price: 24153
      },
      {
        name: 'Ecolastic 7.2 Kg Set',
        productNo: 'MKL47',
        description: 'Ecolastic waterproofing solution',
        category: '7.2kg',
        price: 4750
      },
      {
        name: 'Megaproof (Inhouse) 10 kg',
        productNo: 'MKL50',
        description: 'In-house waterproofing compound',
        category: '10kg',
        price: 10169
      },
      {
        name: 'Megaproof (Inhouse) 4 kg',
        productNo: 'MKL49',
        description: 'In-house waterproofing compound',
        category: '4kg',
        price: 4322
      },
      {
        name: 'Ecolastic 3.6 Kg Set',
        productNo: 'MKL46',
        description: 'Ecolastic waterproofing solution',
        category: '3.6kg',
        price: 2750
      },
      {
        name: 'Megabond Ultra Tile Adhesive 25Kg',
        productNo: 'MKL7',
        description: 'Ultra strength tile adhesive',
        category: '25kg',
        price: 2373
      },
      {
        name: 'Megatitanium - White 20Kg',
        productNo: 'MKL12',
        description: 'Premium white titanium coating',
        category: '20kg',
        price: 10750
      },
      {
        name: 'MEGATITANIUM - GREY 20KG',
        productNo: 'MKL10',
        description: 'Premium grey titanium coating',
        category: '20kg',
        price: 7203
      },
      {
        name: 'Megaproof (Inhouse) 1 kg',
        productNo: 'MKL48',
        description: 'In-house waterproofing compound',
        category: '1kg',
        price: 1356
      },
      {
        name: 'Megatitanium - Light Grey 20Kg',
        productNo: 'MKL16',
        description: 'Premium light grey titanium coating',
        category: '20kg',
        price: 7203
      },
      {
        name: 'Megacoat Skim Coat 20Kg',
        productNo: 'MKL35',
        description: 'Smooth skim coat finish',
        category: '20kg',
        price: 1483
      },
      {
        name: 'Megatitanium - Grey 5Kg',
        productNo: 'MKL11',
        description: 'Premium grey titanium coating',
        category: '5kg',
        price: 2000
      },
      {
        name: 'Megatitanium - White 5Kg',
        productNo: 'MKL13',
        description: 'Premium white titanium coating',
        category: '5kg',
        price: 2966
      },
      {
        name: 'Megalastic Super 540 7.2 Kg Set',
        productNo: 'MKL6',
        description: 'Super strength waterproofing set',
        category: '7.2kg',
        price: 6017
      },
      {
        name: 'MegaTitanium - Yellow - 20Kg',
        productNo: 'MKL14',
        description: 'Premium yellow titanium coating',
        category: '20kg',
        price: 10602
      },
      {
        name: 'Megakem Tile Grout 1Kg',
        productNo: 'MKL40',
        description: 'Professional tile grout',
        category: '1kg',
        price: 220
      }
    ];

    await Product.insertMany(products);

    console.log('\n✅ New Megakem products created successfully!\n');
    console.log(`Total Products: ${products.length}\n`);
    console.log('Products:');
    products.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name} [${p.productNo}] - Rs. ${p.price.toLocaleString()} (${p.category})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

replaceProducts();





