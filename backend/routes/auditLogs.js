const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, hasPermission } = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit logs (Main admin only)
// @access  Private (Main Admin only - assuming Main Admin is the only one who can manage users or we just check if they are an admin. Since we don't have a strict 'super_admin' role, we'll allow those with canManageUsers to view logs)
router.get('/', protect, hasPermission('canManageUsers'), async (req, res) => {
  try {
    const { limit = 100, page = 1, search, module: moduleFilter, action, startDate, endDate } = req.query;
    
    let query = {};
    
    // 1. Date filters
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // 2. Exact match filters
    if (moduleFilter) query.module = moduleFilter;
    if (action) query.action = action;

    // 3. Search filter (find users matching search, then filter logs by those user IDs)
    if (search) {
      const User = require('../models/User'); // Import User model
      const matchingUsers = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(u => u._id);
      
      // If search doesn't match any users, return empty result or maybe they searched for module/action?
      // Since we specifically told the user search is for names/emails, we'll restrict to user IDs
      query.performedBy = { $in: userIds };
    }

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'username email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
