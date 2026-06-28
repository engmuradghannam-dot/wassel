const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const {
  getPlans, initiatePayment, paymentCallback,
  manualActivate, getMyPayments, getAllPayments, refundPayment
} = require('../controllers/paymentController');

// Public — view plans
router.get('/plans', getPlans);

// Gateway webhook (no auth — verify via gateway signature in production)
router.post('/callback', paymentCallback);

// Private — company users
router.post('/initiate',  protect, tenantGuard, initiatePayment);
router.get('/my',         protect, tenantGuard, getMyPayments);

// SuperAdmin only
router.get('/all',              protect, authorize('superadmin'), getAllPayments);
router.post('/manual-activate', protect, authorize('superadmin'), manualActivate);
router.put('/:id/refund',       protect, authorize('superadmin'), refundPayment);

module.exports = router;
