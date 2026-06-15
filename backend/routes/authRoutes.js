const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/profile', auth, authController.updateProfile);
router.put('/bank-account', auth, authController.updateBankAccount);
router.put('/change-password', auth, authController.changePassword);
router.post('/send-verification-email', auth, authController.sendVerificationEmail);
router.post('/verify-email', auth, authController.verifyEmail);

module.exports = router;
