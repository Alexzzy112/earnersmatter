const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { adminMiddleware } = require('../../middleware/admin');

const adminDashboardController = require('../../controllers/admin/adminDashboardController');
const adminUserController = require('../../controllers/admin/adminUserController');
const adminDepositController = require('../../controllers/admin/adminDepositController');
const adminWithdrawalController = require('../../controllers/admin/adminWithdrawalController');
const adminProductController = require('../../controllers/admin/adminProductController');
const adminPaymentAccountController = require('../../controllers/admin/adminPaymentAccountController');
const adminEarningController = require('../../controllers/admin/adminEarningController');
const adminInvestmentController = require('../../controllers/admin/adminInvestmentController');
const adminReportController = require('../../controllers/admin/adminReportController');
const adminAuditLogController = require('../../controllers/admin/adminAuditLogController');
const adminSettingsController = require('../../controllers/admin/adminSettingsController');
const adminNotificationController = require('../../controllers/admin/adminNotificationController');
const adminTaskController = require('../../controllers/admin/adminTaskController');
const adminReseedController = require('../../controllers/admin/adminReseedController');
const adminResetProductsController = require('../../controllers/admin/adminResetProductsController');

router.use(auth, adminMiddleware);

// Dashboard
router.get('/dashboard', adminDashboardController.getDashboardStats);
router.get('/recent-activity', adminDashboardController.getRecentActivity);

// Users
router.get('/users', adminUserController.getUsers);
router.get('/users/:id', adminUserController.getUserById);
router.put('/users/:id', adminUserController.updateUser);
router.put('/users/:id/suspend', adminUserController.suspendUser);
router.put('/users/:id/activate', adminUserController.activateUser);
router.delete('/users/:id', adminUserController.deleteUser);

// Deposits
router.get('/deposits', adminDepositController.getAllDeposits);
router.get('/deposits/:id', adminDepositController.getDepositById);
router.post('/deposits/manual-credit', adminDepositController.manualCredit);
router.put('/deposits/:id/approve', adminDepositController.approveDeposit);
router.put('/deposits/:id/reject', adminDepositController.rejectDeposit);
router.delete('/deposits/:id', adminDepositController.deleteDeposit);

// Withdrawals
router.get('/withdrawals', adminWithdrawalController.getAllWithdrawals);
router.get('/withdrawals/:id', adminWithdrawalController.getWithdrawalById);
router.put('/withdrawals/:id/approve', adminWithdrawalController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminWithdrawalController.rejectWithdrawal);
router.put('/withdrawals/:id/complete', adminWithdrawalController.completeWithdrawal);
router.put('/withdrawals/:id/revert', adminWithdrawalController.revertWithdrawal);
router.post('/withdrawals/revert-all', adminWithdrawalController.revertAllWithdrawals);
router.delete('/withdrawals/:id', adminWithdrawalController.deleteWithdrawal);
router.post('/withdrawals/delete-all', adminWithdrawalController.deleteAllWithdrawals);

// Products
router.get('/products', adminProductController.getAllProducts);
router.post('/products', adminProductController.createProduct);
router.put('/products/:id', adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);
router.put('/products/:id/toggle', adminProductController.toggleProductStatus);
router.post('/products/reset', adminResetProductsController.resetProducts);

// Payment Accounts
router.get('/payment-accounts', adminPaymentAccountController.getAllAccounts);
router.post('/payment-accounts', adminPaymentAccountController.createAccount);
router.put('/payment-accounts/:id', adminPaymentAccountController.updateAccount);
router.put('/payment-accounts/:id/activate', adminPaymentAccountController.activateAccount);
router.put('/payment-accounts/:id/deactivate', adminPaymentAccountController.deactivateAccount);
router.put('/payment-accounts/:id/default', adminPaymentAccountController.setDefaultAccount);
router.get('/payment-accounts/switch-history', adminPaymentAccountController.getSwitchHistory);

// Investments
router.get('/investments', adminInvestmentController.getAllInvestments);

// Earnings
router.get('/earnings/schedules', adminEarningController.getEarningSchedules);
router.get('/earnings', adminEarningController.getAllEarnings);
router.post('/earnings/run-manual', adminEarningController.runManualEarning);

// Reports
router.get('/reports/transactions', adminReportController.getTransactionStats);
router.get('/reports/deposits', adminReportController.getDepositReport);
router.get('/reports/withdrawals', adminReportController.getWithdrawalReport);
router.get('/reports/earnings', adminReportController.getEarningsReport);
router.get('/reports/export', adminReportController.exportReport);

// Audit Logs
router.get('/audit-logs', adminAuditLogController.getAuditLogs);

// Settings
router.get('/settings', adminSettingsController.getSettings);
router.put('/settings/:key', adminSettingsController.updateSetting);

// Notifications
router.get('/notifications/users', adminNotificationController.getUsersForNotification);
router.post('/notifications/send', adminNotificationController.sendNotification);

// Tasks
router.get('/tasks', adminTaskController.getAllTasks);
router.post('/tasks', adminTaskController.createTask);
router.put('/tasks/:id', adminTaskController.updateTask);
router.delete('/tasks/:id', adminTaskController.deleteTask);
router.post('/tasks/generate', adminTaskController.generateTasks);
router.post('/tasks/reset', adminTaskController.resetTasks);

// Reseed
router.post('/reseed', adminReseedController.reseed);

module.exports = router;
