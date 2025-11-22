const express = require('express');
const router = express.Router();
const Scan = require('../models/Scan');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

// @route   GET /api/scans
// @desc    Get all scans (with pagination and filters)
// @access  Public (but optionally authenticated)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, memberId } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (memberId) query.memberId = memberId.toUpperCase();

    const scans = await Scan.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Scan.countDocuments(query);

    res.json({
      success: true,
      data: scans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/scans/live
// @desc    Get recent scans for live feed (last 100)
// @access  Public
router.get('/live', async (req, res) => {
  try {
    const scans = await Scan.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: scans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/scans/:id
// @desc    Get single scan
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.json({
      success: true,
      data: scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/scans
// @desc    Create new scan
// @access  Public (anonymous allowed)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      memberName,
      memberId,
      role,
      productName,
      productNo,
      batchNo,
      bagNo,
      qty
    } = req.body;

    const scanData = {
      memberName,
      memberId: memberId.toUpperCase(),
      role,
      productName,
      productNo,
      batchNo,
      bagNo,
      qty
    };

    // Add user ID if authenticated
    if (req.user) {
      scanData.userId = req.user._id;
    }

    const scan = await Scan.create(scanData);

    res.status(201).json({
      success: true,
      data: scan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/scans/batch
// @desc    Create multiple scans at once
// @access  Public (anonymous allowed)
router.post('/batch', optionalAuth, async (req, res) => {
  try {
    const { scans } = req.body;

    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Scans array is required'
      });
    }

    // Add user ID to all scans if authenticated
    const scansData = scans.map(scan => ({
      ...scan,
      memberId: scan.memberId.toUpperCase(),
      userId: req.user ? req.user._id : undefined
    }));

    const createdScans = await Scan.insertMany(scansData);

    res.status(201).json({
      success: true,
      count: createdScans.length,
      data: createdScans
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/scans/:id
// @desc    Delete scan
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    await scan.deleteOne();

    res.json({
      success: true,
      message: 'Scan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/scans/stats/summary
// @desc    Get scan statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    const totalScans = await Scan.countDocuments();
    const applicatorScans = await Scan.countDocuments({ role: 'applicator' });
    const customerScans = await Scan.countDocuments({ role: 'customer' });
    
    // Get scans from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScans = await Scan.countDocuments({ 
      timestamp: { $gte: yesterday } 
    });

    // Get scans from last 7 days
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyScans = await Scan.countDocuments({ 
      timestamp: { $gte: lastWeek } 
    });

    // Get daily breakdown for last 7 days
    const dailyStats = await Scan.aggregate([
      {
        $match: {
          timestamp: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top products
    const topProducts = await Scan.aggregate([
      {
        $group: {
          _id: "$productName",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalScans,
        applicator: applicatorScans,
        customer: customerScans,
        last24Hours: recentScans,
        lastWeek: weeklyScans,
        dailyStats,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
