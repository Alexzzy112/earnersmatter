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

module.exports = { getDepositSettings };
