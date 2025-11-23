const express = require('express');
const router = express.Router();
const { Reward, Redemption } = require('../models/Reward');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/rewards
// @desc    Get all active rewards
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true }).sort({ pointsRequired: 1 });
    res.json({ success: true, data: rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rewards
// @desc    Create a new reward (admin only)
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const reward = await Reward.create(req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/rewards/:id
// @desc    Update a reward (admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    res.json({ success: true, data: reward });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/rewards/:id
// @desc    Delete a reward (admin only)
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }
    res.json({ success: true, message: 'Reward deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/rewards/redeem/:id
// @desc    Redeem a reward
// @access  Private
router.post('/redeem/:id', protect, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found' });
    }

    const user = await User.findById(req.user.id);
    if (user.points < reward.pointsRequired) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    if (reward.stock !== null && reward.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Reward out of stock' });
    }

    // Deduct points
    user.points -= reward.pointsRequired;
    user.updateTier();
    await user.save();

    // Update stock
    if (reward.stock !== null) {
      reward.stock -= 1;
      await reward.save();
    }

    // Create redemption record
    const redemption = await Redemption.create({
      userId: user._id,
      rewardId: reward._id,
      pointsUsed: reward.pointsRequired
    });

    res.json({ 
      success: true, 
      data: redemption,
      newPoints: user.points,
      newTier: user.tier
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/rewards/redemptions
// @desc    Get user's redemption history
// @access  Private
router.get('/redemptions', protect, async (req, res) => {
  try {
    const redemptions = await Redemption.find({ userId: req.user.id })
      .populate('rewardId', 'name description pointsRequired')
      .sort({ redeemedAt: -1 });
    res.json({ success: true, data: redemptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/rewards/redemptions/all
// @desc    Get all redemptions (admin only)
// @access  Private/Admin
router.get('/redemptions/all', protect, admin, async (req, res) => {
  try {
    const redemptions = await Redemption.find()
      .populate('userId', 'username email')
      .populate('rewardId', 'name description pointsRequired')
      .sort({ redeemedAt: -1 });
    res.json({ success: true, data: redemptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
