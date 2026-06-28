const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, deleteWarehouse } = require('../controllers/warehouseController');

router.route('/')
  .get( protect, tenantGuard, getWarehouses)
  .post(protect, tenantGuard, authorize('admin','manager'), createWarehouse);

router.route('/:id')
  .get(   protect, tenantGuard, getWarehouse)
  .put(   protect, tenantGuard, authorize('admin','manager'), updateWarehouse)
  .delete(protect, tenantGuard, authorize('admin'), deleteWarehouse);

module.exports = router;