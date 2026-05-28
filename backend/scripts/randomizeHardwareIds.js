const mongoose = require('mongoose');
const Member = require('../models/Member');
const dns = require('dns');
require('dotenv').config();

// Override DNS resolver to use Google's public DNS (8.8.8.8)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const randomizeHardwareIds = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Fetch all members with equipment 'Hardware'
    const hardwares = await Member.find({ equipment: 'Hardware' });
    console.log(`🔍 Found ${hardwares.length} hardware records to randomize.`);

    let updatedCount = 0;
    const generatedIds = new Set();

    // Fetch all existing member IDs to avoid collisions
    const allMembers = await Member.find({}, 'memberId');
    allMembers.forEach(m => {
      generatedIds.add(m.memberId.toUpperCase());
    });

    for (const h of hardwares) {
      let newId;
      let isDuplicate = true;

      // Keep generating until we get a unique 4-digit ID
      while (isDuplicate) {
        const randNum = Math.floor(1000 + Math.random() * 9000).toString(); // 1000 to 9999
        newId = `MH${randNum}`;
        
        if (!generatedIds.has(newId)) {
          isDuplicate = false;
          generatedIds.add(newId);
        }
      }

      const oldId = h.memberId;
      h.memberId = newId;
      await h.save();
      
      updatedCount++;
      console.log(`   [*] Randomized ${h.memberName}: ${oldId} ➡️ ${newId}`);
    }

    console.log(`\n✅ Randomization complete! Updated: ${updatedCount} hardware stores.`);

  } catch (error) {
    console.error('❌ Error during randomization:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

randomizeHardwareIds();
