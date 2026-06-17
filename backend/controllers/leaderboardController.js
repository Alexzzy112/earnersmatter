const User = require('../models/User');

const getTopInvestors = async (req, res) => {
  try {
    const top = await User.find({ role: 'user', totalInvestments: { $gt: 0 } })
      .select('username totalInvestments totalEarnings referralEarnings createdAt')
      .sort({ totalInvestments: -1 })
      .limit(10)
      .lean();

    const data = top.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      totalInvestments: u.totalInvestments,
      totalEarnings: u.totalEarnings,
      referredCount: 0,
      joinedAt: u.createdAt,
    }));

    const userIds = top.filter((u) => u._id).map((u) => u._id);
    if (userIds.length > 0) {
      const Referral = require('../models/Referral');
      const counts = await Referral.aggregate([
        { $match: { referrerId: { $in: userIds } } },
        { $group: { _id: '$referrerId', count: { $sum: 1 } } },
      ]);
      const countMap = {};
      for (const c of counts) countMap[c._id.toString()] = c.count;
      for (const item of data) {
        const uid = top[item.rank - 1]._id.toString();
        item.referredCount = countMap[uid] || 0;
      }
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWeeklyGrowing = async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const top = await User.find({ role: 'user', totalEarnings: { $gt: 0 } })
      .select('username totalInvestments totalEarnings totalDeposits createdAt')
      .sort({ totalEarnings: -1 })
      .limit(10)
      .lean();

    const data = top.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      totalInvestments: u.totalInvestments,
      totalEarnings: u.totalEarnings,
      growth: u.totalInvestments > 0
        ? Math.round((u.totalEarnings / u.totalInvestments) * 100)
        : 0,
      joinedAt: u.createdAt,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTopInvestors, getWeeklyGrowing };