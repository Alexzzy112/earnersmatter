const Investment = require('../../models/Investment');

const getAllInvestments = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { 'user.username': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [investments, total] = await Promise.all([
      Investment.find(query)
        .populate('user', 'username email')
        .populate('product', 'name price duration')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Investment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        investments,
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        page: parseInt(page),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllInvestments };
