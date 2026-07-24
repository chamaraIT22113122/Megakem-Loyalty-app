const mongoose = require('mongoose');

const loyaltyConfigSchema = new mongoose.Schema({
  // Tier thresholds
  tierThresholds: {
    bronze: {
      type: Number,
      default: 0,
      min: 0
    },
    silver: {
      type: Number,
      default: 2000,
      min: 0
    },
    gold: {
      type: Number,
      default: 5000,
      min: 0
    },
    platinum: {
      type: Number,
      default: 10000,
      min: 0
    }
  },
  // Tier names
  tierNames: {
    bronze: {
      type: String,
      default: 'Bronze'
    },
    silver: {
      type: String,
      default: 'Silver'
    },
    gold: {
      type: String,
      default: 'Gold'
    },
    platinum: {
      type: String,
      default: 'Platinum'
    }
  },
  // Points calculation method
  pointsCalculation: {
    method: {
      type: String,
      enum: ['price_based', 'product_based', 'fixed'],
      default: 'price_based'
    },
    priceDivisor: {
      type: Number,
      default: 1000, // Points = price / 1000
      min: 1
    },
    applicatorBonus: {
      type: Number,
      default: 0.1, // 10% bonus for applicators
      min: 0,
      max: 1
    }
  },
  // Annual Tiers
  annualTiers: {
    type: [{
      name: { type: String, required: true },
      minPoints: { type: Number, required: true, min: 0 },
      maxPoints: { type: Number, default: Infinity },
      benefits: { type: String, default: '' }
    }],
    default: [
      { name: 'Bronze', minPoints: 0, maxPoints: 5000, benefits: 'Basic Member' },
      { name: 'Silver', minPoints: 5000, maxPoints: 15000, benefits: 'Silver Member Perks' },
      { name: 'Gold', minPoints: 15000, maxPoints: 30000, benefits: 'Gold Member Perks' },
      { name: 'Platinum', minPoints: 30000, maxPoints: null, benefits: 'Platinum Member Perks' }
    ]
  },
  // Cash reward tiers
  cashRewardTiers: {
    tier1: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 100
    },
    tier2: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 100
    },
    tier3: {
      type: Number,
      default: 5.5,
      min: 0,
      max: 100
    },
    tier4: {
      type: Number,
      default: 6.0,
      min: 0,
      max: 100
    },
    tier5: {
      type: Number,
      default: 6.5,
      min: 0,
      max: 100
    }
  },
  // Automated point reset schedule
  pointsReset: {
    intervalMonths: {
      type: Number,
      default: 0, // 0 = never reset
      min: 0
    },
    resetDay: {
      type: Number,
      default: 1, // 1st day of the month
      min: 1,
      max: 28
    },
    lastResetDate: {
      type: Date,
      default: null
    }
  },
  // Default ID Card Layout Config
  idCardDefaultConfig: {
    type: Object,
    default: null
  },
  // Auto Backup Configuration
  autoBackup: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    retentionDays: {
      type: Number,
      default: 30,
      min: 1
    }
  },
  // Advanced Archiving (Cold Storage)
  archiving: {
    enabled: {
      type: Boolean,
      default: false
    },
    thresholdMonths: {
      type: Number,
      default: 12,
      min: 1
    }
  },
  // Advanced Compression settings
  compression: {
    enabled: {
      type: Boolean,
      default: true
    }
  },
  // Advanced Cloud Sync settings (Mock/Stub)
  cloudSync: {
    awsEnabled: {
      type: Boolean,
      default: false
    },
    gcpEnabled: {
      type: Boolean,
      default: false
    },
    googleDriveFolderId: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// Ensure only one config document exists
loyaltyConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('LoyaltyConfig', loyaltyConfigSchema);









