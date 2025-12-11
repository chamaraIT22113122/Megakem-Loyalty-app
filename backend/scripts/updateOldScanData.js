const mongoose = require('mongoose');
const Scan = require('../models/Scan');
require('dotenv').config();

const updateOldScanData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    // Find all scans where memberName is "N/A" or empty
    const scansToUpdate = await Scan.find({
      $or: [
        { memberName: 'N/A' },
        { memberName: '' },
        { memberName: null }
      ]
    });

    console.log(`\n📊 Found ${scansToUpdate.length} scans with N/A or empty memberName`);

    if (scansToUpdate.length === 0) {
      console.log('✅ No updates needed!');
      process.exit(0);
    }

    let updatedCount = 0;

    for (const scan of scansToUpdate) {
      // Update memberName to use memberId
      scan.memberName = scan.memberId;
      await scan.save();
      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} scan records!`);
    console.log('   memberName now shows the member ID for old records.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

updateOldScanData();
