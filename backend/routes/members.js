const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const LoyaltyConfig = require('../models/LoyaltyConfig');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// @route   GET /api/members
// @desc    Get all members (customers and applicators)
// @access  Private/Admin
router.get('/', protect, async (req, res) => {
  try {
    const { role, search, sortBy = 'points', sortOrder = 'desc' } = req.query;
    
    // Allow admin, co-admin with proper permissions, or any user fetching only applicator list for scan validation
    const isAdmin = req.user.role === 'admin';
    const isCoAdmin = req.user.role === 'co-admin';
    const hasUsersPerm = req.user.permissions?.canManageUsers === true;
    const hasApplicatorsPerm = req.user.permissions?.canManageApplicators === true;

    let allowed = false;
    if (isAdmin) {
      allowed = true;
    } else if (isCoAdmin) {
      if (hasUsersPerm) {
        allowed = true;
      } else if (hasApplicatorsPerm && (!role || role === 'applicator' || role === 'customer')) {
        // canManageApplicators covers both Applicators (MA) and Hardwares (MH)
        allowed = true;
      }
    } else if (role === 'applicator' || role === 'customer' || !role) {
      // Allow any authenticated user to fetch applicator/hardware list for scan validation
      allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

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

    let selectFields = '';
    if (req.user.role !== 'admin' && !hasUsersPerm) {
      // Exclude sensitive financial and points info for users/co-admins without canManageUsers
      selectFields = 'memberId memberName phone whatsappNumber nic birthday role location hardwareAddress contactPersonName contactPersonMobile zone equipment equipmentBrand purchaseDate condition notes connectedHardware';
    }

    const members = await Member.find(query).select(selectFields).sort(sort);

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
    if (req.user.role !== 'admin' && !(req.user.role === 'co-admin' && req.user.permissions?.canManageUsers === true)) {
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

    // Reset points, totalScans and monthlyPurchases for all members first
    await Member.updateMany(
      {},
      { 
        $set: { 
          points: 0, 
          totalScans: 0,
          monthlyPurchases: [],
          totalCashRewards: 0,
          tier: 'bronze'
        } 
      }
    );

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

    // Audit Log
    await logAction(req, 'SYNC_MEMBERS', 'MEMBERS', { 
      totalScans: allScans.length,
      createdCount: created,
      updatedCount: updated
    });

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

// @route   POST /api/members/fix-roles
// @desc    One-time migration: set correct role for all Members and Scans based on memberId prefix
//          MA* → applicator  |  MH* / CUS-* → customer
// @access  Private/Admin only
router.post('/fix-roles', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const Scan = require('../models/Scan');

    // Use MongoDB's bulk updateMany — avoids Mongoose pre-save hooks (roles already correct)
    const memberResults = await Promise.all([
      // MA* → applicator
      Member.updateMany(
        { memberId: { $regex: '^MA', $options: 'i' }, role: { $ne: 'applicator' } },
        { $set: { role: 'applicator' } }
      ),
      // MH* → customer + equipment:'Hardware'
      Member.updateMany(
        { memberId: { $regex: '^MH', $options: 'i' }, role: { $ne: 'customer' } },
        { $set: { role: 'customer' } }
      ),
      // MH* missing equipment field → set to 'Hardware'
      Member.updateMany(
        { memberId: { $regex: '^MH', $options: 'i' }, equipment: { $in: [null, '', undefined] } },
        { $set: { equipment: 'Hardware' } }
      ),
      // CUS-* → customer
      Member.updateMany(
        { memberId: { $regex: '^CUS-', $options: 'i' }, role: { $ne: 'customer' } },
        { $set: { role: 'customer' } }
      )
    ]);

    const scanResults = await Promise.all([
      Scan.updateMany(
        { memberId: { $regex: '^MA', $options: 'i' }, role: { $ne: 'applicator' } },
        { $set: { role: 'applicator' } }
      ),
      Scan.updateMany(
        { memberId: { $regex: '^MH', $options: 'i' }, role: { $ne: 'customer' } },
        { $set: { role: 'customer' } }
      ),
      Scan.updateMany(
        { memberId: { $regex: '^CUS-', $options: 'i' }, role: { $ne: 'customer' } },
        { $set: { role: 'customer' } }
      )
    ]);

    const membersFixed =
      (memberResults[0].modifiedCount || 0) +
      (memberResults[1].modifiedCount || 0) +
      (memberResults[2].modifiedCount || 0) +   // equipment fix
      (memberResults[3].modifiedCount || 0);

    const scansFixed =
      (scanResults[0].modifiedCount || 0) +
      (scanResults[1].modifiedCount || 0) +
      (scanResults[2].modifiedCount || 0);

    await logAction(req, 'FIX_ROLES', 'MEMBERS', { membersFixed, scansFixed });

    res.json({
      success: true,
      message: `Role migration complete. Members fixed: ${membersFixed}, Scans fixed: ${scansFixed}`,
      data: { membersFixed, scansFixed }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// @desc    Get member statistics
// @access  Private/Admin
router.get('/stats/summary', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && !(req.user.role === 'co-admin' && req.user.permissions?.canManageUsers === true)) {
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
    const isAdmin = req.user.role === 'admin';
    const isCoAdmin = req.user.role === 'co-admin';
    const hasUsersPerm = req.user.permissions?.canManageUsers === true;
    const hasApplicatorsPerm = req.user.permissions?.canManageApplicators === true;

    if (!isAdmin && !(isCoAdmin && (hasUsersPerm || hasApplicatorsPerm))) {
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

    // If co-admin only has applicators permission, they can only view applicators and hardwares
    if (isCoAdmin && !hasUsersPerm && hasApplicatorsPerm && member.role !== 'applicator' && member.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view applicator and hardware details.'
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
    if (req.user.role !== 'admin' && !(req.user.role === 'co-admin' && req.user.permissions?.canManageUsers === true)) {
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

    // Audit Log
    await logAction(req, 'UPDATE_MEMBER_POINTS', 'MEMBERS', { 
      memberId: member._id, 
      memberCode: member.memberId,
      points, 
      operation 
    });

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

// @route   POST /api/members
// @desc    Create a new member (applicator or customer)
// @access  Private/Admin
router.post('/', protect, [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required'),
  body('memberName')
    .notEmpty()
    .withMessage('Member name is required')
], async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isCoAdmin = req.user.role === 'co-admin';
    const hasUsersPerm = req.user.permissions?.canManageUsers === true;
    const hasApplicatorsPerm = req.user.permissions?.canManageApplicators === true;

    if (!isAdmin && !(isCoAdmin && (hasUsersPerm || hasApplicatorsPerm))) {
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

    const { 
      memberId, 
      memberName, 
      phone,
      whatsappNumber,
      nic,
      birthday,
      role = 'applicator', 
      location, 
      hardwareAddress,
      contactPersonName,
      contactPersonMobile,
      zone,
      points = 0,
      equipment,
      equipmentBrand,
      purchaseDate,
      condition = 'good',
      notes,
      connectedHardware
    } = req.body;

    if (isCoAdmin && !hasUsersPerm && hasApplicatorsPerm && role !== 'applicator' && role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage applicator and hardware accounts.'
      });
    }

    let member = await Member.findOne({ memberId: memberId.toUpperCase().trim() });
    if (member) {
      if (isCoAdmin && !hasUsersPerm && hasApplicatorsPerm && member.role !== 'applicator' && member.role !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only manage applicator and hardware accounts.'
        });
      }
      member.memberName = memberName;
      if (phone !== undefined) member.phone = phone;
      if (whatsappNumber !== undefined) member.whatsappNumber = whatsappNumber;
      if (nic !== undefined) member.nic = nic;
      if (birthday !== undefined) member.birthday = birthday || null;
      if (role !== undefined) member.role = role;
      if (location !== undefined) member.location = location;
      if (equipment !== undefined) member.equipment = equipment;
      if (equipmentBrand !== undefined) member.equipmentBrand = equipmentBrand;
      if (purchaseDate !== undefined) member.purchaseDate = purchaseDate || null;
      if (condition !== undefined) member.condition = condition || 'good';
      if (notes !== undefined) member.notes = notes;
      if (connectedHardware !== undefined) member.connectedHardware = connectedHardware;

      const config = await LoyaltyConfig.getConfig();
      member.updateTier(config.tierThresholds);
      await member.save();

      await logAction(req, 'UPDATE_MEMBER', 'MEMBERS', {
        memberId: member._id,
        memberCode: member.memberId,
        role: member.role,
        isMigrationUpdate: true
      });

      return res.json({
        success: true,
        data: member,
        message: 'Member updated with hardware/applicator info successfully'
      });
    }

    const newMember = new Member({
      memberId: memberId.toUpperCase().trim(),
      memberName,
      phone,
      whatsappNumber,
      nic,
      birthday: birthday || null,
      role,
      location,
      hardwareAddress,
      contactPersonName,
      contactPersonMobile,
      zone,
      points,
      equipment,
      equipmentBrand,
      purchaseDate: purchaseDate || null,
      condition,
      notes,
      connectedHardware
    });

    const config = await LoyaltyConfig.getConfig();
    newMember.updateTier(config.tierThresholds);

    await newMember.save();

    // Audit Log
    await logAction(req, 'CREATE_MEMBER', 'MEMBERS', {
      memberId: newMember._id,
      memberCode: newMember.memberId,
      role: newMember.role
    });

    res.status(201).json({
      success: true,
      data: newMember,
      message: 'Member created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/members/:id
// @desc    Update a member
// @access  Private/Admin
router.put('/:id', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isCoAdmin = req.user.role === 'co-admin';
    const hasUsersPerm = req.user.permissions?.canManageUsers === true;
    const hasApplicatorsPerm = req.user.permissions?.canManageApplicators === true;

    if (!isAdmin && !(isCoAdmin && (hasUsersPerm || hasApplicatorsPerm))) {
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

    if (isCoAdmin && !hasUsersPerm && hasApplicatorsPerm && member.role !== 'applicator' && member.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage applicator and hardware accounts.'
      });
    }

    const fieldsToUpdate = [
      'memberName',
      'phone',
      'whatsappNumber',
      'nic',
      'role',
      'location',
      'hardwareAddress',
      'contactPersonName',
      'contactPersonMobile',
      'zone',
      'points',
      'equipment',
      'equipmentBrand',
      'condition',
      'notes',
      'connectedHardware'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        member[field] = req.body[field];
      }
    });

    if (req.body.purchaseDate !== undefined) {
      member.purchaseDate = req.body.purchaseDate || null;
    }

    if (req.body.birthday !== undefined) {
      member.birthday = req.body.birthday || null;
    }

    if (req.body.memberId !== undefined) {
      const newMemberId = req.body.memberId.toUpperCase().trim();
      if (newMemberId !== member.memberId) {
        const existingMember = await Member.findOne({ memberId: newMemberId });
        if (existingMember) {
          return res.status(400).json({
            success: false,
            message: `Member with ID ${newMemberId} already exists`
          });
        }
        member.memberId = newMemberId;
      }
    }

    const config = await LoyaltyConfig.getConfig();
    member.updateTier(config.tierThresholds);

    await member.save();

    // Audit Log
    await logAction(req, 'UPDATE_MEMBER', 'MEMBERS', {
      memberId: member._id,
      memberCode: member.memberId
    });

    res.json({
      success: true,
      data: member,
      message: 'Member updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Private/Admin
router.delete('/:id', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isCoAdmin = req.user.role === 'co-admin';
    const hasUsersPerm = req.user.permissions?.canManageUsers === true;
    const hasApplicatorsPerm = req.user.permissions?.canManageApplicators === true;

    if (!isAdmin && !(isCoAdmin && (hasUsersPerm || hasApplicatorsPerm))) {
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

    if (isCoAdmin && !hasUsersPerm && hasApplicatorsPerm && member.role !== 'applicator' && member.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete applicator and hardware accounts.'
      });
    }

    await Member.deleteOne({ _id: req.params.id });

    // Audit Log
    await logAction(req, 'DELETE_MEMBER', 'MEMBERS', {
      memberId: member._id,
      memberCode: member.memberId
    });

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

