const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const { getDashboard, getInventoryReport, getPurchaseReport } = require('../controllers/reportController');

router.get('/dashboard', protect, tenantGuard, getDashboard);
router.get('/inventory', protect, tenantGuard, getInventoryReport);
router.get('/purchases', protect, tenantGuard, getPurchaseReport);

module.exports = router;