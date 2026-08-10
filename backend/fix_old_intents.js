const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const PurchaseIntent = require('./models/PurchaseIntent');
const Member = require('./models/Member');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megakem').then(async () => {
  const intents = await PurchaseIntent.find({ member: null, memberId: { $ne: null, $ne: '' } });
  console.log(`Found ${intents.length} old intents to migrate...`);
  for (const intent of intents) {
    let updated = false;
    if (mongoose.Types.ObjectId.isValid(intent.memberId)) {
      const memberById = await Member.findById(intent.memberId);
      if (memberById) {
        intent.member = memberById._id;
        await intent.save();
        console.log(`Updated intent for ${intent.memberId} by ID`);
        updated = true;
      }
    }
    
    if (!updated) {
      const memberByStr = await Member.findOne({ memberId: intent.memberId.toUpperCase() });
      if (memberByStr) {
        intent.member = memberByStr._id;
        await intent.save();
        console.log(`Updated intent for ${intent.memberId} by string`);
      } else {
        console.log(`Member not found for ${intent.memberId}`);
      }
    }
  }
  console.log('Done!');
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
});
