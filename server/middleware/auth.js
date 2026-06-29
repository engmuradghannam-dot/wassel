const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'wassel-erp-secret-key-min-32-chars';

// ── Role hierarchy ─────────────────────────────────────────────────────────
// superadmin → system-level (Anthropic / platform admin, all companies)
// owner      → company owner (full access within THEIR company only)
// admin      → company admin (full access within their company)
// manager    → can create/update but not delete
// user       → read only + limited create
// employee   → very limited
// readonly   → read only

const FULL_ACCESS_ROLES  = ['superadmin', 'owner', 'admin'];
const WRITE_ROLES        = ['superadmin', 'owner', 'admin', 'manager'];
const APPROVE_ROLES      = ['superadmin', 'owner', 'admin'];

// ── protect — verify JWT, attach req.user ──────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success:false, message:'غير مخوّل — يرجى تسجيل الدخول' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(decoded.id).populate('company','name isActive isSuspended');
    if (!user) {
      return res.status(401).json({ success:false, message:'المستخدم غير موجود' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success:false, message:'الحساب موقوف' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success:false, message:'جلسة منتهية — يرجى تسجيل الدخول مجدداً' });
  }
};

// ── authorize — check role list ────────────────────────────────────────────
// Usage: authorize('admin','manager') or authorize('owner','admin')
// 'owner' and 'admin' within their own company are equivalent
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success:false, message:'غير مخوّل' });
    }

    const userRole = req.user.role;

    // superadmin bypasses everything
    if (userRole === 'superadmin') return next();

    // owner has same rights as admin within company
    const effectiveRole = userRole === 'owner' ? 'admin' : userRole;

    if (!roles.includes(effectiveRole) && !roles.includes(userRole)) {
      return res.status(403).json({
        success:false,
        message:'ليس لديك صلاحية للقيام بهذه العملية'
      });
    }

    // Non-superadmin must have a company
    if (!req.user.company) {
      return res.status(403).json({
        success:false,
        message:'الحساب غير مرتبط بشركة. تواصل مع المسؤول.'
      });
    }

    next();
  };
};

// ── authorizeOwner — only owner or superadmin ──────────────────────────────
exports.authorizeOwner = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'غير مخوّل' });
  if (!['superadmin','owner'].includes(req.user.role)) {
    return res.status(403).json({ success:false, message:'هذه العملية للمالك فقط' });
  }
  next();
};

// ── Helper: get company ID safely ──────────────────────────────────────────
exports.getCompany = (req) =>
  req.user?.company?._id?.toString()
  || req.user?.company?.toString()
  || null;
