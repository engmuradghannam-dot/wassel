const Department = require('../models/Department');
const { getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find(buildFilter(req))
      .populate('manager', 'name position').populate('branch', 'name').populate('parent', 'name')
      .sort({ name: 1 });
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('manager', 'name position').populate('branch', 'name');
    if (!department) return res.status(404).json({ success: false, message: 'القسم غير موجود' });

    // عدد الموظفين الفعلي في هذا القسم (سواء عبر الحقل الجديد أو القديم بالاسم)
    const Employee = require('../models/Employee');
    const employeeCount = await Employee.countDocuments({
      company: getCompany(req),
      $or: [{ departmentRef: department._id }, { department: department.name }]
    });

    res.json({ success: true, data: { ...department.toObject(), employeeCount } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createDepartment = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
  const body = { ...req.body };
  ['parent','manager','branch'].forEach(f => { if (!body[f]) delete body[f]; });
  const MAX_RETRIES = 5; let lastErr = null;
  for (let i=0; i<MAX_RETRIES; i++) {
    try {
      const code = body.code?.trim() || `DEPT-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*100)}`;
      const department = await Department.create({ ...body, company: co, code });
      return res.status(201).json({ success: true, data: department });
    } catch (err) {
      lastErr = err;
      if (err.code === 11000 && Object.keys(err.keyPattern||{}).includes('code')) continue;
      return res.status(400).json({ success: false, message: err.message, detail: err.message });
    }
  }
  res.status(400).json({ success:false, message:'فشل إنشاء القسم بعد عدة محاولات: '+(lastErr?.message||'') });
};

exports.updateDepartment = async (req, res) => {
  try {
    const body = { ...req.body };
    ['parent','manager','branch'].forEach(f => { if (!body[f]) delete body[f]; });
    const department = await Department.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ success: false, message: 'القسم غير موجود' });
    res.json({ success: true, data: department });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const Employee = require('../models/Employee');
    const inUse = await Employee.countDocuments({ company: getCompany(req), departmentRef: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({ success:false, message:`لا يمكن حذف القسم — به ${inUse} موظف` });
    }
    const department = await Department.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!department) return res.status(404).json({ success: false, message: 'القسم غير موجود' });
    res.json({ success: true, message: 'تم حذف القسم' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
