const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, company: user.company },
    process.env.JWT_SECRET, { expiresIn: '365d' });

// ─── Google OAuth Callback ─────────────────────────────────────────────────
// At this point passport has already authenticated & set req.user
exports.googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
    }

    const user = req.user;
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = signToken(user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google auth error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?error=auth_failed`);
  }
};

// ─── Get current user ──────────────────────────────────────────────────────
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
