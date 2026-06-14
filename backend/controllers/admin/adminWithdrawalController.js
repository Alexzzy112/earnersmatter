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
    if (user.walletBalance < withdrawal.amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    withdrawal.status = 'approved';
    withdrawal.reviewedBy = req.user._id;
    withdrawal.reviewedAt = new Date();
    await withdrawal.save();

    user.walletBalance -= withdrawal.amount;
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
      message: `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved`,
    });

    res.status(200).json({ success: true, data: withdrawal });
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
        ? `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been rejected: ${adminNote}`
        : `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been rejected`,
    });

    res.status(200).json({ success: true, data: withdrawal });
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
