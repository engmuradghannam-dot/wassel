const Company = require('../models/Company');
const User    = require('../models/User');

// Helper: get company ID for current user
const getCompanyId = async (req) => {
  if (req.user.role === 'superadmin') {
    // superadmin: use their company or query param
    return req.user.company || req.query.companyId || null;
  }
  return req.user.company;
};

// ─── Get company ──────────────────────────────────────────────────────────
exports.getCompany = async (req, res) => {
  try {
    const id = await getCompanyId(req);
    if (!id) return res.status(404).json({ success: false, message: 'لا توجد شركة مرتبطة بهذا الحساب' });
    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Update company ───────────────────────────────────────────────────────
exports.updateCompany = async (req, res) => {
  try {
    const id = await getCompanyId(req);
    if (!id) return res.status(404).json({ success: false, message: 'لا توجد شركة' });
    const company = await Company.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: false }
    );
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Update location ──────────────────────────────────────────────────────
exports.updateLocation = async (req, res) => {
  try {
    const id = await getCompanyId(req);
    const { lat, lng, address } = req.body;
    const company = await Company.findByIdAndUpdate(
      id,
      { location: { lat, lng, address } },
      { new: true }
    );
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Upload logo ──────────────────────────────────────────────────────────
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع الملف' });
    const id = await getCompanyId(req);
    const logoUrl = `/uploads/${req.file.filename}`;
    const company = await Company.findByIdAndUpdate(id, { logo: logoUrl }, { new: true });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Get all companies (superadmin) ──────────────────────────────────────
exports.getAllCompanies = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'غير مسموح' });
    }
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json({ success: true, count: companies.length, data: companies });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
