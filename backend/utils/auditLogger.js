const AuditLog = require('../models/AuditLog');

const logAction = async ({ userId, action, entityType, entityId, details, req }) => {
  try {
    const ipAddress = req ? (req.ip || req.connection?.remoteAddress) : undefined;
    const userAgent = req ? req.headers['user-agent'] : undefined;

    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

module.exports = { logAction };
