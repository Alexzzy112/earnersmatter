const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Investment = require('../models/Investment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const EarningSchedule = require('../models/EarningSchedule');
const Notification = require('../models/Notification');
const Referral = require('../models/Referral');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');
const { generateReference } = require('../utils/helpers');

const processDailyEarnings = async () => {
  let processedCount = 0;
  try {
    const investments = await Investment.find({
      status: 'active',
      nextEarningAt: { $lte: new Date() },
    }).populate('userId');

    for (const investment of investments) {
      try {
        const user = investment.userId;
        if (!user) continue;

        const dailyEarnings = investment.dailyEarnings;
        const now = new Date();
        const reference = generateReference();
        const balanceBefore = user.walletBalance;

        const transaction = await Transaction.create({
          userId: user._id,
          type: 'earning',
          amount: dailyEarnings,
          balanceBefore,
          balanceAfter: balanceBefore + dailyEarnings,
          description: `Daily earning for investment ${investment._id}`,
          reference,
          status: 'completed',
        });

        user.walletBalance += dailyEarnings;
        user.totalEarnings += dailyEarnings;
        await user.save();

        // Check for referral bonus (first earning only)
        if (investment.earningsReceived === 0) {
          const user_ = await User.findById(investment.userId).populate('referredBy');
          if (user_.referredBy) {
            const setting = await Setting.findOne({ key: 'referral_bonus_amount' });
            const bonusAmount = setting ? parseFloat(setting.value) : 5;
            user_.referredBy.walletBalance += bonusAmount;
            user_.referredBy.referralEarnings += bonusAmount;
            await user_.referredBy.save();

            await Transaction.create({
              userId: user_.referredBy._id,
              type: 'referral_bonus',
              amount: bonusAmount,
              balanceBefore: user_.referredBy.walletBalance - bonusAmount,
              balanceAfter: user_.referredBy.walletBalance,
              description: `Referral bonus for ${user_.username}'s first investment`,
              reference: generateReference(),
              status: 'completed'
            });

            await Referral.findOneAndUpdate(
              { referrerId: user_.referredBy._id, referredUserId: user_._id },
              { bonusAmount, status: 'paid' }
            );
          }
        }

        investment.earningsReceived += dailyEarnings;
        investment.lastEarningAt = now;
        investment.nextEarningAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const endDate = investment.endDate;
        let investmentCompleted = false;
        if (endDate && endDate <= now) {
          investment.status = 'completed';
          investmentCompleted = true;
        }
        await investment.save();

        const startDate = investment.startDate;
        const dayNumber = Math.floor((now - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1;

        await EarningSchedule.create({
          investmentId: investment._id,
          dayNumber,
          amount: dailyEarnings,
          status: 'paid',
          scheduledDate: now,
          paidAt: now,
        });

        await Notification.create({
          userId: user._id,
          type: 'earning_credited',
          title: 'Daily Earning Credited',
          message: `${dailyEarnings.toFixed(2)} has been credited to your wallet.`,
        });

        if (investmentCompleted) {
          await Notification.create({
            userId: user._id,
            type: 'investment_completed',
            title: 'Investment Completed',
            message: `Your investment has been completed. Total earnings: ${investment.earningsReceived.toFixed(2)}`,
          });
        }

        await AuditLog.create({
          userId: user._id,
          action: 'daily_earning_credited',
          entityType: 'Investment',
          entityId: investment._id,
          details: {
            amount: dailyEarnings,
            balanceAfter: user.walletBalance,
            transactionId: transaction._id,
          },
        });

        processedCount++;
      } catch (innerError) {
        console.error(`Error processing investment ${investment._id}:`, innerError.message);
      }
    }
  } catch (error) {
    console.error('Error processing daily earnings:', error.message);
  }
  return processedCount;
};

cron.schedule('0 * * * *', () => {
  console.log('Running daily earnings cron job...');
  processDailyEarnings()
    .then((count) => console.log(`Processed ${count} earnings.`))
    .catch((err) => console.error('Cron job failed:', err.message));
});

if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB()
    .then(() => {
      console.log('Starting daily earnings processing...');
      return processDailyEarnings();
    })
    .then((count) => {
      console.log(`Processed ${count} earnings.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { processDailyEarnings };
