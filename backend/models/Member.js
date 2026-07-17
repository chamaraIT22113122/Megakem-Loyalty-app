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
  whatsappNumber: {
    type: String,
    trim: true
  },
  nic: {
    type: String,
    trim: true
  },
  birthday: {
    type: Date
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
  annualPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  annualTier: {
    type: String,
    default: 'Bronze'
  },
  currentYear: {
    type: Number,
    default: new Date().getFullYear()
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
  hardwareAddress: {
    type: String,
    trim: true
  },
  contactPersonName: {
    type: String,
    trim: true
  },
  contactPersonMobile: {
    type: String,
    trim: true
  },
  zone: {
    type: String,
    trim: true
  },
  lastScanDate: {
    type: Date
  },
  equipment: {
    type: String,
    trim: true
  },
  equipmentBrand: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  condition: {
    type: String,
    enum: ['good', 'fair', 'poor'],
    default: 'good'
  },
  notes: {
    type: String,
    trim: true
  },
  connectedHardware: {
    type: String,
    trim: true
  },
  connectedHardwareId: {
    type: String,
    trim: true,
    default: ''
  },
  photo: {
    type: String
  },
  idCardConfig: {
    type: Object,
    default: null
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
    pointsEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    cashReward: { type: Number, default: 0 },
    rewardCalculated: { type: Boolean, default: false },
    rewardPaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'PAID'],
      default: 'CALCULATED'
    },
    calculatedAt: { type: Date },
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

// Auto-assign role based on memberId prefix before saving
memberSchema.pre('save', async function() {
  if (this.memberId) {
    const id = this.memberId.toUpperCase();
    if (id.startsWith('MA')) {
      this.role = 'applicator';
    } else if (id.startsWith('MH') || id.startsWith('CUS-')) {
      this.role = 'customer';
    }
  }
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

// Method to set (overwrite) monthly purchase value
memberSchema.methods.setMonthlyPurchase = function(purchaseValue, pointsEarned, year, month) {
  if (!this.monthlyPurchases) this.monthlyPurchases = [];
  const purchaseIndex = this.monthlyPurchases.findIndex(
    p => p.year === year && p.month === month
  );

  if (purchaseIndex >= 0) {
    // Update existing month
    this.monthlyPurchases[purchaseIndex].totalPurchaseValue = purchaseValue;
    this.monthlyPurchases[purchaseIndex].pointsEarned = pointsEarned || 0;
    // Reset reward calculation if purchase value changed
    this.monthlyPurchases[purchaseIndex].rewardCalculated = false;
    this.monthlyPurchases[purchaseIndex].cashReward = 0;
    this.monthlyPurchases[purchaseIndex].status = 'CALCULATED';
    this.markModified('monthlyPurchases');
  } else {
    // Add new month
    this.monthlyPurchases.push({
      year,
      month,
      totalPurchaseValue: purchaseValue,
      pointsEarned: pointsEarned || 0,
      cashReward: 0,
      rewardCalculated: false,
      rewardPaid: false,
      status: 'CALCULATED'
    });
  }
};

// Method to add monthly purchase value
memberSchema.methods.addMonthlyPurchase = function(purchaseValue, pointsEarned, year, month) {
  const purchaseIndex = this.monthlyPurchases.findIndex(
    p => p.year === year && p.month === month
  );

  if (purchaseIndex >= 0) {
    // Update existing month
    this.monthlyPurchases[purchaseIndex].totalPurchaseValue = purchaseValue;
    this.monthlyPurchases[purchaseIndex].pointsEarned = pointsEarned || 0;
    // Reset reward calculation if purchase value changed
    this.monthlyPurchases[purchaseIndex].rewardCalculated = false;
    this.monthlyPurchases[purchaseIndex].cashReward = 0;
    this.monthlyPurchases[purchaseIndex].status = 'CALCULATED';
    this.markModified('monthlyPurchases');
  } else {
    // Add new month
    this.monthlyPurchases.push({
      year,
      month,
      totalPurchaseValue: purchaseValue,
      pointsEarned: pointsEarned || 0,
      cashReward: 0,
      rewardCalculated: false,
      rewardPaid: false,
      status: 'CALCULATED'
    });
  }
};

// Method to calculate annual points and update tier
memberSchema.methods.calculateAnnualPointsAndTier = function(configTiers) {
  const currentYear = new Date().getFullYear();
  this.currentYear = currentYear;
  
  if (!this.monthlyPurchases) this.monthlyPurchases = [];
  
  const annualPoints = this.monthlyPurchases
    .filter(p => p.year === currentYear)
    .reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
    
  this.annualPoints = annualPoints;
  
  if (configTiers && configTiers.length > 0) {
    // Sort tiers by minPoints descending
    const sortedTiers = [...configTiers].sort((a, b) => b.minPoints - a.minPoints);
    const matchedTier = sortedTiers.find(t => annualPoints >= t.minPoints);
    if (matchedTier) {
      this.annualTier = matchedTier.name;
    } else {
      this.annualTier = 'Bronze';
    }
  }
};

// Method to calculate cash reward for a specific month
memberSchema.methods.calculateCashReward = function(year, month, customTiers, forceRecalculate = false) {
  if (!this.monthlyPurchases) this.monthlyPurchases = [];
  const purchase = this.monthlyPurchases.find(
    p => p.year === year && p.month === month
  );

  if (!purchase || (purchase.rewardCalculated && !forceRecalculate)) {
    return purchase ? purchase.cashReward : 0;
  }

  // Before July 2026, use old percentage tiers on purchaseValue
  if (year < 2026 || (year === 2026 && month < 7)) {
    // Old tier logic
    const tier1Rate = (customTiers && customTiers.tier1 !== undefined) ? (Number(customTiers.tier1) / 100) : 0.045;
    const tier2Rate = (customTiers && customTiers.tier2 !== undefined) ? (Number(customTiers.tier2) / 100) : 0.05;
    const tier3Rate = (customTiers && customTiers.tier3 !== undefined) ? (Number(customTiers.tier3) / 100) : 0.055;
    const tier4Rate = (customTiers && customTiers.tier4 !== undefined) ? (Number(customTiers.tier4) / 100) : 0.06;
    const tier5Rate = (customTiers && customTiers.tier5 !== undefined) ? (Number(customTiers.tier5) / 100) : 0.065;

    const tiers = [
      { min: 0, max: 250000, rate: tier1Rate },
      { min: 250000, max: 500000, rate: tier2Rate },
      { min: 500000, max: 750000, rate: tier3Rate },
      { min: 750000, max: 1000000, rate: tier4Rate },
      { min: 1000000, max: Infinity, rate: tier5Rate }
    ];

    let totalReward = 0;
    let remaining = purchase.totalPurchaseValue || 0;

    for (const tier of tiers) {
      if (remaining <= 0) break;

      let tierAmount;
      if (tier.max === Infinity) {
        tierAmount = remaining;
      } else {
        const tierCapacity = tier.max - tier.min;
        tierAmount = Math.min(remaining, tierCapacity);
      }

      if (tierAmount > 0) {
        totalReward += tierAmount * tier.rate;
        remaining -= tierAmount;
      }
    }

    purchase.cashReward = Math.round(totalReward * 100) / 100;
  } else {
    // 1 Point = Rs. 1 in the new system (July 2026 onwards)
    purchase.cashReward = Number(purchase.pointsEarned) || 0;
  }

  purchase.rewardCalculated = true;
  this.markModified('monthlyPurchases');
  
  return purchase.cashReward;
};

module.exports = mongoose.model('Member', memberSchema);

