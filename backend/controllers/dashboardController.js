const User = require('../models/User');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'walletBalance referralBalance totalDeposits totalWithdrawals totalInvestments totalEarnings'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeInvestments = await Investment.countDocuments({
      userId: req.user._id,
      status: 'active',
    });

    const completedInvestments = await Investment.countDocuments({
      userId: req.user._id,
      status: 'completed',
    });

    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
        referralBalance: user.referralBalance,
        totalDeposits: user.totalDeposits,
        totalWithdrawals: user.totalWithdrawals,
        totalInvestments: user.totalInvestments,
        totalEarnings: user.totalEarnings,
        activeInvestments,
        completedInvestments,
        recentTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
};
