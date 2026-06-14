const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', auth, depositController.createDeposit);
router.post('/:id/proof', auth, upload.single('paymentProof'), depositController.uploadProof);
router.get('/', auth, depositController.getUserDeposits);
router.get('/:id', auth, depositController.getDepositById);

module.exports = router;
