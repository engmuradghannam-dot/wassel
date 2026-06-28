const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRoles, getRole, createRole, updateRole, deleteRole
} = require('../controllers/roleController');

router.route('/')
  .get(protect, getRoles)
  .post(protect, authorize('admin'), createRole);

router.route('/:id')
  .get(protect, getRole)
  .put(protect, authorize('admin'), updateRole)
  .delete(protect, authorize('admin'), deleteRole);

module.exports = router;
