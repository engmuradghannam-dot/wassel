const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getItems, getItem, createItem, updateItem, deleteItem, adjustStock, getLowStock
} = require('../controllers/inventoryController');

router.get('/low-stock', protect, getLowStock);

router.route('/')
  .get(protect, getItems)
  .post(protect, authorize('admin', 'manager'), createItem);

router.route('/:id')
  .get(protect, getItem)
  .put(protect, authorize('admin', 'manager'), updateItem)
  .delete(protect, authorize('admin'), deleteItem);

router.put('/:id/stock', protect, authorize('admin', 'manager'), adjustStock);

module.exports = router;
