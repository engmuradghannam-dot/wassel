const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers, getMe, createUser, updateUser, deleteUser,
  login, register, updateOnlineStatus
} = require('../controllers/userController');
const User    = require('../models/User');
const Company = require('../models/Company');

// ── Public ──────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Me (before /:id) ────────────────────────────────────────────────────
router.get('/me',            protect, getMe);
router.put('/status/online', protect, updateOnlineStatus);

// ── Chat contacts — all users across all companies ───────────────────────
router.get('/chat-contacts', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id }, isActive: true })
      .select('name email avatar isOnline lastSeen role company')
      .populate('company', 'name nameEn')
      .sort({ isOnline: -1, name: 1 })
      .limit(200);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Users CRUD (admin + superadmin) ────────────────────────────────────
router.get('/',    protect, authorize('admin', 'superadmin'), getUsers);
router.post('/',   protect, authorize('admin', 'superadmin'), createUser);
router.put('/:id', protect, authorize('admin', 'superadmin'), updateUser);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteUser);

module.exports = router;
