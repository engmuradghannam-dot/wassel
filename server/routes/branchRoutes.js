const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard, checkPlanLimit } = require('../middleware/tenant');
const { getBranches, getBranch, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');

router.route('/')
  .get( protect, tenantGuard, getBranches)
  .post(protect, tenantGuard, authorize('admin','manager'), checkPlanLimit('branches'), createBranch);

router.route('/:id')
  .get(   protect, tenantGuard, getBranch)
  .put(   protect, tenantGuard, authorize('admin','manager'), updateBranch)
  .delete(protect, tenantGuard, authorize('admin'), deleteBranch);

module.exports = router;