const User = require('../models/User');

/**
 * Middleware to check if the user has a specific permission
 * Allows full access if user is an admin
 * 
 * @param {string} requiredPermission - The permission key to check (e.g., 'canExport', 'canManageProducts')
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // If not authenticated, reject
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Admins bypass permission checks
    if (req.user.role === 'admin') {
      return next();
    }

    // Check specific permission
    if (req.user.permissions && req.user.permissions[requiredPermission] === true) {
      return next();
    }

    // If permission is lacking
    return res.status(403).json({
      success: false,
      message: `Access denied. You do not have the required permission: ${requiredPermission}`
    });
  };
};

/**
 * Middleware strictly for admins. 
 * Use when an action is too sensitive for even co-admins with permissions.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only administrators can perform this action.'
    });
  }
  next();
};

module.exports = {
  requirePermission,
  requireAdmin
};
