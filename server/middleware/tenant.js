const mongoose = require('mongoose');

/**
 * buildFilter — safe company filter for any controller
 * Uses req.user.company (set by protect middleware via JWT)
 * Works whether company is a populated object OR a plain ObjectId
 */
exports.buildFilter = (req, extra = {}) => {
  const filter = { ...extra };
  
  // Get company from req.user (set by protect middleware)
  const co = req.user?.company;
  if (co) {
    // Handle both populated object {_id, name} and plain ObjectId string
    filter.company = co._id ? co._id.toString() : co.toString();
  }
  
  return filter;
};

/**
 * tenantGuard — optional middleware to set req.company explicitly
 * Not required if using buildFilter directly
 */
exports.tenantGuard = async (req, res, next) => {
  try {
    if (req.user?.role === 'superadmin') {
      req.company = req.query.companyId || null;
      return next();
    }
    if (!req.user?.company) {
      return res.status(403).json({
        success: false,
        message: 'الحساب غير مرتبط بشركة. تواصل مع المسؤول.'
      });
    }
    const co = req.user.company;
    req.company = co._id ? co._id.toString() : co.toString();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * getCompany — helper for controllers (same as auth.getCompany)
 */
exports.getCompany = (req) => {
  const co = req.user?.company;
  if (!co) return null;
  return co._id ? co._id.toString() : co.toString();
};

/**
 * checkPlanLimit — verify plan limits before creation
 */
exports.checkPlanLimit = (resource) => async (req, res, next) => {
  try {
    if (req.user?.role === 'superadmin') return next();
    const Company = require('../models/Company');
    const co = req.user?.company;
    if (!co) return next();
    const companyId = co._id ? co._id.toString() : co.toString();
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    if (company.isSuspended) return res.status(403).json({ success: false, message: 'الحساب موقوف' });
    if (company.planExpiresAt && new Date() > company.planExpiresAt) {
      return res.status(403).json({ success: false, message: 'انتهت صلاحية الاشتراك. يرجى التجديد.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
