const User = require('../models/User');
const Transaction = require('../models/Transaction');
const helpers = require('../utils/helpers');

const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'walletBalance totalDeposits totalWithdrawals totalInvestments totalEarnings'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        walletBalance: user.walletBalance,
        totalDeposits: user.totalDeposits,
        totalWithdrawals: user.totalWithdrawals,
        totalInvestments: user.totalInvestments,
        totalEarnings: user.totalEarnings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { skip, limit } = helpers.paginate(req.query.page, req.query.limit);

    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: req.query.page || 1,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWallet,
  getTransactions,
};
