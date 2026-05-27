const mongoose = require('mongoose');
const Product = require('./models/Product');
const dns = require('dns');
require('dotenv').config();

// DNS fix
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const userProducts = [
  {
    _id: "694914302d3296e0ee4154a2",
    name: "MEGATITANIUM - GREY 20KG",
    productNo: "MKL10",
    description: "Premium grey titanium coating",
    category: "20kg",
    price: 7203,
    isActive: true
  },
  {
    _id: "694914302d3296e0ee41549b",
    name: "Megalastic Super 540 36 Kg",
    productNo: "MKL3",
    description: "Super strength waterproofing set",
    category: "36kg",
    price: 24153,
    isActive: true
  },
  {
    _id: "694914302d3296e0ee41549a",
    name: "Megaproof (Inhouse) 20 kg",
    productNo: "MKL51",
    description: "In-house waterproofing compound",
    category: "20kg",
    price: 19068,
    isActive: true
  }
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    for (const p of userProducts) {
      // Delete any existing product with the same productNo to avoid unique constraint error
      // since seedProducts might have added them with different _ids
      await Product.deleteMany({ productNo: p.productNo });
      
      const newProduct = new Product(p);
      await newProduct.save();
      console.log(`✅ Added/Updated: ${p.name} [${p.productNo}] with ID: ${p._id}`);
    }

    console.log('\n🚀 Done adding user products.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
