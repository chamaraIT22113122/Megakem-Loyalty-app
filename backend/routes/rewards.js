const express = require('express');
const router = express.Router();
const Reward = require('../models/Reward');
const { protect, authorize, hasPermission } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

// @route   GET /api/rewards
// @desc    Get all active rewards for members
// @access  Public
router.get('/', async (req, res) => {
  try {
    const rewards = await Reward.find({ active: true }).sort({ pointsRequired: 1 });
    res.json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/rewards/all
// @desc    Get all rewards (active and inactive) for admin
// @access  Private (Admin only)
router.get('/all', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rewards
// @desc    Create a new reward
// @access  Private (Admin only)
router.post('/', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const reward = await Reward.create(req.body);

    await logAction(req, 'CREATE_REWARD', 'REWARDS', {
      rewardId: reward._id,
      name: reward.name,
      pointsRequired: reward.pointsRequired
    });

    res.status(201).json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/rewards/:id
// @desc    Update a reward
// @access  Private (Admin only)
router.put('/:id', protect, hasPermission('canManageProducts'), async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    await logAction(req, 'UPDATE_REWARD', 'REWARDS', {
      rewardId: reward._id,
      name: reward.name,
      updates: req.body
    });

    res.json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/rewards/:id
// @desc    Delete a reward
// @access  Private (Admin only)
router.delete('/:id', protect, hasPermission('canManageProducts'), hasPermission('canDelete'), async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    const rewardData = {
      rewardId: reward._id,
      name: reward.name
    };

    await reward.deleteOne();

    await logAction(req, 'DELETE_REWARD', 'REWARDS', rewardData);

    res.json({
      success: true,
      message: 'Reward deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
