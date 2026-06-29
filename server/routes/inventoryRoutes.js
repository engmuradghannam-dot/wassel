const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {  } = require('../middleware/tenant');
const { getItems, getItem, createItem, updateItem, deleteItem, adjustStock, getLowStock } = require('../controllers/inventoryController');

router.get('/low-stock', protect, getLowStock);

router.route('/')
  .get( protect, getItems)
  .post(protect, authorize('owner','admin','manager'), createItem);

router.route('/:id')
  .get(   protect, getItem)
  .put(   protect, authorize('owner','admin','manager'), updateItem)
  .delete(protect, authorize('owner','admin'), deleteItem);

router.put('/:id/adjust', protect, authorize('owner','admin','manager'), adjustStock);

module.exports = router;