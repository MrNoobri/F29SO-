const AuditLog = require("../models/AuditLog.model");

/**
 * Create audit log entry
 */
const createAuditLog = async (actorId, actorRole, action, details = {}) => {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      action,
      targetId: details.targetId,
      targetModel: details.targetModel,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      details: details.metadata,
    });
  } catch (error) {
    console.error("Audit log error:", error);
    // Don't throw - audit logging should not break the application
  }
};

/**
 * Express middleware to log actions
 */
const auditMiddleware = (action) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to capture response
    res.json = function (data) {
      // Only log if request was successful
      if (req.user && res.statusCode < 400) {
        createAuditLog(req.user._id, req.user.role, action, {
          targetId: req.params.id || data?.data?._id,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
          },
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
