const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Scan = require('../models/Scan');
const { protect, authorize } = require('../middleware/auth');

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

    // If year and month specified, calculate for that month
    if (year && month) {
      const purchaseValue = await calculateMonthlyPurchaseValue(
        member.memberId, 
        parseInt(year), 
        parseInt(month)
      );
      
      // Update member's monthly purchase
      member.addMonthlyPurchase(purchaseValue, parseInt(year), parseInt(month));
      const cashReward = member.calculateCashReward(parseInt(year), parseInt(month));
      await member.save();

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

    // Return all monthly purchases and rewards
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
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { year, month, role = 'applicator' } = req.query;
    
    const query = { role };
    const members = await Member.find(query);

    const results = [];

    for (const member of members) {
      if (year && month) {
        // Calculate for specific month
        const purchaseValue = await calculateMonthlyPurchaseValue(
          member.memberId,
          parseInt(year),
          parseInt(month)
        );
        
        member.addMonthlyPurchase(purchaseValue, parseInt(year), parseInt(month));
        const cashReward = member.calculateCashReward(parseInt(year), parseInt(month));
        await member.save();

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
      } else {
        // Return summary for all months
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
router.post('/calculate/:memberId', protect, authorize('admin'), async (req, res) => {
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

    // Calculate monthly purchase value from scans
    const purchaseValue = await calculateMonthlyPurchaseValue(
      member.memberId,
      parseInt(year),
      parseInt(month)
    );

    // Update member's monthly purchase
    member.addMonthlyPurchase(purchaseValue, parseInt(year), parseInt(month));
    const cashReward = member.calculateCashReward(parseInt(year), parseInt(month));
    await member.save();

    const purchase = member.monthlyPurchases.find(
      p => p.year === parseInt(year) && p.month === parseInt(month)
    );

    res.json({
      success: true,
      data: {
        memberId: member.memberId,
        memberName: member.memberName,
        year: parseInt(year),
        month: parseInt(month),
        totalPurchaseValue: purchase ? purchase.totalPurchaseValue : 0,
        cashReward: cashReward,
        rewardCalculated: purchase ? purchase.rewardCalculated : false,
        breakdown: calculateRewardBreakdown(purchase ? purchase.totalPurchaseValue : 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/cash-rewards/mark-paid/:memberId
// @desc    Mark cash reward as paid for a specific month
// @access  Private/Admin
router.put('/mark-paid/:memberId', protect, authorize('admin'), async (req, res) => {
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

// Helper function to calculate monthly purchase value from scans
async function calculateMonthlyPurchaseValue(memberId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const scans = await Scan.find({
    memberId: memberId.toUpperCase(),
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  });

  return scans.reduce((total, scan) => {
    return total + (scan.price || 0);
  }, 0);
}

// Helper function to calculate reward breakdown
function calculateRewardBreakdown(totalPurchaseValue) {
  const tiers = [
    { min: 0, max: 250000, rate: 0.045, label: '0 - 250,000' },
    { min: 250000, max: 500000, rate: 0.05, label: '250,001 - 500,000' },
    { min: 500000, max: 750000, rate: 0.055, label: '500,001 - 750,000' },
    { min: 750000, max: 1000000, rate: 0.06, label: '750,001 - 1,000,000' },
    { min: 1000000, max: Infinity, rate: 0.065, label: 'Above 1,000,000' }
  ];

  let remaining = totalPurchaseValue;
  const breakdown = [];

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

module.exports = router;

