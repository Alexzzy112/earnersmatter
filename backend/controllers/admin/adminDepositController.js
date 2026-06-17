const Deposit = require('../../models/Deposit');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Notification = require('../../models/Notification');
const Referral = require('../../models/Referral');
const Setting = require('../../models/Setting');
const { paginate, generateReference } = require('../../utils/helpers');
const { logAction } = require('../../utils/auditLogger');

exports.getAllDeposits = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    let filter = {};
    if (status) filter.status = status;

    const [deposits, total] = await Promise.all([
      Deposit.find(filter).populate('userId', 'username email').populate('paymentAccountId').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Deposit.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: deposits,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate('userId', 'username email').populate('reviewedBy', 'username email');

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    res.status(200).json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Deposit is not pending' });
    }

    deposit.status = 'approved';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    await deposit.save();

    const user = await User.findById(deposit.userId);
    user.walletBalance += deposit.amount;
    user.totalDeposits += deposit.amount;
    await user.save();

    await Transaction.findOneAndUpdate(
      { reference: deposit.transactionReference },
      { status: 'approved' }
    );

    // Referral bonus
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        const [bonusSetting, typeSetting] = await Promise.all([
          Setting.findOne({ key: 'referralBonus' }),
          Setting.findOne({ key: 'bonusType' }),
        ]);
        const bonusType = typeSetting?.value || 'percentage';
        const bonusValue = Number(bonusSetting?.value) || 30;
        const bonusAmount = bonusType === 'percentage'
          ? Math.round(deposit.amount * (bonusValue / 100))
          : Math.round(bonusValue);
        referrer.walletBalance += bonusAmount;
        referrer.referralEarnings += bonusAmount;
        await referrer.save();

        await Transaction.create({
          userId: referrer._id,
          type: 'referral_bonus',
          amount: bonusAmount,
          balanceBefore: referrer.walletBalance - bonusAmount,
          balanceAfter: referrer.walletBalance,
          description: `Referral bonus for ${user.username}'s deposit of ₦${deposit.amount.toLocaleString()}`,
          reference: generateReference(),
          status: 'completed',
        });

        await Notification.create({
          userId: referrer._id,
          type: 'referral_bonus',
          title: 'Referral Bonus Credited',
          message: `You earned ₦${bonusAmount.toLocaleString()} referral bonus from ${user.username}'s deposit`,
        });

        await Referral.findOneAndUpdate(
          { referrerId: referrer._id, referredUserId: user._id },
          { bonusAmount, status: 'paid' },
          { upsert: true }
        );
      }
    }

    await logAction({
      userId: req.user._id,
      action: 'deposit_approved',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { amount: deposit.amount },
      req,
    });

    await Notification.create({
      userId: deposit.userId,
      type: 'deposit',
      title: 'Deposit Approved',
      message: `Your deposit of ₦${deposit.amount.toLocaleString()} has been approved`,
    });

    res.status(200).json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findByIdAndDelete(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'deposit_deleted',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { amount: deposit.amount },
      req,
    });

    res.status(200).json({ success: true, message: 'Deposit deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const deposit = await Deposit.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Deposit is not pending' });
    }

    deposit.status = 'rejected';
    deposit.reviewedBy = req.user._id;
    deposit.reviewedAt = new Date();
    deposit.adminNote = adminNote || '';
    await deposit.save();

    await Transaction.findOneAndUpdate(
      { reference: deposit.transactionReference },
      { status: 'rejected' }
    );

    await logAction({
      userId: req.user._id,
      action: 'deposit_rejected',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { amount: deposit.amount, adminNote },
      req,
    });

    await Notification.create({
      userId: deposit.userId,
      type: 'deposit',
      title: 'Deposit Rejected',
      message: adminNote
        ? `Your deposit of ₦${deposit.amount.toLocaleString()} has been rejected: ${adminNote}`
        : `Your deposit of ₦${deposit.amount.toLocaleString()} has been rejected`,
    });

    res.status(200).json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
