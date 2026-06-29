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

// Chat contacts - all active users across all companies
router.get('/chat-contacts', protect, async (req, res) => {
  try {
    const User    = require('../models/User');
    const Company = require('../models/Company');
    const myId    = req.user.id;

    // Get all active users except current user
    const users = await User.find({
      _id: { $ne: myId },
      isActive: true
    })
    .select('name email avatar isOnline lastSeen role company')
    .populate('company', 'name nameEn')
    .sort({ isOnline: -1, name: 1 })
    .limit(200);

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
