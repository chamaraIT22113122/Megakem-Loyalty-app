const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Scan = require('../models/Scan');
const User = require('../models/User');
const { protect, admin, hasPermission } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard analytics
// @access  Private/Admin
router.get('/dashboard', protect, hasPermission('canViewDashboard'), async (req, res) => {
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
router.get('/daily-report', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get all scans for the day (to return as a list if needed)
    const dailyScans = await Scan.find({
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ timestamp: -1 });

    // Calculate statistics using MongoDB Aggregation Pipeline for max performance
    const [reportStats] = await Scan.aggregate([
      { $match: { timestamp: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $facet: {
          basicStats: [
            { $group: {
                _id: null,
                totalScans: { $sum: 1 },
                uniqueMembers: { $addToSet: '$memberId' },
                uniqueProducts: { $addToSet: '$productNo' }
            }}
          ],
          roleBreakdown: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          topProducts: [
            { $group: { _id: { no: '$productNo', name: '$productName' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          hourlyDistribution: [
            { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } }
          ],
          topMembers: [
            { $group: { _id: { id: '$memberId', name: '$memberName', role: '$role', location: '$location' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    const basic = reportStats.basicStats[0] || { totalScans: 0, uniqueMembers: [], uniqueProducts: [] };
    const totalScans = basic.totalScans;
    const uniqueMembers = basic.uniqueMembers.length;
    const uniqueProducts = basic.uniqueProducts.length;

    const roleBreakdown = {};
    reportStats.roleBreakdown.forEach(r => { if(r._id) roleBreakdown[r._id] = r.count; });

    const topProducts = reportStats.topProducts.map(p => ({
      productNo: p._id.no,
      productName: p._id.name,
      count: p.count
    }));

    const hourlyDistribution = {};
    reportStats.hourlyDistribution.forEach(h => { hourlyDistribution[h._id] = h.count; });

    const topMembers = reportStats.topMembers.map(m => ({
      memberId: m._id.id,
      memberName: m._id.name,
      role: m._id.role,
      location: m._id.location,
      count: m.count
    }));

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
router.get('/calendar-data', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ success: false, message: 'Year and month parameters are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Use Aggregation Pipeline to process calendar stats natively in MongoDB
    const monthSummary = await Scan.aggregate([
      { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: {
          _id: { $dayOfMonth: '$timestamp' },
          scans: { $sum: 1 },
          uniqueMembers: { $addToSet: '$memberId' },
          uniqueProducts: { $addToSet: '$productNo' }
      }},
      { $project: {
          date: '$_id',
          scans: 1,
          uniqueMembers: { $size: '$uniqueMembers' },
          uniqueProducts: { $size: '$uniqueProducts' },
          _id: 0
      }},
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: monthSummary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data as CSV or Excel
// @access  Private/Admin
router.get('/export', protect, requireAdmin, async (req, res) => {
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

// @route   GET /api/analytics/sales-forecasting
// @desc    Get sales forecasting based on historical scans
// @access  Private/Admin
router.get('/sales-forecasting', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const scans = await Scan.aggregate([
      { $match: { timestamp: { $gte: threeMonthsAgo } } },
      {
        $group: {
          _id: {
            productName: '$productName',
            month: { $month: '$timestamp' },
            year: { $year: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.productName',
          history: {
            $push: {
              month: '$_id.month',
              year: '$_id.year',
              count: '$count'
            }
          },
          totalScans: { $sum: '$count' },
          avgMonthlyScans: { $avg: '$count' }
        }
      },
      { $sort: { totalScans: -1 } },
      { $limit: 10 }
    ]);
    
    // Add a simple forecast (Simple Moving Average)
    const forecasted = scans.map(product => {
      // SMA is just the average of the last 3 months
      const forecastCount = Math.round(product.avgMonthlyScans);
      return {
        productName: product._id,
        historicalData: product.history,
        totalRecentScans: product.totalScans,
        forecastNextMonth: forecastCount
      };
    });

    res.json({ success: true, data: forecasted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/geographic-heatmap
// @desc    Get scan distribution by location
// @access  Private/Admin
router.get('/geographic-heatmap', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const locationData = await Scan.aggregate([
      { $match: { location: { $exists: true, $ne: '' } } },
      { 
        $group: { 
          _id: { $toLower: '$location' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    const formatted = locationData.map(item => ({
      location: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
      count: item.count
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/churn-detection
// @desc    Get list of applicators at risk of churning
// @access  Private/Admin
router.get('/churn-detection', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const Member = require('../models/Member');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const atRiskMembers = await Member.find({
      role: 'applicator',
      totalScans: { $gte: 5 }, // Ignore new/inactive users
      $or: [
        { lastScanDate: { $lt: thirtyDaysAgo } },
        { lastScanDate: null }
      ]
    })
    .select('memberName memberId phone lastScanDate totalScans tier')
    .sort({ totalScans: -1 })
    .limit(50);

    res.json({ success: true, data: atRiskMembers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/price-estimation
// @desc    Calculate grand total using historical vs current product prices
// @access  Private/Admin
router.get('/price-estimation', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    const priceEstimation = await Scan.aggregate([
      { $match: dateFilter },
      { 
        $lookup: {
          from: 'products',
          let: { productNo: { $toUpper: '$productNo' }, scanQty: { $toUpper: '$qty' } },
          pipeline: [
            { 
              $match: {
                $expr: {
                  $and: [
                    { $eq: [{ $toUpper: '$productNo' }, '$$productNo'] },
                    { $eq: [{ $toUpper: '$category' }, '$$scanQty'] }
                  ]
                }
              }
            }
          ],
          as: 'matchedProduct'
        }
      },
      {
        $unwind: {
          path: '$matchedProduct',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: null,
          historicalTotal: { $sum: { $ifNull: ['$price', 0] } },
          currentTotal: { 
            $sum: { 
              $cond: { 
                if: { $ne: [{ $type: '$matchedProduct.price' }, 'missing'] }, 
                then: '$matchedProduct.price', 
                else: { $ifNull: ['$price', 0] } 
              } 
            } 
          }
        }
      }
    ]);

    const result = priceEstimation.length > 0 ? priceEstimation[0] : { historicalTotal: 0, currentTotal: 0 };

    res.json({ 
      success: true, 
      data: {
        historicalTotal: result.historicalTotal,
        currentTotal: result.currentTotal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
