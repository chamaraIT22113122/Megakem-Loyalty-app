const mongoose = require('mongoose');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const Member = require('../models/Member');

const checkAndResetPoints = async () => {
  try {
    const config = await LoyaltyConfig.getConfig();
    
    if (!config || !config.pointsReset || config.pointsReset.intervalMonths === 0) {
      // Points reset is disabled
      return;
    }

    const { intervalMonths, resetDay, lastResetDate } = config.pointsReset;
    const today = new Date();
    
    let shouldReset = false;
    
    if (!lastResetDate) {
      if (today.getDate() >= resetDay) {
        shouldReset = true;
      }
    } else {
      const monthsSinceReset = (today.getFullYear() - lastResetDate.getFullYear()) * 12 + (today.getMonth() - lastResetDate.getMonth());
      
      if (monthsSinceReset >= intervalMonths && today.getDate() >= resetDay) {
        shouldReset = true;
      } else if (monthsSinceReset > intervalMonths) {
        shouldReset = true;
      }
    }

    if (shouldReset) {
      console.log('🔄 Executing scheduled loyalty points reset...');
      
      const defaultTier = 'bronze';
      
      const result = await Member.updateMany({}, {
        $set: {
          points: 0,
          currentTier: defaultTier
        }
      });
      
      config.pointsReset.lastResetDate = new Date();
      await config.save();
      
      console.log(`✅ Points reset completed. Affected ${result.modifiedCount} members.`);
    }
  } catch (error) {
    console.error('⚠️ Error during points reset check:', error.message);
  }
};

module.exports = { checkAndResetPoints };
