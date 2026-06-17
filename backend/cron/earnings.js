const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Investment = require('../models/Investment');
const EarningSchedule = require('../models/EarningSchedule');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const processInvestmentCycles = async () => {
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
        const startDate = investment.startDate;
        const dayNumber = Math.floor((now - new Date(startDate)) / (24 * 60 * 60 * 1000)) + 1;

        const existingSchedule = await EarningSchedule.findOne({
          investmentId: investment._id,
          dayNumber,
        });

        if (!existingSchedule) {
          await EarningSchedule.create({
            investmentId: investment._id,
            dayNumber,
            amount: dailyEarnings,
            status: 'pending',
            scheduledDate: now,
          });
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

        if (investmentCompleted) {
          await Notification.create({
            userId: user._id,
            type: 'investment_completed',
            title: 'Investment Completed',
            message: `Your investment has been completed. Complete your pending tasks to claim remaining earnings. Total earnings: ${investment.earningsReceived.toFixed(2)}`,
          });
        }

        await AuditLog.create({
          userId: user._id,
          action: 'earning_day_available',
          entityType: 'Investment',
          entityId: investment._id,
          details: {
            amount: dailyEarnings,
            dayNumber,
            status: 'pending_tasks',
          },
        });

        processedCount++;
      } catch (innerError) {
        console.error(`Error processing investment ${investment._id}:`, innerError.message);
      }
    }
  } catch (error) {
    console.error('Error processing investment cycles:', error.message);
  }
  return processedCount;
};

cron.schedule('0 * * * *', () => {
  console.log('Running investment cycle cron job...');
  processInvestmentCycles()
    .then((count) => console.log(`Processed ${count} investment cycles.`))
    .catch((err) => console.error('Cron job failed:', err.message));
});

if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB()
    .then(() => {
      console.log('Starting investment cycle processing...');
      return processInvestmentCycles();
    })
    .then((count) => {
      console.log(`Processed ${count} investment cycles.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { processInvestmentCycles };
