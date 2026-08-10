const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const Scan = require('../models/Scan');
const User = require('../models/User');
const Counter = require('../models/Counter');
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

    const now = Date.now();
    const last24Hours = await Scan.countDocuments({ ...dateFilter, timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } });
    const lastWeek = await Scan.countDocuments({ ...dateFilter, timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } });
    const previousWeek = await Scan.countDocuments({
      ...dateFilter,
      timestamp: {
        $gte: new Date(now - 14 * 24 * 60 * 60 * 1000),
        $lt: new Date(now - 7 * 24 * 60 * 60 * 1000)
      }
    });

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

    // Hourly scan trends
    const hourlyDistribution = await Scan.aggregate([
      { $match: dateFilter },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Day of week trends (1 = Sunday, 7 = Saturday)
    const dayOfWeekDistribution = await Scan.aggregate([
      { $match: dateFilter },
      { $group: { _id: { $dayOfWeek: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Unique cities count
    const uniqueCitiesResult = await Scan.distinct('location', { ...dateFilter, location: { $ne: null, $ne: '' } });
    const uniqueCities = uniqueCitiesResult.length;

    // Top members
    const topMembers = await Scan.aggregate([
      { $match: dateFilter },
      { $group: { _id: { id: '$memberId', name: '$memberName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Recent scans
    const recentScans = await Scan.find(dateFilter)
      .sort({ timestamp: -1 })
      .limit(10);

    // Total value
    const totalValueResult = await Scan.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalValue = totalValueResult.length > 0 ? totalValueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalScans,
          totalUsers,
          totalProducts: totalProducts.length,
          uniqueCities,
          totalValue
        },
        tierDistribution: tierStats,
        topProducts,
        dailyTrends,
        roleDistribution: roleStats,
        hourlyDistribution,
        dayOfWeekDistribution,
        topMembers,
        recentScans
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

// @route   POST /api/analytics/purchase-intent
// @desc    Record a click on "Buy Now / Order Online"
// @access  Public
router.post('/purchase-intent', async (req, res) => {
  try {
    const PurchaseIntent = require('../models/PurchaseIntent');
    const { productId, name, mobile, memberId, visitorId } = req.body;
    
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const mongoose = require('mongoose');
    const Member = require('../models/Member');
    
    let memberRef = null;
    if (memberId) {
      if (mongoose.Types.ObjectId.isValid(memberId)) {
        const memberById = await Member.findById(memberId);
        if (memberById) memberRef = memberById._id;
      }
      if (!memberRef) {
        const memberByStr = await Member.findOne({ memberId: memberId.toUpperCase() });
        if (memberByStr) memberRef = memberByStr._id;
      }
    }

    const counter = await Counter.findByIdAndUpdate(
      'inquiryNumber',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const inquiryNumber = `INQ-${String(counter.seq).padStart(6, '0')}`;

    const intent = await PurchaseIntent.create({
      inquiryNumber,
      product: productId,
      name,
      mobile,
      memberId,
      member: memberRef,
      visitorId,
      ipAddress
    });

    const AdminNotification = require('../models/AdminNotification');
    const Product = require('../models/Product');
    const prod = await Product.findById(productId);
    await AdminNotification.create({
      type: 'lead',
      message: `New Purchase Lead received for ${prod ? prod.name : 'a product'}.`,
      relatedId: intent._id,
      onModel: 'PurchaseIntent',
      status: 'info'
    });

    res.status(201).json({ success: true, data: intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/analytics/purchase-intents
// @desc    Get all purchase intents (leads/clicks)
// @access  Private/Admin
router.get('/purchase-intents', protect, hasPermission('canViewDashboard'), async (req, res) => {
  try {
    const PurchaseIntent = require('../models/PurchaseIntent');
    const intents = await PurchaseIntent.find()
      .populate('product', 'name productNo imageUrl price')
      .populate('member', 'memberName phone whatsappNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: intents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/analytics/purchase-intent/:id
// @desc    Update purchase intent status/notes
// @access  Private/Admin
router.put('/purchase-intent/:id', protect, hasPermission('canManageLeads'), async (req, res) => {
  try {
    const PurchaseIntent = require('../models/PurchaseIntent');
    const { status, notes } = req.body;
    
    const intent = await PurchaseIntent.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );
    
    if (!intent) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    res.status(200).json({ success: true, data: intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/analytics/purchase-intent/:id
// @desc    Delete a purchase intent (lead)
// @access  Private/Admin
router.delete('/purchase-intent/:id', protect, hasPermission('canManageLeads'), async (req, res) => {
  try {
    const PurchaseIntent = require('../models/PurchaseIntent');
    const intent = await PurchaseIntent.findById(req.params.id).populate('member');
    
    if (!intent) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    
    const RecycleBin = require('../models/RecycleBin');
    const binItem = new RecycleBin({
      originalCollection: 'purchaseintents',
      documentId: intent._id,
      documentData: intent.toObject(),
      summary: `Lead: ${intent.name || intent.member?.memberName || intent.member?.username || 'Unknown'} - ${intent.mobile || intent.member?.phone || intent.member?.whatsappNumber || 'No Mobile'}`,
      deletedBy: req.user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    await binItem.save();
    
    await intent.deleteOne();
    
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// @route   POST /api/analytics/track
// @desc    Track page view
// @access  Public
router.post('/track', async (req, res) => {
  try {
    const PageView = require('../models/PageView');
    const { path, url, referrer, userAgent, deviceType, memberId } = req.body;
    
    if (userAgent && userAgent.toLowerCase().includes('bot')) {
      return res.status(200).json({ success: true, message: 'Ignored bot' });
    }

    const pageView = new PageView({
      path,
      url,
      referrer,
      userAgent,
      deviceType,
      memberId: memberId || null
    });
    
    await pageView.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error tracking page view:', err);
    res.status(500).json({ success: false });
  }
});

// @route   GET /api/analytics/traffic-stats
// @desc    Get website traffic statistics
// @access  Private/Admin
router.get('/traffic-stats', protect, hasPermission('canViewAdvancedInsights'), async (req, res) => {
  try {
    const PageView = require('../models/PageView');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyTraffic = await PageView.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          visits: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userAgent" }
        } 
      },
      { $project: { date: "$_id", visits: 1, uniqueUsers: { $size: "$uniqueUsers" }, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    const topPages = await PageView.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 },
      { $project: { path: "$_id", views: 1, _id: 0 } }
    ]);

    const deviceStats = await PageView.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } }
    ]);

    res.json({
      success: true,
      data: {
        dailyTraffic,
        topPages,
        deviceStats
      }
    });
  } catch (err) {
    console.error('Error fetching traffic stats:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
