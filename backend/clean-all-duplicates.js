const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const QRCodeModel = require('./models/QRCode');
  
  // Find all generated records
  const generatedQRs = await QRCodeModel.find({ 
    status: 'generated'
  });
  
  console.log(`Found ${generatedQRs.length} generated QRs total.`);
  
  let deletedCount = 0;
  
  for (const gQR of generatedQRs) {
    // Check if there is a printed record with the exact same batchNo
    const printedQR = await QRCodeModel.findOne({
      batchNo: gQR.batchNo,
      status: { $ne: 'generated' } // Anything else like printed or scanned
    });
    
    if (printedQR) {
      // It's a duplicate. Delete the generated one.
      await QRCodeModel.findByIdAndDelete(gQR._id);
      deletedCount++;
      console.log(`Deleted duplicate generated record for ${gQR.batchNo}`);
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} duplicate generated records across all batches.`);
  process.exit(0);
}
run();
