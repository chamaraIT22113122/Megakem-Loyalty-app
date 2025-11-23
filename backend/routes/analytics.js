const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard analytics
// @access  Private/Admin
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Total stats
    const totalScans = await Scan.countDocuments(dateFilter);
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Scan.distinct('productName', dateFilter);

    // User tier distribution
    const tierStats = await User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]);

    // Top products
    const topProducts = await Scan.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$productName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Daily scan trends
    const dailyTrends = await Scan.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    // Role distribution
    const roleStats = await Scan.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalScans,
          totalUsers,
          totalProducts: totalProducts.length
        },
        tierDistribution: tierStats,
        topProducts,
        dailyTrends,
        roleDistribution: roleStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/leaderboard
// @desc    Get user leaderboard by points
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await User.find({ role: 'user', isActive: true })
      .select('username email points tier totalScans achievements')
      .sort({ points: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/user-stats
// @desc    Get current user's statistics
// @access  Private
router.get('/user-stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('username email points tier totalScans achievements createdAt');

    const userScans = await Scan.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);

    const scansByProduct = await Scan.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$productName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Calculate rank
    const rank = await User.countDocuments({
      role: 'user',
      points: { $gt: user.points }
    }) + 1;

    res.json({
      success: true,
      data: {
        user,
        rank,
        recentScans: userScans,
        scansByProduct
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data as CSV
// @access  Private/Admin
router.get('/export', protect, admin, async (req, res) => {
  try {
    const { type = 'scans', startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    let csvData = '';
    
    if (type === 'scans') {
      const scans = await Scan.find(dateFilter).sort({ timestamp: -1 });
      csvData = 'Timestamp,Member Name,Member ID,Role,Product Name,Product No,Batch No,Bag No,Qty\n';
      scans.forEach(scan => {
        csvData += `${scan.timestamp},${scan.memberName},${scan.memberId},${scan.role},${scan.productName},${scan.productNo},${scan.batchNo},${scan.bagNo},${scan.qty}\n`;
      });
    } else if (type === 'users') {
      const users = await User.find({ role: 'user' }).sort({ points: -1 });
      csvData = 'Username,Email,Points,Tier,Total Scans,Created At\n';
      users.forEach(user => {
        csvData += `${user.username},${user.email},${user.points},${user.tier},${user.totalScans},${user.createdAt}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-export-${Date.now()}.csv"`);
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
