const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Transaction = require('../models/Transaction');
const Setting = require('../models/Setting');
const helpers = require('../utils/helpers');
const { logAction } = require('../utils/auditLogger');

const WITHDRAWAL_DAYS = [1, 5]; // Monday=1, Friday=5

const createWithdrawal = async (req, res) => {
  try {
    const today = new Date().getDay();
    if (!WITHDRAWAL_DAYS.includes(today)) {
      return res.status(400).json({ success: false, message: 'Withdrawals are only available on Monday and Friday' });
    }

    const { amount, paymentMethod, accountDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const minWithdrawalSetting = await Setting.findOne({ key: 'minWithdrawal' });
    const maxWithdrawalSetting = await Setting.findOne({ key: 'maxWithdrawal' });
    const minWithdrawal = minWithdrawalSetting ? minWithdrawalSetting.value : 0;
    const maxWithdrawal = maxWithdrawalSetting ? maxWithdrawalSetting.value : Infinity;

    if (amount < minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal amount is ₦${minWithdrawal.toLocaleString()}` });
    }
    if (amount > maxWithdrawal) {
      return res.status(400).json({ success: false, message: `Maximum withdrawal amount is ₦${maxWithdrawal.toLocaleString()}` });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const charge = helpers.calculateWithdrawalCharge(amount);
    const netAmount = amount - charge;

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      amount,
      charge,
      paymentMethod,
      accountDetails,
    });

    await Transaction.create({
      userId: req.user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      reference: helpers.generateReference(),
    });

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_created',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount, charge, paymentMethod },
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
