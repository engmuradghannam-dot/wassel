const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {  } = require('../middleware/tenant');
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');

router.route('/')
  .get( protect, getSuppliers)
  .post(protect, authorize('admin','manager'), createSupplier);

router.route('/:id')
  .get(   protect, getSupplier)
  .put(   protect, authorize('admin','manager'), updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;