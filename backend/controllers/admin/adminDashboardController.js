const User = require('../../models/User');
const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');
const Investment = require('../../models/Investment');
const Transaction = require('../../models/Transaction');
const AuditLog = require('../../models/AuditLog');
const PaymentAccount = require('../../models/PaymentAccount');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalDeposits,
      totalWithdrawals,
      totalInvestments,
      totalEarningsDistributed,
      pendingDeposits,
      pendingWithdrawals,
      activePaymentAccount,
      totalPaymentAccounts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Deposit.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Investment.aggregate([
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'earning', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Deposit.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments({ status: 'pending' }),
      PaymentAccount.findOne({ isActive: true }),
      PaymentAccount.countDocuments(),
    ]);

    const depositSum = totalDeposits.length > 0 ? totalDeposits[0].total : 0;
    const withdrawalSum = totalWithdrawals.length > 0 ? totalWithdrawals[0].total : 0;
    const investmentSum = totalInvestments.length > 0 ? totalInvestments[0].total : 0;
    const earningsSum = totalEarningsDistributed.length > 0 ? totalEarningsDistributed[0].total : 0;
    const totalRevenue = investmentSum - earningsSum;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalDeposits: depositSum,
        totalWithdrawals: withdrawalSum,
        totalInvestments: investmentSum,
        totalEarningsDistributed: earningsSum,
        totalRevenue,
        pendingDeposits,
        pendingWithdrawals,
        activePaymentAccount: activePaymentAccount ? {
          _id: activePaymentAccount._id,
          accountName: activePaymentAccount.accountName,
          accountNumber: activePaymentAccount.accountNumber,
          bankName: activePaymentAccount.bankName,
          accountType: activePaymentAccount.accountType,
          assignmentCount: activePaymentAccount.assignmentCount,
        } : null,
        totalPaymentAccounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username email');

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
