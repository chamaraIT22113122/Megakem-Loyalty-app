const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const QRCodeModel = require('./models/QRCode');
  
  // Find all generated records for MKL3 002 300726
  const generatedQRs = await QRCodeModel.find({ 
    batchNo: { $regex: 'MKL3 002 300726' },
    status: 'generated'
  });
  
  console.log(`Found ${generatedQRs.length} generated QRs for MKL3 002 300726.`);
  
  let deletedCount = 0;
  
  for (const gQR of generatedQRs) {
    // Check if there is a printed record with the exact same batchNo
    const printedQR = await QRCodeModel.findOne({
      batchNo: gQR.batchNo,
      status: 'printed'
    });
    
    if (printedQR) {
      // It's a duplicate. Delete the generated one.
      await QRCodeModel.findByIdAndDelete(gQR._id);
      deletedCount++;
      console.log(`Deleted duplicate generated record for ${gQR.batchNo}`);
    }
  }
  
  console.log(`Successfully deleted ${deletedCount} duplicate generated records.`);
  process.exit(0);
}
run();
