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

const ACCOUNT_ALLOWED_FIELDS = ['accountName', 'accountNumber', 'bankName', 'accountType'];

exports.createAccount = async (req, res) => {
  try {
    const data = { createdBy: req.user._id };
    for (const field of ACCOUNT_ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const account = await PaymentAccount.create(data);

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
    const data = {};
    for (const field of ACCOUNT_ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    const account = await PaymentAccount.findByIdAndUpdate(req.params.id, data, {
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
      switchType: 'manual',
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

exports.setDefaultAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Payment account not found' });
    }

    await PaymentAccount.updateMany({}, { isDefault: false });

    account.isDefault = !account.isDefault;
    await account.save();

    await logAction({
      userId: req.user._id,
      action: 'payment_account_default_toggled',
      entityType: 'PaymentAccount',
      entityId: account._id,
      details: { accountName: account.accountName, isDefault: account.isDefault },
      req,
    });

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Payment account not found' });
    }

    await logAction({
      userId: req.user._id,
      action: 'payment_account_deleted',
      entityType: 'PaymentAccount',
      entityId: req.params.id,
      details: { accountName: account.accountName, accountNumber: account.accountNumber },
      req,
    });

    res.status(200).json({ success: true, message: 'Payment account deleted' });
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
