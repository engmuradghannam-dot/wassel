const Category = require('../models/Category');
const { getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find(buildFilter(req))
      .populate('parent', 'name').sort({ name: 1 });
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne(buildFilter(req, { _id: req.params.id })).populate('parent', 'name');
    if (!category) return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
    res.json({ success: true, data: category });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createCategory = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
  const MAX_RETRIES = 5; let lastErr = null;
  for (let i=0; i<MAX_RETRIES; i++) {
    try {
      const code = req.body.code?.trim() || `CAT-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*100)}`;
      const category = await Category.create({ ...req.body, company: co, code });
      return res.status(201).json({ success: true, data: category });
    } catch (err) {
      lastErr = err;
      if (err.code === 11000 && Object.keys(err.keyPattern||{}).includes('code')) continue;
      return res.status(400).json({ success: false, message: err.message, detail: err.message });
    }
  }
  res.status(400).json({ success:false, message:'فشل إنشاء الفئة بعد عدة محاولات: '+(lastErr?.message||'') });
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
    res.json({ success: true, data: category });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteCategory = async (req, res) => {
  try {
    // منع حذف فئة مستخدمة فعلياً في المخزون
    const Inventory = require('../models/Inventory');
    const inUse = await Inventory.countDocuments({ company: getCompany(req), categoryRef: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({ success:false, message:`لا يمكن حذف الفئة — مستخدمة في ${inUse} صنف مخزون` });
    }
    const category = await Category.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!category) return res.status(404).json({ success: false, message: 'الفئة غير موجودة' });
    res.json({ success: true, message: 'تم حذف الفئة' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
