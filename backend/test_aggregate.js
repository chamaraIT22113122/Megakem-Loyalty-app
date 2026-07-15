const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const Scan = require('./models/Scan');
  const startDate = new Date(2026, 6, 1);
  const endDate = new Date(2026, 7, 0, 23, 59, 59, 999);
  const memberIds = ['MAA502', 'MA4502'];
  
  const aggregatedScans = await Scan.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
        memberId: { $in: memberIds }
      }
    },
    {
      $group: {
        _id: "$memberId",
        totalPurchase: { $sum: "$price" },
        totalPoints: { $sum: { $ifNull: ["$pointsEarned", "$points"] } }
      }
    }
  ]);
  
  console.log(JSON.stringify(aggregatedScans, null, 2));
  process.exit(0);
}).catch(console.error);
