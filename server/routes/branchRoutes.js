const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getBranches, getBranch, createBranch, updateBranch, deleteBranch
} = require('../controllers/branchController');

router.route('/')
  .get(protect, getBranches)
  .post(protect, authorize('admin', 'manager'), createBranch);

router.route('/:id')
  .get(protect, getBranch)
  .put(protect, authorize('admin', 'manager'), updateBranch)
  .delete(protect, authorize('admin'), deleteBranch);

module.exports = router;
