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

    // ── New user with no company → send to company setup ──────────────
    const needsSetup = !user.company;
    const isNewUser  = !user.company && user.role === 'user';  // freshly created by Google

    if (needsSetup) {
      // Mark as new so frontend shows setup wizard
      return res.redirect(`${clientUrl}/auth/callback?token=${token}&newUser=true`);
    }

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
      .populate('company', 'name nameEn logo currency plan planExpiresAt industry city dataSeeded');

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.json({ success: true, data: user });

    // ── توليد بيانات تجريبية تلقائياً لشركات موجودة من قبل هذا النظام
    // (لن يتكرر أبداً — autoSeedCompanyData يضبط dataSeeded=true فوراً
    // كأول خطوة، فحتى لو جاء طلبين متزامنين ما يُشغَّل مرتين) ─────────
    if (user.company?._id && !user.company.dataSeeded && ['owner','admin','superadmin'].includes(user.role)) {
      const { autoSeedCompanyData } = require('../services/autoSeedCompany');
      autoSeedCompanyData(user.company._id, user._id)
        .catch(err => console.error('[getMe] auto-seed background error:', err.message));
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
