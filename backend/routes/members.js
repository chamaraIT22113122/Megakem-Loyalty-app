const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const { protect } = require('../middleware/auth');

// @route   GET /api/members
// @desc    Get all members (customers and applicators)
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { role, search, sortBy = 'points', sortOrder = 'desc' } = req.query;
    
    let query = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { memberId: { $regex: search, $options: 'i' } },
        { memberName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const members = await Member.find(query).sort(sort);

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/members/sync-from-scans
// @desc    Sync members from all existing scans
// @access  Private/Admin
router.post('/sync-from-scans', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const Scan = require('../models/Scan');
    const Product = require('../models/Product');
    const LoyaltyConfig = require('../models/LoyaltyConfig');

    // Helper function to calculate points
    const calculatePointsForScan = async (scan) => {
      try {
        const config = await LoyaltyConfig.getConfig();
        const pointsConfig = config.pointsCalculation || { method: 'price_based', priceDivisor: 1000, applicatorBonus: 0.1 };

        const product = await Product.findOne({ 
          productNo: scan.productNo.toUpperCase() 
        });

        let basePoints = 0;

        if (pointsConfig.method === 'product_based' && product) {
          if (product.pointsPerProduct) {
            basePoints = product.pointsPerProduct;
          } else if (product.pointsPerPackSize && scan.qty) {
            const packSizePoints = product.pointsPerPackSize.find(p => 
              p.packSize.toLowerCase() === scan.qty.toLowerCase()
            );
            if (packSizePoints) {
              basePoints = packSizePoints.points;
            }
          }
        } else if (pointsConfig.method === 'price_based' && scan.price) {
          basePoints = Math.floor(scan.price / (pointsConfig.priceDivisor || 1000));
        }

        let totalPoints = basePoints;
        if (scan.role === 'applicator' && pointsConfig.applicatorBonus) {
          const bonus = Math.floor(basePoints * pointsConfig.applicatorBonus);
          totalPoints = basePoints + bonus;
        }

        return totalPoints;
      } catch (error) {
        console.error('Error calculating points:', error);
        return 0;
      }
    };

    const allScans = await Scan.find().sort({ timestamp: 1 });
    const config = await LoyaltyConfig.getConfig();
    let created = 0;
    let updated = 0;
    const memberMap = new Map();

    // First pass: aggregate all scans by member
    for (const scan of allScans) {
      const memberId = scan.memberId.toUpperCase();
      
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          memberId,
          memberName: scan.memberName,
          phone: scan.phone || '',
          role: scan.role,
          points: 0,
          totalScans: 0,
          location: scan.location || '',
          lastScanDate: scan.timestamp || new Date()
        });
      }

      const memberData = memberMap.get(memberId);
      const pointsEarned = await calculatePointsForScan(scan);
      memberData.points += pointsEarned;
      memberData.totalScans += 1;
      
      if (scan.timestamp && (!memberData.lastScanDate || scan.timestamp > memberData.lastScanDate)) {
        memberData.lastScanDate = scan.timestamp;
      }
    }

    // Second pass: create or update members
    for (const [memberId, memberData] of memberMap) {
      try {
        let member = await Member.findOne({ memberId });

        if (!member) {
          member = await Member.create(memberData);
          created++;
        } else {
          member.memberName = memberData.memberName || member.memberName;
          member.phone = memberData.phone || member.phone;
          member.role = memberData.role;
          member.points = memberData.points;
          member.totalScans = memberData.totalScans;
          member.location = memberData.location || member.location;
          member.lastScanDate = memberData.lastScanDate;
          updated++;
        }

        // Update tier
        member.updateTier(config.tierThresholds);
        await member.save();
      } catch (error) {
        console.error(`Error processing member ${memberId}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Synced ${memberMap.size} members from ${allScans.length} scans`,
      data: {
        created,
        updated,
        totalMembers: memberMap.size,
        totalScans: allScans.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/members/stats/summary
// @desc    Get member statistics
// @access  Private/Admin
router.get('/stats/summary', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const totalMembers = await Member.countDocuments();
    const totalApplicators = await Member.countDocuments({ role: 'applicator' });
    const totalCustomers = await Member.countDocuments({ role: 'customer' });
    const totalPoints = await Member.aggregate([
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    const tierStats = await Member.aggregate([
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        totalApplicators,
        totalCustomers,
        totalPoints: totalPoints[0]?.total || 0,
        tierStats: tierStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/members/:id
// @desc    Get single member
// @access  Private/Admin
router.get('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/members/:id/points
// @desc    Update member loyalty points
// @access  Private/Admin
router.put('/:id/points', protect, [
  body('points')
    .isInt({ min: 0 })
    .withMessage('Points must be a non-negative integer'),
  body('operation')
    .optional()
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Operation must be set, add, or subtract')
], async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { points, operation = 'set' } = req.body;
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Get tier thresholds from config
    const config = await LoyaltyConfig.getConfig();
    const tierThresholds = config.tierThresholds;

    // Update points based on operation
    if (operation === 'set') {
      member.points = Math.max(0, points);
    } else if (operation === 'add') {
      member.points = Math.max(0, member.points + points);
    } else if (operation === 'subtract') {
      member.points = Math.max(0, member.points - points);
    }

    // Update tier based on new points
    member.updateTier(tierThresholds);
    await member.save();

    res.json({
      success: true,
      data: {
        id: member._id,
        memberId: member.memberId,
        memberName: member.memberName,
        points: member.points,
        tier: member.tier
      },
      message: `Points ${operation === 'set' ? 'set' : operation === 'add' ? 'added' : 'subtracted'} successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

