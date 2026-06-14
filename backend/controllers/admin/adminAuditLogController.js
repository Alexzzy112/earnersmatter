const AuditLog = require('../../models/AuditLog');
const { paginate } = require('../../utils/helpers');

exports.getAuditLogs = async (req, res) => {
  try {
    const { page, limit, action, entityType } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    let filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
