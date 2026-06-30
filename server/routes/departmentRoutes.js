const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

router.route('/')
  .get( protect, getDepartments)
  .post(protect, authorize('owner','admin','manager'), createDepartment);

router.route('/:id')
  .get(   protect, getDepartment)
  .put(   protect, authorize('owner','admin','manager'), updateDepartment)
  .delete(protect, authorize('owner','admin'), deleteDepartment);

module.exports = router;
