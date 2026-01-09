const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: [true, 'Member ID is required'],
    uppercase: true,
    trim: true
  },
  memberName: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['applicator', 'customer'],
    default: 'applicator'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  totalScans: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  lastScanDate: {
    type: Date
  },
  // Monthly purchase tracking for cash rewards
  monthlyPurchases: [{
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    totalPurchaseValue: {
      type: Number,
      default: 0,
      min: 0
    },
    cashReward: {
      type: Number,
      default: 0,
      min: 0
    },
    rewardCalculated: {
      type: Boolean,
      default: false
    },
    rewardPaid: {
      type: Boolean,
      default: false
    },
    rewardPaidDate: {
      type: Date
    }
  }],
  totalCashRewards: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
memberSchema.index({ memberId: 1 }, { unique: true });
memberSchema.index({ role: 1 });
memberSchema.index({ points: -1 });
memberSchema.index({ tier: 1 });

// Method to update tier based on points (will use configurable thresholds)
memberSchema.methods.updateTier = function(tierThresholds) {
  const thresholds = tierThresholds || {
    bronze: 0,
    silver: 2000,
    gold: 5000,
    platinum: 10000
  };

  if (this.points >= thresholds.platinum) {
    this.tier = 'platinum';
  } else if (this.points >= thresholds.gold) {
    this.tier = 'gold';
  } else if (this.points >= thresholds.silver) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
};

// Method to add points
memberSchema.methods.addPoints = async function(points, tierThresholds) {
  this.points += points;
  this.updateTier(tierThresholds);
  await this.save();
};

// Method to add monthly purchase value
memberSchema.methods.addMonthlyPurchase = function(purchaseValue, year, month) {
  const purchaseIndex = this.monthlyPurchases.findIndex(
    p => p.year === year && p.month === month
  );

  if (purchaseIndex >= 0) {
    // Update existing month
    this.monthlyPurchases[purchaseIndex].totalPurchaseValue += purchaseValue;
    // Reset reward calculation if purchase value changed
    this.monthlyPurchases[purchaseIndex].rewardCalculated = false;
    this.monthlyPurchases[purchaseIndex].cashReward = 0;
  } else {
    // Add new month
    this.monthlyPurchases.push({
      year,
      month,
      totalPurchaseValue: purchaseValue,
      cashReward: 0,
      rewardCalculated: false,
      rewardPaid: false
    });
  }
};

// Method to calculate cash reward for a specific month
memberSchema.methods.calculateCashReward = function(year, month) {
  const purchase = this.monthlyPurchases.find(
    p => p.year === year && p.month === month
  );

  if (!purchase || purchase.rewardCalculated) {
    return purchase ? purchase.cashReward : 0;
  }

  // Tiered cash reward calculation
  // Each tier processes a range of the total amount
  const tiers = [
    { min: 0, max: 250000, rate: 0.045 },         // 4.50% - First Rs. 250,000
    { min: 250000, max: 500000, rate: 0.05 },     // 5.00% - Next Rs. 250,000
    { min: 500000, max: 750000, rate: 0.055 },    // 5.50% - Next Rs. 250,000
    { min: 750000, max: 1000000, rate: 0.06 },    // 6.00% - Next Rs. 250,000
    { min: 1000000, max: Infinity, rate: 0.065 }  // 6.50% - Above Rs. 1,000,000
  ];

  let remaining = purchase.totalPurchaseValue;
  let totalReward = 0;

  for (const tier of tiers) {
    if (remaining <= 0) break;

    // Calculate how much of the purchase falls into this tier
    let tierAmount;
    
    if (tier.max === Infinity) {
      // Unlimited tier - all remaining amount
      tierAmount = remaining;
    } else {
      // Calculate the maximum amount this tier can handle
      const tierCapacity = tier.max - tier.min;
      // Apply either the remaining amount or the tier capacity, whichever is smaller
      tierAmount = Math.min(remaining, tierCapacity);
    }
    
    if (tierAmount > 0) {
      totalReward += tierAmount * tier.rate;
      remaining -= tierAmount;
    }
  }

  purchase.cashReward = Math.round(totalReward * 100) / 100; // Round to 2 decimal places
  purchase.rewardCalculated = true;
  
  return purchase.cashReward;
};

module.exports = mongoose.model('Member', memberSchema);

