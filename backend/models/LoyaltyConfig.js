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









