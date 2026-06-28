const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, company: user.company },
    process.env.JWT_SECRET, { expiresIn: '365d' });

// ─── Google OAuth Callback ────────────────────────────────────────────────
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, profile) => {
    if (err || !profile) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Create new user from Google profile
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          role: 'user',
          isActive: true,
          isOnline: true,
          lastSeen: new Date()
        });
      }

      const token = signToken(user);

      // Redirect to frontend with token
      res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google auth error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  })(req, res, next);
};

// ─── Get current user ─────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company', 'name nameEn logo currency plan planExpiresAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
