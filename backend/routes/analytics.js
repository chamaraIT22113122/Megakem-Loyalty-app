const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
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

// @route   GET /api/analytics/daily-report
// @desc    Get daily sales and scans report for a specific date
// @access  Private/Admin
router.get('/daily-report', protect, admin, async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all scans for the day
    const dailyScans = await Scan.find({
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: -1 });

    // Calculate statistics
    const totalScans = dailyScans.length;
    const uniqueMembers = new Set(dailyScans.map(s => s.memberId)).size;
    const uniqueProducts = new Set(dailyScans.map(s => s.productNo)).size;

    // Scans by role
    const roleBreakdown = dailyScans.reduce((acc, scan) => {
      acc[scan.role] = (acc[scan.role] || 0) + 1;
      return acc;
    }, {});

    // Top products for the day
    const productStats = dailyScans.reduce((acc, scan) => {
      const key = scan.productNo;
      if (!acc[key]) {
        acc[key] = {
          productNo: scan.productNo,
          productName: scan.productName,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly distribution
    const hourlyDistribution = dailyScans.reduce((acc, scan) => {
      const hour = new Date(scan.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Top members/locations
    const memberStats = dailyScans.reduce((acc, scan) => {
      const key = scan.memberId;
      if (!acc[key]) {
        acc[key] = {
          memberId: scan.memberId,
          memberName: scan.memberName,
          role: scan.role,
          location: scan.location,
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    const topMembers = Object.values(memberStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        date: date,
        summary: {
          totalScans,
          uniqueMembers,
          uniqueProducts,
          roleBreakdown
        },
        topProducts,
        topMembers,
        hourlyDistribution,
        scans: dailyScans
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/calendar-data
// @desc    Get summary data for calendar month view
// @access  Private/Admin
router.get('/calendar-data', protect, admin, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'Year and month parameters are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all scans for the month
    const monthScans = await Scan.find({
      timestamp: { $gte: startDate, $lte: endDate }
    });

    // Group by day
    const dailySummary = monthScans.reduce((acc, scan) => {
      const day = new Date(scan.timestamp).getDate();
      if (!acc[day]) {
        acc[day] = {
          date: day,
          scans: 0,
          uniqueMembers: new Set(),
          uniqueProducts: new Set()
        };
      }
      acc[day].scans++;
      acc[day].uniqueMembers.add(scan.memberId);
      acc[day].uniqueProducts.add(scan.productNo);
      return acc;
    }, {});

    // Convert sets to counts
    const formattedData = Object.entries(dailySummary).map(([day, data]) => ({
      date: parseInt(day),
      scans: data.scans,
      uniqueMembers: data.uniqueMembers.size,
      uniqueProducts: data.uniqueProducts.size
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data as CSV or Excel
// @access  Private/Admin
router.get('/export', protect, admin, async (req, res) => {
  try {
    const { type = 'scans', startDate, endDate, format = 'csv' } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    let data = [];
    let filename = '';
    
    if (type === 'scans') {
      const scans = await Scan.find(dateFilter).sort({ timestamp: -1 });
      data = scans.map(scan => ({
        'Timestamp': new Date(scan.timestamp).toLocaleString(),
        'Member Name': scan.memberName,
        'Member ID': scan.memberId,
        'Role': scan.role,
        'Product Name': scan.productName,
        'Product No': scan.productNo || 'N/A',
        'Batch No': scan.batchNo,
        'Bag No': scan.bagNo,
        'Quantity': scan.qty || 1
      }));
      filename = `scans-export-${Date.now()}`;
    } else if (type === 'users') {
      const users = await User.find({ role: 'user' }).sort({ points: -1 });
      data = users.map(user => ({
        'Username': user.username,
        'Email': user.email,
        'Points': user.points,
        'Tier': user.tier,
        'Total Scans': user.totalScans,
        'Achievements': user.achievements?.join(', ') || 'None',
        'Created At': new Date(user.createdAt).toLocaleDateString()
      }));
      filename = `users-export-${Date.now()}`;
    }

    if (format === 'excel' || format === 'xlsx') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, type === 'scans' ? 'Scans' : 'Users');
      
      // Set column widths for better readability
      const maxWidth = 20;
      const cols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
      worksheet['!cols'] = cols;
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(excelBuffer);
    } else {
      // CSV format
      let csvData = Object.keys(data[0] || {}).join(',') + '\n';
      data.forEach(row => {
        csvData += Object.values(row).map(val => `"${val}"`).join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
