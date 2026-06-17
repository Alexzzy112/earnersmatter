const Deposit = require('../models/Deposit');
const Transaction = require('../models/Transaction');
const PaymentAccount = require('../models/PaymentAccount');
const AccountSwitchLog = require('../models/AccountSwitchLog');
const helpers = require('../utils/helpers');
const { logAction } = require('../utils/auditLogger');

const createDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = Number(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const paymentAccount = await PaymentAccount.findOne({ isActive: true });
    if (!paymentAccount) {
      return res.status(400).json({ success: false, message: 'No active payment account available' });
    }

    const reference = helpers.generateReference();

    const deposit = await Deposit.create({
      userId: req.user._id,
      amount: parsedAmount,
      paymentAccountId: paymentAccount._id,
      transactionReference: reference,
    });

    await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      reference,
    });

    // Increment assignment count and auto-rotate after 5
    paymentAccount.assignmentCount = (paymentAccount.assignmentCount || 0) + 1;
    await paymentAccount.save();

    if (paymentAccount.assignmentCount >= 5) {
      paymentAccount.isActive = false;
      await paymentAccount.save();

      const nextAccount = await PaymentAccount.findOne({ _id: { $ne: paymentAccount._id }, isActive: false });
      if (nextAccount) {
        nextAccount.isActive = true;
        nextAccount.assignmentCount = 0;
        await nextAccount.save();

        await AccountSwitchLog.create({
          previousAccountId: paymentAccount._id,
          newAccountId: nextAccount._id,
          switchedAt: new Date(),
          switchType: 'auto',
        });
      }
    }

    await logAction({
      userId: req.user._id,
      action: 'deposit_created',
      entityType: 'Deposit',
      entityId: deposit._id,
      details: { amount },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Deposit created successfully',
      data: deposit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadProof = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment proof file is required' });
    }

    deposit.paymentProof = req.file.filename;
    await deposit.save();

    await logAction({
      userId: req.user._id,
      action: 'deposit_proof_uploaded',
      entityType: 'Deposit',
      entityId: deposit._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: deposit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserDeposits = async (req, res) => {
  try {
    const { skip, limit } = helpers.paginate(req.query.page, req.query.limit);

    const deposits = await Deposit.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('paymentAccountId');

    const total = await Deposit.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: deposits,
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

const getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.user._id }).populate('paymentAccountId');
    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Deposit not found' });
    }

    res.status(200).json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDeposit,
  uploadProof,
  getUserDeposits,
  getDepositById,
};
