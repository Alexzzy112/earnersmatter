const Withdrawal = require('../../models/Withdrawal');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { paginate } = require('../../utils/helpers');
const { logAction } = require('../../utils/auditLogger');

exports.getAllWithdrawals = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    let filter = {};
    if (status) filter.status = status;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(filter).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Withdrawal.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: withdrawals,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWithdrawalById = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id).populate('userId', 'username email').populate('reviewedBy', 'username email');

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    res.status(200).json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not pending' });
    }

    const user = await User.findById(withdrawal.userId);
    const isReferral = withdrawal.withdrawalType === 'referral_bonus';
    const balanceField = isReferral ? 'referralBalance' : 'walletBalance';

    if (user[balanceField] < withdrawal.amount) {
      return res.status(400).json({ success: false, message: `Insufficient ${isReferral ? 'referral' : 'wallet'} balance` });
    }

    withdrawal.status = 'approved';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    await withdrawal.save();

    user[balanceField] -= withdrawal.amount;
    await user.save();

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_approved',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: withdrawal.amount },
      req,
    });

    await Notification.create({
      userId: withdrawal.userId,
      type: 'withdrawal',
      title: 'Withdrawal Approved',
      message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been approved`,
    });

    res.status(200).json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findByIdAndDelete(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_deleted',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: withdrawal.amount },
      req,
    });

    res.status(200).json({ success: true, message: 'Withdrawal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Withdrawal is not pending' });
    }

    withdrawal.status = 'rejected';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    withdrawal.adminNote = adminNote || '';
    await withdrawal.save();

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_rejected',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: withdrawal.amount, adminNote },
      req,
    });

    await Notification.create({
      userId: withdrawal.userId,
      type: 'withdrawal',
      title: 'Withdrawal Rejected',
      message: adminNote
        ? `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been rejected: ${adminNote}`
        : `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been rejected`,
    });

    res.status(200).json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.revertWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status === 'pending') {
      return res.status(400).json({ success: false, message: 'Pending withdrawal cannot be reverted' });
    }

    const previousStatus = withdrawal.status;
    const user = await User.findById(withdrawal.userId);
    const isReferral = withdrawal.withdrawalType === 'referral_bonus';
    const balanceField = isReferral ? 'referralBalance' : 'walletBalance';

    if (withdrawal.status === 'approved') {
      user[balanceField] += withdrawal.amount;
    } else if (withdrawal.status === 'completed') {
      user[balanceField] += withdrawal.amount;
      user.totalWithdrawals = Math.max(0, user.totalWithdrawals - withdrawal.amount);
    }

    await user.save();

    withdrawal.status = 'pending';
    withdrawal.reviewedBy = undefined;
    withdrawal.reviewedAt = undefined;
    withdrawal.completedAt = undefined;
    await withdrawal.save();

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_reverted',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: withdrawal.amount, previousStatus },
      req,
    });

    await Notification.create({
      userId: withdrawal.userId,
      type: 'withdrawal',
      title: 'Withdrawal Reverted',
      message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been reverted to pending`,
    });

    res.status(200).json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.revertAllWithdrawals = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use: approved, completed, or rejected' });
    }

    const withdrawals = await Withdrawal.find({ status }).populate('userId');

    let reverted = 0;
    for (const withdrawal of withdrawals) {
      try {
        if (status === 'rejected') {
          withdrawal.status = 'pending';
          await withdrawal.save();
        } else {
          const user = await User.findById(withdrawal.userId);
          const isReferral = withdrawal.withdrawalType === 'referral_bonus';
          const balanceField = isReferral ? 'referralBalance' : 'walletBalance';
          if (status === 'approved') {
            user[balanceField] += withdrawal.amount;
          } else if (status === 'completed') {
            user[balanceField] += withdrawal.amount;
            user.totalWithdrawals = Math.max(0, user.totalWithdrawals - withdrawal.amount);
          }
          await user.save();

          withdrawal.status = 'pending';
          withdrawal.reviewedBy = undefined;
          withdrawal.reviewedAt = undefined;
          withdrawal.completedAt = undefined;
          await withdrawal.save();
        }

        await logAction({
          userId: req.user._id,
          action: 'withdrawal_reverted',
          entityType: 'Withdrawal',
          entityId: withdrawal._id,
          details: { amount: withdrawal.amount, previousStatus: status, bulk: true },
          req,
        });

        reverted++;
      } catch (innerError) {
        console.error(`Error reverting withdrawal ${withdrawal._id}:`, innerError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `${reverted} withdrawal(s) reverted to pending`,
      count: reverted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Withdrawal must be approved first' });
    }

    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    await withdrawal.save();

    const user = await User.findById(withdrawal.userId);
    user.totalWithdrawals += withdrawal.amount;
    await user.save();

    await logAction({
      userId: req.user._id,
      action: 'withdrawal_completed',
      entityType: 'Withdrawal',
      entityId: withdrawal._id,
      details: { amount: withdrawal.amount },
      req,
    });

    res.status(200).json({ success: true, data: withdrawal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
