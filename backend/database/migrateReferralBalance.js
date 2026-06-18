const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ referralEarnings: { $gt: 0 } });
    console.log(`Found ${users.length} users with referral earnings`);

    let totalMoved = 0;
    let usersUpdated = 0;

    for (const user of users) {
      const totalReferralWithdrawn = await Withdrawal.aggregate([
        { $match: { userId: user._id, withdrawalType: 'referral_bonus', status: { $in: ['pending', 'approved', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const alreadyWithdrawn = totalReferralWithdrawn.length > 0 ? totalReferralWithdrawn[0].total : 0;
      const availableReferral = (user.referralEarnings || 0) - alreadyWithdrawn;

      if (availableReferral <= 0) continue;

      const moveAmount = Math.min(availableReferral, user.walletBalance);
      if (moveAmount <= 0) continue;

      user.walletBalance -= moveAmount;
      user.referralBalance += moveAmount;
      await user.save();

      totalMoved += moveAmount;
      usersUpdated++;
      console.log(`  ${user.username || user.email}: moved ₦${moveAmount.toLocaleString()} (available: ₦${availableReferral.toLocaleString()})`);
    }

    console.log(`\nDone! Updated ${usersUpdated} users, moved ₦${totalMoved.toLocaleString()} total.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
