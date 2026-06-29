const User    = require('../models/User');
const Company = require('../models/Company');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, company: user.company }, JWT_SECRET, { expiresIn: '365d' });

// ─── Register (إنشاء شركة + admin في خطوة واحدة) ──────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName, companyNameEn } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    // Check email unique globally
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // 1. Create company
    const company = await Company.create({
      name: companyName,
      nameEn: companyNameEn || companyName,
      currency: 'SAR',
      timezone: 'Asia/Riyadh',
      plan: 'trial',
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
      maxUsers: 10,
      maxEmployees: 50,
      maxBranches: 3
    });

    // 2. First user ever = superadmin, otherwise admin
    const isFirstUser = (await User.countDocuments()) === 0;
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed,
      role: isFirstUser ? 'superadmin' : 'admin',
      company: company._id,
      language: 'ar',
      isActive: true, isOnline: true, lastSeen: new Date(),
      permissions: []
    });

    // 3. Link owner to company
    await Company.findByIdAndUpdate(company._id, { owner: user._id, createdBy: user._id });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: isFirstUser ? 'تم إنشاء الحساب كمشرف عام بنجاح' : 'تم إنشاء الشركة والحساب بنجاح',
      token,
      data: {
        user:    { ...user.toObject(), password: undefined },
        company: { _id: company._id, name: company.name, plan: company.plan, planExpiresAt: company.planExpiresAt }
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Login ────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('company', 'name plan planExpiresAt isActive isSuspended logo currency');
    if (!user) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

    if (!user.isActive) return res.status(401).json({ success: false, message: 'الحساب موقوف' });

    // Check company status (skip for superadmin)
    if (user.role !== 'superadmin' && user.company) {
      if (user.company.isSuspended) {
        return res.status(403).json({ success: false, message: 'الشركة موقوفة. تواصل مع الدعم.' });
      }
      if (!user.company.isActive) {
        return res.status(403).json({ success: false, message: 'حساب الشركة غير نشط.' });
      }
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = signToken(user);

    const userData = { ...user.toObject(), password: undefined };
    res.json({
      success: true, token,
      data:    { user: userData, company: user.company },
      user:    userData  // top-level for compatibility
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get current user ─────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company', 'name nameEn logo currency plan planExpiresAt maxUsers maxEmployees maxBranches');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get users in same company ────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const filter = req.user.role === 'superadmin' && req.query.companyId
      ? { company: req.query.companyId }
      : { company: req.user.company };

    const users = await User.find(filter).select('-password').sort({ name: 1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Create user inside same company ─────────────────────
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role: regular admin can't create superadmin
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'غير مسموح بإنشاء superadmin' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role,
      company: req.user.role === 'superadmin' ? (req.body.company || null) : req.user.company
    });

    const token = signToken(user);
    res.status(201).json({ success: true, data: { ...user.toObject(), password: undefined }, token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Update user ──────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    if (password) rest.password = await bcrypt.hash(password, 10);

    // Scope: regular admin can only update users in same company
    const scopeFilter = req.user.role === 'superadmin'
      ? { _id: req.params.id }
      : { _id: req.params.id, company: req.user.company };

    const user = await User.findOneAndUpdate(scopeFilter, rest, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Delete user ──────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك' });
    }
    const scopeFilter = req.user.role === 'superadmin'
      ? { _id: req.params.id }
      : { _id: req.params.id, company: req.user.company };

    const user = await User.findOneAndDelete(scopeFilter);
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Update online status ─────────────────────────────────
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    await User.findByIdAndUpdate(req.user.id, { isOnline, lastSeen: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
