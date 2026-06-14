const Investment = require('../models/Investment');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const helpers = require('../utils/helpers');
const { logAction } = require('../utils/auditLogger');

const purchaseProduct = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Product is not available' });
    }

    const totalCost = product.price * quantity;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.walletBalance < totalCost) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + product.duration);
    const nextEarningAt = new Date(now);
    nextEarningAt.setHours(nextEarningAt.getHours() + 24);

    user.walletBalance -= totalCost;
    user.totalInvestments += totalCost;
    await user.save();

    const investment = await Investment.create({
      userId: req.user._id,
      productId: product._id,
      quantity,
      totalCost,
      dailyEarnings: product.dailyEarnings * quantity,
      startDate: now,
      endDate,
      nextEarningAt,
    });

    await Transaction.create({
      userId: req.user._id,
      type: 'investment',
      amount: totalCost,
      balanceBefore: user.walletBalance + totalCost,
      balanceAfter: user.walletBalance,
      status: 'completed',
      reference: helpers.generateReference(),
    });

    await logAction({
      userId: req.user._id,
      action: 'product_purchased',
      entityType: 'Investment',
      entityId: investment._id,
      details: { productId, quantity, totalCost },
      req,
    });

    await Notification.create({
      userId: user._id,
      type: 'product_purchase',
      title: 'Product Purchased',
      message: `You have successfully purchased ${product.name}${quantity > 1 ? ` (x${quantity})` : ''} for $${(product.price * quantity).toFixed(2)}.`
    });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: investment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.user._id })
      .populate('productId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: investments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInvestmentById = async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user._id }).populate('productId');
    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment not found' });
    }

    res.status(200).json({ success: true, data: investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  purchaseProduct,
  getUserInvestments,
  getInvestmentById,
};
