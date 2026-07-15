const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Scan = require('../models/Scan');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const Product = require('../models/Product');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// Helper function to calculate points for a scan (copied from scans.js)
async function calculatePointsForScan(scan, config, pointsConfig) {
  try {
    const product = await Product.findOne({ 
      productNo: scan.productNo ? scan.productNo.toUpperCase() : null 
    });

    if (product && product.pointsPerProduct != null) {
      return product.pointsPerProduct;
    }

    return 0; // No applicator bonus
  } catch (error) {
    console.error('Error calculating points in cashRewards:', error);
    return 0;
  }
}

// Helper function to calculate monthly purchase value and points from scans
async function calculateMonthlyPurchaseValueAndPoints(memberId, year, month, config, pointsConfig, productPointsMap = null) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const scans = await Scan.find({
    memberId: memberId.toUpperCase(),
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  });

  const purchaseValue = scans.reduce((total, scan) => total + (scan.price || 0), 0);
  
  let pointsEarned = 0;
  for (const scan of scans) {
    let scanPoints = scan.pointsEarned !== undefined ? scan.pointsEarned : (scan.points || 0);
    if (scanPoints === 0 && (scan.price > 0 || scan.qty)) {
      if (productPointsMap) {
        const productNo = scan.productNo ? scan.productNo.toUpperCase() : null;
        scanPoints = productNo && productPointsMap[productNo] != null ? productPointsMap[productNo] : 0;
      } else {
        scanPoints = await calculatePointsForScan(scan, config, pointsConfig);
      }
    }
    pointsEarned += scanPoints;
  }

  return { purchaseValue, pointsEarned };
}

// Helper function to calculate reward breakdown
function calculateRewardBreakdown(totalPurchaseValue, configTiers) {
  const tier1Rate = (configTiers && configTiers.tier1 !== undefined) ? (Number(configTiers.tier1) / 100) : 0.045;
  const tier2Rate = (configTiers && configTiers.tier2 !== undefined) ? (Number(configTiers.tier2) / 100) : 0.05;
  const tier3Rate = (configTiers && configTiers.tier3 !== undefined) ? (Number(configTiers.tier3) / 100) : 0.055;
  const tier4Rate = (configTiers && configTiers.tier4 !== undefined) ? (Number(configTiers.tier4) / 100) : 0.06;
  const tier5Rate = (configTiers && configTiers.tier5 !== undefined) ? (Number(configTiers.tier5) / 100) : 0.065;

  const tiers = [
    { min: 0, max: 250000, rate: tier1Rate, label: '0 - 250,000' },
    { min: 250000, max: 500000, rate: tier2Rate, label: '250,001 - 500,000' },
    { min: 500000, max: 750000, rate: tier3Rate, label: '500,001 - 750,000' },
    { min: 750000, max: 1000000, rate: tier4Rate, label: '750,001 - 1,000,000' },
    { min: 1000000, max: Infinity, rate: tier5Rate, label: 'Above 1,000,000' }
  ];

  let remaining = totalPurchaseValue;
  const breakdown = [];

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
      const reward = tierAmount * tier.rate;
      breakdown.push({
        tier: tier.label,
        amount: tierAmount,
        rate: (tier.rate * 100).toFixed(2) + '%',
        reward: Math.round(reward * 100) / 100
      });
      remaining -= tierAmount;
    }
  }

  return breakdown;
}

// @route   GET /api/cash-rewards/:memberId
// @desc    Get cash rewards for a specific member
// @access  Private
router.get('/:memberId', protect, async (req, res) => {
  try {
    const { year, month } = req.query;
    const member = await Member.findOne({ 
      memberId: req.params.memberId.toUpperCase() 
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    if (year && month) {
      const config = await LoyaltyConfig.getConfig();
      const pointsConfig = config.pointsCalculation || { method: 'price_based', priceDivisor: 1000, applicatorBonus: 0.1 };
      
      const products = await Product.find({}, 'productNo pointsPerProduct').lean();
      const productPointsMap = {};
      products.forEach(p => {
        if (p.productNo) productPointsMap[p.productNo.toUpperCase()] = p.pointsPerProduct || 0;
      });
      
      const { purchaseValue, pointsEarned } = await calculateMonthlyPurchaseValueAndPoints(
        member.memberId, 
        parseInt(year), 
        parseInt(month),
        config,
        pointsConfig,
        productPointsMap
      );
      
      member.setMonthlyPurchase(purchaseValue, pointsEarned, parseInt(year), parseInt(month));
      const cashReward = member.calculateCashReward(parseInt(year), parseInt(month), config.cashRewardTiers);
      member.calculateAnnualPointsAndTier(config.annualTiers);
      
      if (member.isModified()) {
        await member.save();
      }

      const purchase = member.monthlyPurchases.find(
        p => p.year === parseInt(year) && p.month === parseInt(month)
      );

      return res.json({
        success: true,
        data: {
          memberId: member.memberId,
          memberName: member.memberName,
          year: parseInt(year),
          month: parseInt(month),
          totalPurchaseValue: purchase ? purchase.totalPurchaseValue : 0,
          cashReward: cashReward,
          rewardCalculated: purchase ? purchase.rewardCalculated : false,
          rewardPaid: purchase ? purchase.rewardPaid : false
        }
      });
    }

    res.json({
      success: true,
      data: {
        memberId: member.memberId,
        memberName: member.memberName,
        role: member.role,
        totalCashRewards: member.totalCashRewards,
        monthlyPurchases: member.monthlyPurchases.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        })
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/cash-rewards
// @desc    Get all applicators' cash rewards (with optional filters)
// @access  Private/Admin
router.get('/', protect, hasPermission('canExport'), async (req, res) => {
  try {
    const { year, month, role = 'applicator' } = req.query;
    
    const query = { role };
    const members = await Member.find(query);

    const results = [];
    const config = await LoyaltyConfig.getConfig();
    const pointsConfig = config.pointsCalculation || { method: 'price_based', priceDivisor: 1000, applicatorBonus: 0.1 };

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      
      const scans = await Scan.find({
        role,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      });

      const purchaseMap = {};
      const pointsMap = {};
      for (const m of members) {
        purchaseMap[m.memberId] = 0;
        pointsMap[m.memberId] = 0;
      }

      const products = await Product.find({}, 'productNo pointsPerProduct').lean();
      const productPointsMap = {};
      products.forEach(p => {
        if (p.productNo) productPointsMap[p.productNo.toUpperCase()] = p.pointsPerProduct || 0;
      });

      for (const scan of scans) {
        const mId = scan.memberId;
        if (purchaseMap[mId] !== undefined) {
          purchaseMap[mId] += (scan.price || 0);
          
          let scanPoints = scan.pointsEarned !== undefined ? scan.pointsEarned : (scan.points || 0);
          if (scanPoints === 0 && (scan.price > 0 || scan.qty)) {
            const productNo = scan.productNo ? scan.productNo.toUpperCase() : null;
            scanPoints = productNo && productPointsMap[productNo] != null ? productPointsMap[productNo] : 0;
          }
          pointsMap[mId] += scanPoints;
        }
      }

      const savePromises = [];

      for (const member of members) {
        const pValue = purchaseMap[member.memberId] || 0;
        const pEarned = pointsMap[member.memberId] || 0;
        
        // Only run mutations if things actually changed or need to be set
        member.setMonthlyPurchase(pValue, pEarned, parseInt(year), parseInt(month));
        const cashReward = member.calculateCashReward(parseInt(year), parseInt(month), config.cashRewardTiers);
        member.calculateAnnualPointsAndTier(config.annualTiers);
        
        if (member.isModified()) {
          savePromises.push(member.save());
        }

        const purchase = member.monthlyPurchases.find(
          p => p.year === parseInt(year) && p.month === parseInt(month)
        );

        results.push({
          memberId: member.memberId,
          memberName: member.memberName,
          year: parseInt(year),
          month: parseInt(month),
          totalPurchaseValue: purchase ? purchase.totalPurchaseValue : 0,
          cashReward: cashReward,
          rewardCalculated: purchase ? purchase.rewardCalculated : false,
          rewardPaid: purchase ? purchase.rewardPaid : false
        });
      }
      
      // Save in chunks to not overwhelm the DB
      const chunkSize = 50;
      for (let i = 0; i < savePromises.length; i += chunkSize) {
        await Promise.all(savePromises.slice(i, i + chunkSize));
      }
    } else {
      for (const member of members) {
        results.push({
          memberId: member.memberId,
          memberName: member.memberName,
          totalCashRewards: member.totalCashRewards,
          monthlyPurchases: member.monthlyPurchases.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          })
        });
      }
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/cash-rewards/calculate/:memberId
// @desc    Calculate cash reward for a specific member and month
// @access  Private/Admin
router.post('/calculate/:memberId', protect, hasPermission('canExport'), async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const member = await Member.findOne({ 
      memberId: req.params.memberId.toUpperCase() 
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const config = await LoyaltyConfig.getConfig();
    const pointsConfig = config.pointsCalculation || { method: 'price_based', priceDivisor: 1000, applicatorBonus: 0.1 };

    const products = await Product.find({}, 'productNo pointsPerProduct').lean();
    const productPointsMap = {};
    products.forEach(p => {
      if (p.productNo) productPointsMap[p.productNo.toUpperCase()] = p.pointsPerProduct || 0;
    });

    const { purchaseValue, pointsEarned } = await calculateMonthlyPurchaseValueAndPoints(
      member.memberId,
      parseInt(year),
      parseInt(month),
      config,
      pointsConfig,
      productPointsMap
    );

    member.setMonthlyPurchase(purchaseValue, pointsEarned, parseInt(year), parseInt(month));
    const cashReward = member.calculateCashReward(parseInt(year), parseInt(month), config.cashRewardTiers);
    member.calculateAnnualPointsAndTier(config.annualTiers);
    
    if (member.isModified()) {
      await member.save();
    }

    const purchase = member.monthlyPurchases.find(
      p => p.year === parseInt(year) && p.month === parseInt(month)
    );

    const breakdown = calculateRewardBreakdown(purchase.totalPurchaseValue, config.cashRewardTiers);

    await logAction(req, 'CALCULATE_CASH_REWARDS', 'CASH_REWARDS', { memberId: member.memberId, year, month, purchaseValue, cashReward });

    res.json({
      success: true,
      data: {
        memberId: member.memberId,
        memberName: member.memberName,
        year: parseInt(year),
        month: parseInt(month),
        totalPurchaseValue: purchase.totalPurchaseValue,
        cashReward: cashReward,
        breakdown,
        rewardCalculated: purchase.rewardCalculated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/cash-rewards/pay/:memberId
// @desc    Mark cash reward as paid for a specific member and month
// @access  Private/Admin
router.post('/pay/:memberId', protect, hasPermission('canExport'), async (req, res) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const member = await Member.findOne({ 
      memberId: req.params.memberId.toUpperCase() 
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const purchase = member.monthlyPurchases.find(
      p => p.year === parseInt(year) && p.month === parseInt(month)
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Monthly purchase record not found. Calculate reward first.'
      });
    }

    if (!purchase.rewardPaid) {
      purchase.rewardPaid = true;
      purchase.rewardPaidDate = new Date();
      member.totalCashRewards += purchase.cashReward;
      await member.save();
    }

    await logAction(req, 'PAY_CASH_REWARDS', 'CASH_REWARDS', { memberId: member.memberId, year, month, cashReward: purchase.cashReward });

    res.json({
      success: true,
      data: {
        memberId: member.memberId,
        memberName: member.memberName,
        year: parseInt(year),
        month: parseInt(month),
        cashReward: purchase.cashReward,
        rewardPaid: purchase.rewardPaid,
        rewardPaidDate: purchase.rewardPaidDate,
        totalCashRewards: member.totalCashRewards
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
