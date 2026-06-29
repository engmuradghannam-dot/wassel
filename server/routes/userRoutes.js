const express  = require('express');
const router   = express.Router();
const {
  register, login, getMe, getUsers, createUser, updateUser, deleteUser, updateOnlineStatus
} = require('../controllers/userController');
const { protect, authorize, getCompany } = require('../middleware/auth');

// ── Public ─────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Protected ──────────────────────────────────────────────────────────────
router.get('/me',            protect, getMe);
router.put('/status/online', protect, updateOnlineStatus);

// ── Chat contacts — all users across companies (for cross-company chat) ────
router.get('/chat-contacts', protect, async (req, res) => {
  try {
    const User    = require('../models/User');
    const co      = getCompany(req);
    const search  = req.query.search;
    
    // Build query: exclude current user
    const query = { _id: { $ne: req.user._id }, isActive: true };
    if (search) {
      const q = new RegExp(search, 'i');
      query.$or = [{ name:q }, { email:q }];
    }
    
    const users = await User.find(query)
      .select('name email avatar isOnline lastSeen company role')
      .populate('company', 'name industry')
      .limit(100)
      .sort({ isOnline:-1, name:1 });
    
    res.json({ success:true, count:users.length, data:users });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── Company user management ────────────────────────────────────────────────
// owner/admin can manage users in their OWN company
// superadmin can manage everyone
router.get('/',    protect, getUsers);
router.post('/',   protect, createUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('owner','admin','superadmin'), deleteUser);

module.exports = router;
