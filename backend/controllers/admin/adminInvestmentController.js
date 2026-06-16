const Investment = require('../../models/Investment');
const User = require('../../models/User');
const Product = require('../../models/Product');

const getAllInvestments = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 15);
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      const userIds = await User.find({ username: { $regex: search, $options: 'i' } }).select('_id');
      const productIds = await Product.find({ name: { $regex: search, $options: 'i' } }).select('_id');
      query.$or = [
        { userId: { $in: userIds.map(u => u._id) } },
        { productId: { $in: productIds.map(p => p._id) } },
      ];
    }

    const skip = (pageNum - 1) * limitNum;
    const [investments, total] = await Promise.all([
      Investment.find(query)
        .populate('userId', 'username email')
        .populate('productId', 'name price duration')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Investment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        investments,
        totalPages: Math.ceil(total / limitNum),
        total,
        page: pageNum,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllInvestments };
