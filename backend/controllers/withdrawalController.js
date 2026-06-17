const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const helpers = require('../utils/helpers');
const { logAction } = require('../utils/auditLogger');

const createWithdrawal = async (req, res) => {
  try {
    const settings = await Setting.find({});
    const settingsMap = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    const withdrawalDays = settingsMap.withdrawalDays || '1,5';
    const daysArray = String(withdrawalDays).split(',').map(Number);
    const today = new Date().getDay();
    if (!daysArray.includes(today)) {
      return res.status(400).json({ success: false, message: 'Withdrawals are not available today' });
    }

    const { amount, paymentMethod, accountDetails } = req.body;
    const parsedAmount = Number(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const minWithdrawal = Number(settingsMap.minWithdrawal) || 0;
    const maxWithdrawal = Number(settingsMap.maxWithdrawal) || Infinity;

    if (parsedAmount < minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal amount is ₦${minWithdrawal.toLocaleString()}` });
    }
    if (parsedAmount > maxWithdrawal) {
      return res.status(400).json({ success: false, message: `Maximum withdrawal amount is ₦${maxWithdrawal.toLocaleString()}` });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.walletBalance < parsedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const chargeRate = Number(settingsMap.withdrawalCharge) || 5;
    const charge = helpers.calculateWithdrawalCharge(parsedAmount, chargeRate / 100);

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      amount: parsedAmount,
      charge,
      paymentMethod,
      accountDetails,
    });

    await Transaction.create({
      userId: req.user._id,
      type: 'withdrawal',
      amount: parsedAmount,
      charge,
      balanceBefore: user.walletBalance,
      balanceAfter: user.walletBalance,
      status: 'pending',
      reference: helpers.generateReference(),
    });

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_created',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: parsedAmount, charge, paymentMethod },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createWithdrawal,
  getUserWithdrawals,
};
