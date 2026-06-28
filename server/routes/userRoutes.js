const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getMe,
  createUser,
  updateUser,
  deleteUser,
  login,
  register,
  updateOnlineStatus
} = require('../controllers/userController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/', protect, authorize('admin'), getUsers);
router.post('/', protect, authorize('admin'), createUser);
router.get('/me', protect, getMe);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.put('/status/online', protect, updateOnlineStatus);

module.exports = router;
