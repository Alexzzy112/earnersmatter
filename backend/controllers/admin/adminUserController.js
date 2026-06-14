const User = require('../../models/User');
const Investment = require('../../models/Investment');
const Deposit = require('../../models/Deposit');
const Withdrawal = require('../../models/Withdrawal');
const { paginate } = require('../../utils/helpers');
const { logAction } = require('../../utils/auditLogger');

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    let filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [investments, deposits, withdrawals] = await Promise.all([
      Investment.find({ userId: user._id }),
      Deposit.find({ userId: user._id }).sort({ createdAt: -1 }),
      Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        investments,
        deposits,
        withdrawals,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const allowedFields = ['status', 'walletBalance', 'phone', 'referralBonusRate'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'user_updated_by_admin',
      entityType: 'User',
      entityId: user._id,
      details: updates,
      req,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'suspended' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'user_suspended',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'user_activated',
      entityType: 'User',
      entityId: user._id,
      req,
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
