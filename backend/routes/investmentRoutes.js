const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { auth } = require('../middleware/auth');

router.post('/', auth, investmentController.purchaseProduct);
router.get('/', auth, investmentController.getUserInvestments);
router.get('/:id', auth, investmentController.getInvestmentById);

module.exports = router;
