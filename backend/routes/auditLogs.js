const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, hasPermission } = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit logs (Main admin only)
// @access  Private (Main Admin only - assuming Main Admin is the only one who can manage users or we just check if they are an admin. Since we don't have a strict 'super_admin' role, we'll allow those with canManageUsers to view logs)
router.get('/', protect, hasPermission('canManageUsers'), async (req, res) => {
  try {
    const { limit = 100, page = 1, search, module: moduleFilter, action, startDate, endDate, userId } = req.query;
    
    let query = {};
    
    if (userId) {
      query.performedBy = userId;
    }
    
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

// @route   POST /api/audit-logs/:id/revert
// @desc    Revert an action to its oldState (Best-effort undo)
// @access  Private
router.post('/:id/revert', protect, hasPermission('canManageUsers'), async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }
    
    if (!log.oldState) {
      return res.status(400).json({ success: false, message: 'This action does not have an oldState to revert to.' });
    }
    
    let Model;
    switch (log.module) {
      case 'PRODUCTS': Model = require('../models/Product'); break;
      case 'MEMBERS': Model = require('../models/Member'); break;
      case 'USERS': Model = require('../models/User'); break;
      case 'REWARDS': Model = require('../models/Reward'); break;
      case 'QR_CODES': Model = require('../models/QRCode'); break;
      case 'SETTINGS': Model = require('../models/LoyaltyConfig'); break;
      default:
        return res.status(400).json({ success: false, message: `Revert not supported for module ${log.module}` });
    }

    const docId = log.oldState._id;
    if (!docId && log.module !== 'SETTINGS') {
      return res.status(400).json({ success: false, message: 'No document ID found in oldState.' });
    }

    if (log.module === 'SETTINGS') {
      // Settings might be a single document
      await Model.findOneAndUpdate({}, log.oldState, { new: true, upsert: true });
    } else {
      // Upsert the document back to its exact old state
      await Model.findByIdAndUpdate(docId, log.oldState, { new: true, upsert: true });
    }

    // Log the revert action itself
    const { logAction } = require('../middleware/audit');
    await logAction(req, 'REVERT_ACTION', log.module, { 
      message: `Reverted action from log ${log._id}`,
      originalAction: log.action 
    }, log.newState, log.oldState, 'HIGH');

    res.json({ success: true, message: 'Action reverted successfully.' });
  } catch (error) {
    console.error('Revert Error:', error);
    res.status(500).json({ success: false, message: 'Failed to revert action', error: error.message });
  }
});

module.exports = router;
