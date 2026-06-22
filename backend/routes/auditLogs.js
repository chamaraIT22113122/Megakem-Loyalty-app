const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, hasPermission } = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit logs (Main admin only)
// @access  Private (Main Admin only - assuming Main Admin is the only one who can manage users or we just check if they are an admin. Since we don't have a strict 'super_admin' role, we'll allow those with canManageUsers to view logs)
router.get('/', protect, hasPermission('canManageUsers'), async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    
    const logs = await AuditLog.find()
      .populate('performedBy', 'username email')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await AuditLog.countDocuments();

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
