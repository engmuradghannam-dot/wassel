const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const { getItems, getItem, createItem, updateItem, deleteItem, adjustStock, getLowStock } = require('../controllers/inventoryController');

router.get('/low-stock', protect, tenantGuard, getLowStock);

router.route('/')
  .get( protect, tenantGuard, getItems)
  .post(protect, tenantGuard, authorize('admin','manager'), createItem);

router.route('/:id')
  .get(   protect, tenantGuard, getItem)
  .put(   protect, tenantGuard, authorize('admin','manager'), updateItem)
  .delete(protect, tenantGuard, authorize('admin'), deleteItem);

router.put('/:id/adjust', protect, tenantGuard, authorize('admin','manager'), adjustStock);

module.exports = router;