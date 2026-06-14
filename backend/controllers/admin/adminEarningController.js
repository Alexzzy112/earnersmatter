const EarningSchedule = require('../../models/EarningSchedule');
const Transaction = require('../../models/Transaction');
const { paginate } = require('../../utils/helpers');
const { logAction } = require('../../utils/auditLogger');

exports.getEarningSchedules = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    let filter = {};
    if (status) filter.status = status;

    const [schedules, total] = await Promise.all([
      EarningSchedule.find(filter)
        .populate({
          path: 'investmentId',
          populate: { path: 'userId productId' },
        })
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limitNum),
      EarningSchedule.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: schedules,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllEarnings = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);

    const [earnings, total] = await Promise.all([
      Transaction.find({ type: 'earning' })
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments({ type: 'earning' }),
    ]);

    res.status(200).json({
      success: true,
      data: earnings,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.runManualEarning = async (req, res) => {
  try {
    const { processDailyEarnings } = require('../../cron/earnings');
    const count = await processDailyEarnings();

    await logAction({
      userId: req.user._id,
      action: 'earnings_manually_run',
      entityType: 'EarningSchedule',
      details: { processedCount: count },
      req,
    });

    res.status(200).json({ success: true, message: `Manual earnings run completed. Processed ${count} earnings.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
