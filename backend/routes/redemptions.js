const express = require('express');
const router = express.Router();
const RedemptionRequest = require('../models/RedemptionRequest');
const Reward = require('../models/Reward');
const Member = require('../models/Member');
const { protect, hasPermission } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// @route   GET /api/redemptions
// @desc    Get all redemption requests for admins
// @access  Private (Admin only)
router.get('/', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const redemptions = await RedemptionRequest.find()
      .populate('rewardId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: redemptions.length,
      data: redemptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/redemptions/member/:memberId
// @desc    Get redemptions for a specific member
// @access  Public
router.get('/member/:memberId', async (req, res) => {
  try {
    const redemptions = await RedemptionRequest.find({ memberId: req.params.memberId })
      .populate('rewardId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: redemptions.length,
      data: redemptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/redemptions
// @desc    Request a reward redemption
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { memberId, rewardId, notes } = req.body;

    // 1. Validate reward
    const reward = await Reward.findById(rewardId);
    if (!reward || !reward.active) {
      return res.status(404).json({ success: false, message: 'Reward not found or inactive' });
    }

    // 2. Validate member
    const member = await Member.findOne({ memberId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // 3. Check points
    if (member.points < reward.pointsRequired) {
      return res.status(400).json({ success: false, message: 'Insufficient points for this reward' });
    }

    // 4. Deduct points immediately
    member.points -= reward.pointsRequired;
    await member.save();

    // 5. Create request
    const redemption = await RedemptionRequest.create({
      memberId,
      rewardId,
      pointsUsed: reward.pointsRequired,
      status: 'pending',
      notes
    });

    res.status(201).json({
      success: true,
      data: redemption
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/redemptions/:id/status
// @desc    Approve or reject redemption
// @access  Private (Admin only)
router.put('/:id/status', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const { status, notes } = req.body; // status: 'approved' | 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const redemption = await RedemptionRequest.findById(req.params.id).populate('rewardId');
    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption not found' });
    }

    if (redemption.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Redemption is already processed' });
    }

    // Update redemption status
    redemption.status = status;
    redemption.processDate = Date.now();
    if (notes) redemption.notes = notes;

    await redemption.save();

    // If rejected, refund the points back to member
    if (status === 'rejected') {
      const member = await Member.findOne({ memberId: redemption.memberId });
      if (member) {
        member.points += redemption.pointsUsed;
        await member.save();
      }
    }

    await logAction(req, 'UPDATE_REDEMPTION_STATUS', 'REWARDS', {
      redemptionId: redemption._id,
      memberId: redemption.memberId,
      status,
      pointsUsed: redemption.pointsUsed
    });

    res.json({
      success: true,
      data: redemption
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
