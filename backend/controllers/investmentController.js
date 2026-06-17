const Investment = require('../models/Investment');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Referral = require('../models/Referral');
const Setting = require('../models/Setting');
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
      message: `You have successfully purchased ${product.name}${quantity > 1 ? ` (x${quantity})` : ''} for ₦${(product.price * quantity).toLocaleString()}.`
    });

    // Referral bonus on product purchase
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        const [bonusSetting, typeSetting] = await Promise.all([
          Setting.findOne({ key: 'referralBonus' }),
          Setting.findOne({ key: 'bonusType' }),
        ]);
        const bonusType = typeSetting?.value || 'fixed';
        const bonusValue = Number(bonusSetting?.value) || 1000;
        const bonusAmount = bonusType === 'percentage'
          ? Math.round(totalCost * (bonusValue / 100))
          : Math.round(bonusValue);
        if (bonusAmount > 0) {
          referrer.walletBalance += bonusAmount;
          referrer.referralEarnings += bonusAmount;
          await referrer.save();

          await Transaction.create({
            userId: referrer._id,
            type: 'referral_bonus',
            amount: bonusAmount,
            balanceBefore: referrer.walletBalance - bonusAmount,
            balanceAfter: referrer.walletBalance,
            description: `Referral bonus for ${user.username}'s purchase of ${product.name}`,
            reference: helpers.generateReference(),
            status: 'completed',
          });

          await Notification.create({
            userId: referrer._id,
            type: 'referral_bonus',
            title: 'Referral Bonus Credited',
            message: `You earned ₦${bonusAmount.toLocaleString()} referral bonus from ${user.username}'s purchase`,
          });

          await Referral.findOneAndUpdate(
            { referrerId: referrer._id, referredUserId: user._id },
            { bonusAmount, status: 'paid' },
            { upsert: true }
          );
        }
      }
    }

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
