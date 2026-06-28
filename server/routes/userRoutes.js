const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { tenantGuard, checkPlanLimit } = require('../middleware/tenant');
const {
  register, login, getMe,
  getUsers, getUser, createUser, updateUser, deleteUser,
  updateOnlineStatus
} = require('../controllers/userController');

// Public
router.post('/register', register);
router.post('/login',    login);

// Private — current user
router.get('/me',      protect, getMe);
router.put('/status',  protect, updateOnlineStatus);

// Private — user management (scoped to company)
router.route('/')
  .get( protect, tenantGuard, getUsers)
  .post(protect, tenantGuard, authorize('admin'), checkPlanLimit('users'), createUser);

router.route('/:id')
  .get(   protect, tenantGuard, getUser)
  .put(   protect, tenantGuard, authorize('admin'), updateUser)
  .delete(protect, tenantGuard, authorize('admin'), deleteUser);

module.exports = router;
