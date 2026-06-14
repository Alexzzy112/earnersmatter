const User = require('../models/User');

const getReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id })
      .select('username email createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: referrals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReferralStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('referralCode referralEarnings');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const totalReferrals = await User.countDocuments({ referredBy: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        totalReferrals,
        totalEarnings: user.referralEarnings,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReferrals,
  getReferralStats,
};
