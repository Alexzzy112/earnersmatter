const Deposit = require('../../models/Deposit');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Notification = require('../../models/Notification');
const { paginate, generateReference } = require('../../utils/helpers');
const { logAction } = require('../../utils/auditLogger');

exports.getAllDeposits = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    let filter = {};
    if (status) filter.status = status;

    const [deposits, total] = await Promise.all([
      Deposit.find(filter).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
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
      message: `Your deposit of $${deposit.amount.toFixed(2)} has been approved`,
    });

    res.status(200).json({ success: true, data: deposit });
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
        ? `Your deposit of $${deposit.amount.toFixed(2)} has been rejected: ${adminNote}`
        : `Your deposit of $${deposit.amount.toFixed(2)} has been rejected`,
    });

    res.status(200).json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
