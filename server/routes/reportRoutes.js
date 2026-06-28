const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {  } = require('../middleware/tenant');
const { getDashboard, getInventoryReport, getPurchaseReport } = require('../controllers/reportController');

router.get('/dashboard', protect, getDashboard);
router.get('/inventory', protect, getInventoryReport);
router.get('/purchases', protect, getPurchaseReport);

module.exports = router;