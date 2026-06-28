const User = require('../models/User');

/**
 * Tenant Middleware
 * ─────────────────
 * يُضاف بعد protect — يجلب company المستخدم ويضعها في req.company
 * كل controller يستخدم req.company لفلترة البيانات تلقائياً
 *
 * superadmin: يقدر يشوف كل الشركات (req.company = null)
 * admin/manager/user: مقيّد بشركته فقط
 */
exports.tenantGuard = async (req, res, next) => {
  try {
    // superadmin can access all companies
    if (req.user.role === 'superadmin') {
      // Allow ?company=xxx override for superadmin inspection
      req.company = req.query.companyId || req.headers['x-company-id'] || null;
      return next();
    }

    // Regular users MUST have a company
    if (!req.user.company) {
      return res.status(403).json({
        success: false,
        message: 'هذا الحساب غير مرتبط بأي شركة. تواصل مع المشرف.'
      });
    }

    req.company = req.user.company.toString();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * buildFilter — helper يُستخدم في كل controller
 * يدمج company filter مع أي filter إضافي
 *
 * مثال:
 *   const filter = buildFilter(req, { status: 'active' });
 *   const items = await Inventory.find(filter);
 */
exports.buildFilter = (req, extra = {}) => {
  const filter = { ...extra };
  if (req.company) filter.company = req.company;
  return filter;
};

/**
 * checkPlanLimits — يتحقق من حدود الخطة قبل الإنشاء
 */
exports.checkPlanLimit = (resource) => async (req, res, next) => {
  try {
    if (req.user.role === 'superadmin') return next();

    const Company = require('../models/Company');
    const company = await Company.findById(req.company);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    if (company.isSuspended) {
      return res.status(403).json({ success: false, message: 'الحساب موقوف. تواصل مع الدعم.' });
    }

    // Check plan expiry
    if (company.planExpiresAt && new Date() > company.planExpiresAt) {
      return res.status(403).json({ success: false, message: 'انتهت صلاحية الاشتراك. يرجى التجديد.' });
    }

    // Check resource limits by plan
    if (resource === 'users') {
      const User = require('../models/User');
      const count = await User.countDocuments({ company: req.company, isActive: true });
      if (count >= company.maxUsers) {
        return res.status(403).json({
          success: false,
          message: `وصلت للحد الأقصى من المستخدمين (${company.maxUsers}). يرجى الترقية.`,
          limit: company.maxUsers, current: count
        });
      }
    }

    if (resource === 'employees') {
      const Employee = require('../models/Employee');
      const count = await Employee.countDocuments({ company: req.company, status: 'active' });
      if (count >= company.maxEmployees) {
        return res.status(403).json({
          success: false,
          message: `وصلت للحد الأقصى من الموظفين (${company.maxEmployees}). يرجى الترقية.`,
          limit: company.maxEmployees, current: count
        });
      }
    }

    if (resource === 'branches') {
      const Branch = require('../models/Branch');
      const count = await Branch.countDocuments({ company: req.company, isActive: true });
      if (count >= company.maxBranches) {
        return res.status(403).json({
          success: false,
          message: `وصلت للحد الأقصى من الفروع (${company.maxBranches}). يرجى الترقية.`,
          limit: company.maxBranches, current: count
        });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
