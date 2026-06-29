const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'wassel-erp-secret-key-min-32-chars';

/**
 * Role hierarchy:
 *  superadmin → first user of the whole system (can see all companies)
 *  owner      → first user of a COMPANY (full access within their company)
 *  admin      → company admin (full access within their company)
 *  manager    → create/update within company
 *  user       → limited access
 *  employee   → very limited
 *  readonly   → read only
 */

// ── protect ────────────────────────────────────────────────────────────────
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
    const user    = await User.findById(decoded.id)
      .populate('company','name isActive isSuspended')
      .populate('customRole','name permissions canViewFinancials canApprove canManageUsers');
    
    if (!user)         return res.status(401).json({ success:false, message:'المستخدم غير موجود' });
    if (!user.isActive)return res.status(401).json({ success:false, message:'الحساب موقوف' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success:false, message:'جلسة منتهية — يرجى تسجيل الدخول مجدداً' });
  }
};

// ── authorize — role check ─────────────────────────────────────────────────
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success:false, message:'غير مخوّل' });

  const role = req.user.role;

  // superadmin, owner, admin ALWAYS pass if those roles are included OR if no restriction
  if (['superadmin','owner','admin'].includes(role)) return next();

  // manager, user, etc — check if their role is explicitly allowed
  if (roles.includes(role)) return next();

  return res.status(403).json({
    success: false,
    message: 'ليس لديك صلاحية للقيام بهذه العملية'
  });
};

// ── getCompany — safe extraction of company ID from req.user ───────────────
// Works whether company is a populated object OR a plain ObjectId string
exports.getCompany = (req) => {
  const co = req.user?.company;
  if (!co) return null;
  // Populated object → { _id, name, ... }
  if (typeof co === 'object' && co._id) return co._id.toString();
  // Plain string / ObjectId
  return co.toString();
};
