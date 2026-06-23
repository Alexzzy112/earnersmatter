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

    const { amount, paymentMethod, accountDetails, withdrawalType } = req.body;
    const parsedAmount = Number(amount);
    const type = withdrawalType === 'referral_bonus' ? 'referral_bonus' : 'daily_task';

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const chargeRate = Number(settingsMap.withdrawalCharge) || 5;
    const charge = helpers.calculateWithdrawalCharge(parsedAmount, chargeRate / 100);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (type === 'daily_task') {
      const minWithdrawal = 4000;
      if (parsedAmount < minWithdrawal) {
        return res.status(400).json({
          success: false,
          message: `Minimum withdrawal for Daily Task earnings is ₦${minWithdrawal.toLocaleString()}`,
        });
      }

      const daysArray = [3];
      const today = new Date().getDay();
      if (!daysArray.includes(today)) {
        return res.status(400).json({
          success: false,
          message: 'Daily Task withdrawals are only available on Wednesday',
        });
      }

      if (user.walletBalance < parsedAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }
    } else {
      const minWithdrawal = 2000;
      if (parsedAmount < minWithdrawal) {
        return res.status(400).json({
          success: false,
          message: `Minimum withdrawal for Referral Bonus is ₦${minWithdrawal.toLocaleString()}`,
        });
      }

      const hour = new Date().getHours();
      if (hour < 8 || hour >= 15) {
        return res.status(400).json({
          success: false,
          message: 'Referral Bonus withdrawals are only available from 8:00 AM to 3:00 PM daily',
        });
      }

      if (user.referralBalance < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient referral bonus balance. Available: ₦${(user.referralBalance || 0).toLocaleString()}`,
        });
      }
    }

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      amount: parsedAmount,
      charge,
      withdrawalType: type,
      paymentMethod,
      accountDetails,
    });

    if (type === 'daily_task') {
      user.walletBalance -= parsedAmount;
    } else {
      user.referralBalance -= parsedAmount;
    }
    await user.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'withdrawal',
      amount: parsedAmount,
      charge,
      balanceBefore: type === 'daily_task' ? user.walletBalance + parsedAmount : user.referralBalance + parsedAmount,
      balanceAfter: type === 'daily_task' ? user.walletBalance : user.referralBalance,
      status: 'pending',
      reference: helpers.generateReference(),
    });

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_created',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: parsedAmount, charge, paymentMethod, withdrawalType: type },
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
