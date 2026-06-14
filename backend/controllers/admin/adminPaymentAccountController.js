const PaymentAccount = require('../../models/PaymentAccount');
const AccountSwitchLog = require('../../models/AccountSwitchLog');
const { logAction } = require('../../utils/auditLogger');

exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await PaymentAccount.find().populate('createdBy', 'username email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await logAction({
      userId: req.user._id,
      action: 'payment_account_created',
      entityType: 'PaymentAccount',
      entityId: account._id,
      details: { accountName: account.accountName },
      req,
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payment account not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'payment_account_updated',
      entityType: 'PaymentAccount',
      entityId: account._id,
      details: req.body,
      req,
    });

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Payment account not found' });
    }

    const previousActiveAccount = await PaymentAccount.findOne({ isActive: true });

    await PaymentAccount.updateMany({}, { isActive: false });

    account.isActive = true;
    await account.save();

    await AccountSwitchLog.create({
      previousAccountId: previousActiveAccount ? previousActiveAccount._id : null,
      newAccountId: account._id,
      switchedBy: req.user._id,
      switchedAt: new Date(),
    });

    await logAction({
      userId: req.user._id,
      action: 'payment_account_activated',
      entityType: 'PaymentAccount',
      entityId: account._id,
      details: { accountName: account.accountName },
      req,
    });

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deactivateAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Payment account not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'payment_account_deactivated',
      entityType: 'PaymentAccount',
      entityId: account._id,
      details: { accountName: account.accountName },
      req,
    });

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSwitchHistory = async (req, res) => {
  try {
    const logs = await AccountSwitchLog.find()
      .populate('previousAccountId', 'accountName accountNumber')
      .populate('newAccountId', 'accountName accountNumber')
      .populate('switchedBy', 'username email')
      .sort({ switchedAt: -1 });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
