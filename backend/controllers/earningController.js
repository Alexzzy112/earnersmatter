const Transaction = require('../models/Transaction');
const EarningSchedule = require('../models/EarningSchedule');
const helpers = require('../utils/helpers');

const getUserEarnings = async (req, res) => {
  try {
    const { skip, limit } = helpers.paginate(req.query.page, req.query.limit);

    const earnings = await Transaction.find({ userId: req.user._id, type: 'earning' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId: req.user._id, type: 'earning' });

    res.status(200).json({
      success: true,
      data: earnings,
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

const getEarningSchedule = async (req, res) => {
  try {
    const schedules = await EarningSchedule.find({ investmentId: req.params.investmentId })
      .sort({ dayNumber: 1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserEarnings,
  getEarningSchedule,
};
