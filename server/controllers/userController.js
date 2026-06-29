const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Company = require('../models/Company');

const JWT_SECRET = process.env.JWT_SECRET || 'wassel-secret';
const signToken  = (user) =>
  jwt.sign({ id: user._id, role: user.role, company: user.company }, JWT_SECRET, { expiresIn: '365d' });

// ─── Validate Saudi CR number (10 digits) ──────────────────────────────────
const isValidCR = (cr) => /^\d{10}$/.test(cr?.replace(/\s/g,''));

// ─── Validate Saudi VAT number (15 digits, starts with 3) ─────────────────
const isValidVAT = (vat) => /^3\d{14}$/.test(vat?.replace(/\s/g,''));

// ════════════════════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════════════════════
exports.register = async (req, res) => {
  try {
    const {
      name, email, password,
      companyName, companyNameEn,
      industry,
      commercialReg,   // رقم السجل التجاري الموحد
      vatNumber,       // رقم ضريبة القيمة المضافة
      plan,
      phone, city, country
    } = req.body;

    // ── Required fields ────────────────────────────────────────────────────
    if (!name?.trim())        return res.status(400).json({ success:false, message:'الاسم مطلوب' });
    if (!email?.trim())       return res.status(400).json({ success:false, message:'البريد الإلكتروني مطلوب' });
    if (!password)            return res.status(400).json({ success:false, message:'كلمة المرور مطلوبة' });
    if (!companyName?.trim()) return res.status(400).json({ success:false, message:'اسم الشركة مطلوب' });
    if (!industry)            return res.status(400).json({ success:false, message:'القطاع التجاري مطلوب' });

    // ── CR validation ──────────────────────────────────────────────────────
    const crClean = commercialReg?.replace(/\s|-/g,'');
    if (!crClean)             return res.status(400).json({ success:false, message:'رقم السجل التجاري الموحد مطلوب' });
    if (!isValidCR(crClean))  return res.status(400).json({ success:false, message:'رقم السجل التجاري يجب أن يكون 10 أرقام' });

    // ── VAT validation ─────────────────────────────────────────────────────
    const vatClean = vatNumber?.replace(/\s/g,'');
    if (!vatClean)            return res.status(400).json({ success:false, message:'الرقم الضريبي (VAT) مطلوب' });
    if (!isValidVAT(vatClean)) return res.status(400).json({ success:false, message:'الرقم الضريبي يجب أن يبدأ بـ 3 ويكون 15 رقماً' });

    // ── Email unique ───────────────────────────────────────────────────────
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success:false, message:'البريد الإلكتروني مسجّل مسبقاً' });
    }

    // ── CR unique ──────────────────────────────────────────────────────────
    const existingCR = await Company.findOne({ commercialReg: crClean });
    if (existingCR) {
      return res.status(400).json({ success:false, message:'رقم السجل التجاري مسجّل مسبقاً في النظام' });
    }

    // ── VAT unique ─────────────────────────────────────────────────────────
    const existingVAT = await Company.findOne({ vatNumber: vatClean });
    if (existingVAT) {
      return res.status(400).json({ success:false, message:'الرقم الضريبي مسجّل مسبقاً في النظام' });
    }

    // ── Plan limits ────────────────────────────────────────────────────────
    const planLimits = { trial:10, starter:25, professional:100, enterprise:500 };
    const planKey    = plan || 'trial';

    // ── 1. Create Company ──────────────────────────────────────────────────
    const company = await Company.create({
      name:         companyName.trim(),
      nameEn:       companyNameEn || companyName.trim(),
      industry:     industry,
      commercialReg: crClean,
      vatNumber:    vatClean,
      currency:     'SAR',
      timezone:     'Asia/Riyadh',
      country:      country || 'SA',
      city:         city || 'الرياض',
      phone,
      plan:         planKey,
      planExpiresAt: new Date(Date.now() + 30*24*60*60*1000),
      maxUsers:     planLimits[planKey] || 10,
      maxBranches:  3,
      onboarding:   { completed: false, step: 0 }
    });

    // ── 2. Create User ─────────────────────────────────────────────────────
    // First user in the WHOLE system → superadmin (Anthropic-level)
    // First user of a COMPANY → owner (full rights within that company only)
    const isSystemFirstUser = (await User.countDocuments()) === 0;
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name:      name.trim(),
      email:     email.toLowerCase().trim(),
      password:  hashed,
      role:      isSystemFirstUser ? 'superadmin' : 'owner',
      company:   company._id,
      language:  'ar',
      isActive:  true,
      isOnline:  true,
      lastSeen:  new Date()
    });

    // ── 3. Link owner ──────────────────────────────────────────────────────
    await Company.findByIdAndUpdate(company._id, { owner: user._id, createdBy: user._id });

    const token = signToken(user);
    const userData = { ...user.toObject(), password: undefined };

    res.status(201).json({
      success: true,
      message: isSystemFirstUser ? 'تم إنشاء حساب المشرف العام بنجاح' : 'تم إنشاء حساب المالك وإنشاء الشركة بنجاح',
      token,
      data: { user: userData, company: { _id:company._id, name:company.name, industry:company.industry, plan:company.plan, commercialReg:company.commercialReg, vatNumber:company.vatNumber } },
      user: userData
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ success:false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// LOGIN — checks CR + VAT + industry completeness
// ════════════════════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message:'البريد وكلمة المرور مطلوبان' });

    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('company','name industry commercialReg vatNumber plan planExpiresAt isActive isSuspended logo currency onboarding');

    if (!user) return res.status(401).json({ success:false, message:'بيانات الدخول غير صحيحة' });
    if (!user.isActive) return res.status(401).json({ success:false, message:'الحساب موقوف. تواصل مع المسؤول.' });

    // ── Company checks ─────────────────────────────────────────────────────
    if (!['superadmin'].includes(user.role) && user.company) {
      if (user.company.isSuspended) return res.status(403).json({ success:false, message:'الشركة موقوفة. تواصل مع الدعم.' });
      if (!user.company.isActive)   return res.status(403).json({ success:false, message:'حساب الشركة غير نشط.' });
    }

    // ── Password check ─────────────────────────────────────────────────────
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      user.failedLoginAttempts = (user.failedLoginAttempts||0) + 1;
      await user.save().catch(()=>{});
      return res.status(401).json({ success:false, message:'بيانات الدخول غير صحيحة' });
    }

    // ── Profile completeness check → returns flag to frontend ──────────────
    let profileIncomplete = null;
    if (user.company && user.role !== 'superadmin') {  // owner included
      const co = user.company;
      if (!co.commercialReg) profileIncomplete = 'commercialReg';
      else if (!co.vatNumber) profileIncomplete = 'vatNumber';
      else if (!co.industry)  profileIncomplete = 'industry';
    }

    // ── Update last login ──────────────────────────────────────────────────
    user.isOnline   = true;
    user.lastSeen   = new Date();
    user.lastLogin  = new Date();
    user.loginCount = (user.loginCount||0) + 1;
    user.failedLoginAttempts = 0;
    await user.save();

    const token    = signToken(user);
    const userData = { ...user.toObject(), password: undefined };

    res.json({
      success: true,
      token,
      profileIncomplete,   // null = complete, else field name that needs filling
      requiresCompletion: !!profileIncomplete,
      data: { user: userData, company: user.company },
      user: userData
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success:false, message: err.message });
  }
};

// ── Get me ──────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company','name nameEn logo industry commercialReg vatNumber currency plan planExpiresAt city country')
      .populate('customRole','name permissions canViewFinancials canApprove');
    if (!user) return res.status(404).json({ success:false, message:'المستخدم غير موجود' });
    res.json({ success:true, data: user });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// ── Update online status ─────────────────────────────────────────────────────
exports.updateOnlineStatus = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isOnline: req.body.isOnline, lastSeen: new Date() });
    res.json({ success:true });
  } catch (err) { res.status(500).json({ success:false, message: err.message }); }
};

// ── Get all users ─────────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const filter = ['superadmin'].includes(req.user.role)
      ? (req.query.companyId ? { company: req.query.companyId } : {})
      : { company: req.user.company };
    const users = await User.find(filter).select('-password')
      .populate('company','name industry').populate('customRole','name color icon')
      .sort({ createdAt:-1 });
    res.json({ success:true, count:users.length, data:users });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── Create user ───────────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, customRole, permissionOverrides, branch } = req.body;
    if (!name||!email||!password) return res.status(400).json({ success:false, message:'الاسم والبريد وكلمة المرور مطلوبة' });
    if (role==='superadmin' && req.user.role!=='superadmin')
      return res.status(403).json({ success:false, message:'لا يمكن إنشاء superadmin' });

    if (await User.findOne({ email:email.toLowerCase() }))
      return res.status(400).json({ success:false, message:'البريد مستخدم بالفعل' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email:email.toLowerCase(), password:hashed,
      role: role || 'user',
      customRole, permissionOverrides, branch,
      company: req.user.role==='superadmin' ? (req.body.company || req.user.company) : req.user.company,
      isActive:true, isOnline:false, lastSeen:new Date(),
      createdBy: req.user.id
    });

    const populated = await User.findById(user._id).select('-password').populate('customRole','name color icon');
    res.status(201).json({ success:true, data: populated, token: signToken(user) });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

// ── Update user ───────────────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const filter = req.user.role==='superadmin' ? { _id:req.params.id } : { _id:req.params.id, company:req.user.company };
    const { password, email, ...rest } = req.body;
    const update = { ...rest };
    if (password) update.password = await bcrypt.hash(password, 12);
    if (email)    update.email    = email.toLowerCase();

    const user = await User.findOneAndUpdate(filter, update, { new:true }).select('-password').populate('customRole','name color icon');
    if (!user) return res.status(404).json({ success:false, message:'المستخدم غير موجود' });
    res.json({ success:true, data:user });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

// ── Delete user ───────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const filter = req.user.role==='superadmin' ? { _id:req.params.id } : { _id:req.params.id, company:req.user.company };
    const user = await User.findOne(filter);
    if (!user) return res.status(404).json({ success:false, message:'المستخدم غير موجود' });
    if (user.role==='superadmin') return res.status(403).json({ success:false, message:'لا يمكن حذف المشرف العام' });
    await User.findByIdAndUpdate(req.params.id, { isActive:false });
    res.json({ success:true, message:'تم تعطيل المستخدم' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};
