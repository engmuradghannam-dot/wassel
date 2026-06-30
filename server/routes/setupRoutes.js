const express = require('express');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router  = express.Router();

/**
 * ⚠️ أمان حرج: هذا المسار كان مفتوحاً بالكامل بدون أي مصادقة (Account Takeover
 * ممكن لأي شخص في العالم — يمكنه تغيير كلمة مرور أي بريد إلكتروني موجود في
 * النظام أو إنشاء حساب admin جديد). تم إغلاقه الآن خلف صلاحية superadmin فقط.
 */
router.post('/setup-admin', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success:false, message:'البريد وكلمة المرور مطلوبان' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      user.password = await bcrypt.hash(password, 12);
      user.isActive = true;
      await user.save();
      return res.json({ success:true, message:'تم تحديث المستخدم', user:{ email:user.email, name:user.name } });
    }

    user = await User.create({
      name: name || 'Admin User',
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12),
      role: 'admin',
      isOnline: false,
      isActive: true,
      language: 'ar',
    });

    res.json({ success:true, message:'تم إنشاء المستخدم', user:{ email:user.email, name:user.name } });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success:false, message:error.message });
  }
});

// ── إصلاح أدوار superadmin الذين يملكون شركة → يجب أن يكونوا owner ──────────
router.post('/fix-owner-role', protect, authorize('superadmin'), async (req, res) => {
  try {
    const users = await User.find({
      role: 'superadmin',
      company: { $exists: true, $ne: null }
    });

    const fixed = [];
    for (const u of users) {
      u.role = 'owner';
      await u.save();
      fixed.push({ email: u.email, company: u.company });
    }

    res.json({ success:true, message:`تم تحديث ${fixed.length} مستخدم`, fixed });
  } catch (e) {
    res.status(500).json({ success:false, message:e.message });
  }
});

module.exports = router;
