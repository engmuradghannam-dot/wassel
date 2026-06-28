const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkPlanLimit } = require('../middleware/tenant');
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getDepartments } = require('../controllers/employeeController');

router.get('/departments', protect, getDepartments);

router.route('/')
  .get( protect, getEmployees)
  .post(protect, authorize('admin','manager'), createEmployee);

router.route('/:id')
  .get(   protect, getEmployee)
  .put(   protect, authorize('admin','manager'), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

module.exports = router;