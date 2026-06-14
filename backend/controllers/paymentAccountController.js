const PaymentAccount = require('../models/PaymentAccount');

const getActiveAccount = async (req, res) => {
  try {
    const account = await PaymentAccount.findOne({ isActive: true });
    if (!account) {
      return res.status(404).json({ success: false, message: 'No active payment account available' });
    }

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveAccount,
};
