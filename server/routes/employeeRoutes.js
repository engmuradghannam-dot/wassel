const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard, checkPlanLimit } = require('../middleware/tenant');
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getDepartments } = require('../controllers/employeeController');

router.get('/departments', protect, tenantGuard, getDepartments);

router.route('/')
  .get( protect, tenantGuard, getEmployees)
  .post(protect, tenantGuard, authorize('admin','manager'), checkPlanLimit('employees'), createEmployee);

router.route('/:id')
  .get(   protect, tenantGuard, getEmployee)
  .put(   protect, tenantGuard, authorize('admin','manager'), updateEmployee)
  .delete(protect, tenantGuard, authorize('admin'), deleteEmployee);

module.exports = router;