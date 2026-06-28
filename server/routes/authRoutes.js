const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback — passport sets req.user via session
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  authController.googleCallback
);

// @route   GET /api/auth/me
// @desc    Get current user (JWT)
// @access  Private
router.get('/me', protect, authController.getMe);

module.exports = router;
