const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');
const Investment = require('../../models/Investment');
const Transaction = require('../../models/Transaction');
const EarningSchedule = require('../../models/EarningSchedule');
const Referral = require('../../models/Referral');
const UserTask = require('../../models/UserTask');
const Notification = require('../../models/Notification');
const AccountSwitchLog = require('../../models/AccountSwitchLog');
const { logAction } = require('../../utils/auditLogger');

exports.resetFinancials = async (req, res) => {
  try {
    const result = await Promise.all([
      Deposit.deleteMany({}),
      Withdrawal.deleteMany({}),
      Investment.deleteMany({}),
      Transaction.deleteMany({}),
      EarningSchedule.deleteMany({}),
      Referral.deleteMany({}),
      UserTask.deleteMany({}),
      Notification.deleteMany({}),
      AccountSwitchLog.deleteMany({}),
    ]);

    const counts = {
      deposits: result[0].deletedCount,
      withdrawals: result[1].deletedCount,
      investments: result[2].deletedCount,
      transactions: result[3].deletedCount,
      earningSchedules: result[4].deletedCount,
      referrals: result[5].deletedCount,
      userTasks: result[6].deletedCount,
      notifications: result[7].deletedCount,
      accountSwitchLogs: result[8].deletedCount,
    };

    await logAction({
      userId: req.user._id,
      action: 'financials_reset',
      entityType: 'System',
      entityId: null,
      details: counts,
      req,
    });

    res.status(200).json({ success: true, message: 'All financial records cleared', data: counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
