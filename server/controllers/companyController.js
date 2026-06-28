const Company = require('../models/Company');
const { validationResult } = require('express-validator');

exports.getCompany = async (req, res) => {
  try {
    const id = req.user.company;
    if (!id) return res.status(404).json({ success: false, message: 'لا توجد شركة مرتبطة بهذا الحساب' });
    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateCompany = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const id = req.user.company;
    if (!id) return res.status(404).json({ success: false, message: 'لا توجد شركة' });
    const company = await Company.findByIdAndUpdate(id, { ...req.body, updatedAt: Date.now() }, { new: true, runValidators: true });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const company = await Company.findByIdAndUpdate(req.user.company, { location: { lat, lng, address } }, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم رفع الملف' });
    const logoUrl = `/uploads/${req.file.filename}`;
    const company = await Company.findByIdAndUpdate(req.user.company, { logo: logoUrl }, { new: true });
    res.json({ success: true, data: company });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
