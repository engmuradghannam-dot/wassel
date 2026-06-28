const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse
} = require('../controllers/warehouseController');

router.route('/')
  .get(protect, getWarehouses)
  .post(protect, authorize('admin', 'manager'), createWarehouse);

router.route('/:id')
  .get(protect, getWarehouse)
  .put(protect, authorize('admin', 'manager'), updateWarehouse)
  .delete(protect, authorize('admin'), deleteWarehouse);

module.exports = router;
