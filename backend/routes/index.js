const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { maintenanceMode } = require('../middleware/maintenance');

const authRoutes = require('./authRoutes');
const walletRoutes = require('./walletRoutes');
const depositRoutes = require('./depositRoutes');
const withdrawalRoutes = require('./withdrawalRoutes');
const productRoutes = require('./productRoutes');
const investmentRoutes = require('./investmentRoutes');
const earningRoutes = require('./earningRoutes');
const referralRoutes = require('./referralRoutes');
const notificationRoutes = require('./notificationRoutes');
const paymentAccountRoutes = require('./paymentAccountRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const settingsRoutes = require('./settingsRoutes');
const taskRoutes = require('./taskRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const adminRoutes = require('./admin/adminRoutes');

router.use('/auth', authRoutes);
router.use('/wallet', maintenanceMode, walletRoutes);
router.use('/deposits', maintenanceMode, depositRoutes);
router.use('/withdrawals', maintenanceMode, withdrawalRoutes);
router.use('/products', productRoutes);
router.use('/investments', maintenanceMode, investmentRoutes);
router.use('/earnings', maintenanceMode, earningRoutes);
router.use('/referrals', maintenanceMode, referralRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payment-account', paymentAccountRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/tasks', maintenanceMode, taskRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', auth, adminMiddleware, adminRoutes);

module.exports = router;
