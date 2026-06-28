const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');

router.route('/')
  .get( protect, tenantGuard, getPurchaseOrders)
  .post(protect, tenantGuard, authorize('admin','manager'), createPurchaseOrder);

router.route('/:id')
  .get(   protect, tenantGuard, getPurchaseOrder)
  .put(   protect, tenantGuard, authorize('admin','manager'), updatePurchaseOrder)
  .delete(protect, tenantGuard, authorize('admin'), deletePurchaseOrder);

router.put('/:id/receive', protect, tenantGuard, authorize('admin','manager'), receivePurchaseOrder);

module.exports = router;