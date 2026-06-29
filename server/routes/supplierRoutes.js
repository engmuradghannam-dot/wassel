const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier
} = require('../controllers/supplierController');

router.route('/')
  .get( protect, getSuppliers)
  .post(protect, createSupplier);          // owner/admin/superadmin all pass

router.route('/:id')
  .get(   protect, getSupplier)
  .put(   protect, updateSupplier)
  .delete(protect, authorize('owner','admin','superadmin'), deleteSupplier);

module.exports = router;
