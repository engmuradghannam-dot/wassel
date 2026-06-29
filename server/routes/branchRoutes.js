const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { checkPlanLimit } = require('../middleware/tenant');
const { getBranches, getBranch, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');

router.route('/')
  .get( protect, getBranches)
  .post(protect, authorize('admin','manager','superadmin'), createBranch);

router.route('/:id')
  .get(   protect, getBranch)
  .put(   protect, authorize('admin','manager','superadmin'), updateBranch)
  .delete(protect, authorize('admin','superadmin'), deleteBranch);

module.exports = router;