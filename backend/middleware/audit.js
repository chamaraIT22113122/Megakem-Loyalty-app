const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

/**
 * Utility function to log an administrative action
 * @param {Object} req - Express request object
 * @param {String} action - The action being performed (e.g., 'UPDATE_PRODUCT')
 * @param {String} module - The module affected (e.g., 'PRODUCTS')
 * @param {Object} details - Additional details about the change
 * @param {Object} oldState - Before state of the document
 * @param {Object} newState - After state of the document
 * @param {String} severity - LOW, MEDIUM, or HIGH
 */
const logAction = async (req, action, module, details, oldState = null, newState = null, severity = 'LOW') => {
  try {
    const timestamp = new Date();
    const performedBy = req.user ? req.user.id : null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Sanitize request body to remove sensitive fields
    let sanitizedBody = null;
    if (req.body && Object.keys(req.body).length > 0) {
      sanitizedBody = { ...req.body };
      const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'pin', 'token'];
      sensitiveFields.forEach(field => {
        if (sanitizedBody[field]) sanitizedBody[field] = '***REDACTED***';
      });
    }

    const requestData = {
      method: req.method || 'UNKNOWN',
      url: req.originalUrl || req.url || 'UNKNOWN',
      query: req.query && Object.keys(req.query).length > 0 ? req.query : null,
      params: req.params && Object.keys(req.params).length > 0 ? req.params : null,
      body: sanitizedBody
    };

    // Get the previous log to chain the hash
    const lastLog = await AuditLog.findOne().sort({ timestamp: -1 });
    const previousHash = lastLog && lastLog.hash ? lastLog.hash : 'GENESIS';

    // Create the hash for this log
    const hashData = `${previousHash}-${action}-${timestamp.getTime()}-${performedBy}`;
    const hash = crypto.createHash('sha256').update(hashData).digest('hex');

    // Anomaly Detection Heuristics
    // Example: If action is HIGH severity and done between 12 AM and 5 AM
    const currentHour = timestamp.getHours();
    let isAnomaly = false;
    if (severity === 'HIGH' && (currentHour >= 0 && currentHour < 5)) {
      isAnomaly = true;
    }

    const logEntry = await AuditLog.create({
      action,
      module,
      details,
      oldState,
      newState,
      severity,
      isAnomaly,
      hash,
      previousHash,
      performedBy,
      ipAddress,
      userAgent,
      timestamp,
      requestData
    });

    // Alert main admin via WebSockets if HIGH severity or Anomaly
    if (req.io && (severity === 'HIGH' || isAnomaly)) {
      req.io.to('main_admins').emit('security_alert', {
        action,
        module,
        severity,
        isAnomaly,
        message: `High risk action performed: ${action} in ${module}`,
        timestamp
      });
    }

  } catch (error) {
    console.error('❌ Audit Log Error:', error.message);
  }
};

module.exports = { logAction };
