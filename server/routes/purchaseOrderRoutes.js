const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {  } = require('../middleware/tenant');
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');

router.route('/')
  .get( protect, getPurchaseOrders)
  .post(protect, authorize('owner','admin','manager'), createPurchaseOrder);

router.route('/:id')
  .get(   protect, getPurchaseOrder)
  .put(   protect, authorize('owner','admin','manager'), updatePurchaseOrder)
  .delete(protect, authorize('owner','admin'), deletePurchaseOrder);

router.put('/:id/receive', protect, authorize('owner','admin','manager'), receivePurchaseOrder);

module.exports = router;