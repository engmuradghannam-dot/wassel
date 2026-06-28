const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers, getUser, createUser, updateUser, deleteUser, login, updateOnlineStatus, register
} = require('../controllers/userController');

// @route   POST /api/users/register
// @desc    Register new company/user (Public)
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user
// @access  Public
router.post('/login', login);

router.route('/')
  .get(protect, getUsers)
  .post(protect, authorize('admin'), createUser);

router.put('/status', protect, updateOnlineStatus);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
