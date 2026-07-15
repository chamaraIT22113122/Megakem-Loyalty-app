const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB Connected');
  const Product = require('./backend/models/Product');
  const products = await Product.find({}, 'name productNo');
  for (const p of products) {
    console.log(`${p.productNo}: ${p.name}`);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
