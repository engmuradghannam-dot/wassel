const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {  } = require('../middleware/tenant');
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');

router.route('/')
  .get( protect, getPurchaseOrders)
  .post(protect, authorize('admin','manager'), createPurchaseOrder);

router.route('/:id')
  .get(   protect, getPurchaseOrder)
  .put(   protect, authorize('admin','manager'), updatePurchaseOrder)
  .delete(protect, authorize('admin'), deletePurchaseOrder);

router.put('/:id/receive', protect, authorize('admin','manager'), receivePurchaseOrder);

module.exports = router;