const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');

router.route('/')
  .get( protect, tenantGuard, getSuppliers)
  .post(protect, tenantGuard, authorize('admin','manager'), createSupplier);

router.route('/:id')
  .get(   protect, tenantGuard, getSupplier)
  .put(   protect, tenantGuard, authorize('admin','manager'), updateSupplier)
  .delete(protect, tenantGuard, authorize('admin'), deleteSupplier);

module.exports = router;