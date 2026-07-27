const mongoose = require('mongoose');
require('dotenv').config();
const Feedback = require('./models/Feedback');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const feedback = await Feedback.findOne().sort({ createdAt: -1 });
    console.log('Latest Feedback ID:', feedback._id);
    console.log('Email Status:', feedback.emailStatus);
    console.log('Email Error:', feedback.emailError);
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
