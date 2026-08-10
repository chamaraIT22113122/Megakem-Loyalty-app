const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const RecycleBin = require('./models/RecycleBin');
const Member = require('./models/Member');

const connectDB = require('./config/database');

const run = async () => {
  await connectDB();
  const bins = await RecycleBin.find({ originalCollection: 'purchaseintents' });
  let count = 0;
  for (const bin of bins) {
    if (bin.summary.includes('Unknown') && bin.documentData.member) {
      const member = await Member.findById(bin.documentData.member);
      if (member) {
        const name = bin.documentData.name || member.memberName || member.username || 'Unknown';
        const phone = bin.documentData.mobile || member.phone || member.whatsappNumber || 'No Mobile';
        bin.summary = `Lead: ${name} - ${phone}`;
        await bin.save();
        count++;
      }
    }
  }
  console.log(`Fixed ${count} bins`);
  process.exit(0);
};
run();
