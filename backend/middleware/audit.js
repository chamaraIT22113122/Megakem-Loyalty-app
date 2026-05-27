const AuditLog = require('../models/AuditLog');

/**
 * Utility function to log an administrative action
 * @param {Object} req - Express request object
 * @param {String} action - The action being performed (e.g., 'UPDATE_PRODUCT')
 * @param {String} module - The module affected (e.g., 'PRODUCTS')
 * @param {Object} details - Additional details about the change
 */
const logAction = async (req, action, module, details) => {
  try {
    await AuditLog.create({
      action,
      module,
      details,
      performedBy: req.user ? req.user.id : null,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Audit Log Error:', error.message);
  }
};

module.exports = { logAction };
