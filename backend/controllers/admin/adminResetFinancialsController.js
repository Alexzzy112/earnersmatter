const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');
const Transaction = require('../../models/Transaction');
const AuditLog = require('../../models/AuditLog');
const { logAction } = require('../../utils/auditLogger');

exports.resetFinancials = async (req, res) => {
  try {
    const result = await Promise.all([
      Deposit.deleteMany({}),
      Withdrawal.deleteMany({}),
      Transaction.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    const counts = {
      deposits: result[0].deletedCount,
      withdrawals: result[1].deletedCount,
      transactions: result[2].deletedCount,
      auditLogs: result[3].deletedCount,
    };

    await logAction({
      userId: req.user._id,
      action: 'financials_reset',
      entityType: 'System',
      entityId: null,
      details: counts,
      req,
    });

    res.status(200).json({ success: true, message: 'Financial records cleared. User accounts, investments, and activation status were not affected.', data: counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
