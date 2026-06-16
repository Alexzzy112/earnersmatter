const Setting = require('../models/Setting');

const getDepositSettings = async (req, res) => {
  try {
    const keys = ['minDeposit', 'maxDeposit'];
    const settings = await Setting.find({ key: { $in: keys } });
    const data = {};
    for (const s of settings) {
      data[s.key] = s.value;
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getContactSettings = async (req, res) => {
  try {
    const keys = ['contactTelegramChannel', 'contactTelegramAdmin', 'siteName', 'siteDescription'];
    const settings = await Setting.find({ key: { $in: keys } });
    const data = {};
    for (const s of settings) {
      data[s.key] = s.value;
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWithdrawalSettings = async (req, res) => {
  try {
    const keys = ['minWithdrawal', 'maxWithdrawal', 'chargeRate'];
    const settings = await Setting.find({ key: { $in: keys } });
    const data = {};
    for (const s of settings) {
      data[s.key] = s.value;
    }
    if (!data.chargeRate) data.chargeRate = 0.05;
    if (!data.minWithdrawal) data.minWithdrawal = 2500;
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDepositSettings, getContactSettings, getWithdrawalSettings };
