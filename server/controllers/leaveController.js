const Leave    = require('../models/Leave');
const Employee = require('../models/Employee');
const { getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');

// رصيد سنوي افتراضي بحسب نوع الإجازة (نظام العمل السعودي تقريباً)
const ANNUAL_BALANCE = { annual: 21, sick: 30, unpaid: 9999, maternity: 70, paternity: 3, hajj: 10, emergency: 5, bereavement: 5, other: 0 };

exports.getLeaves = async (req, res) => {
  try {
    const extra = {};
    if (req.query.status)   extra.status   = req.query.status;
    if (req.query.employee) extra.employee = req.query.employee;
    if (req.query.type)     extra.type     = req.query.type;

    // الموظف العادي يرى طلباته فقط؛ المدير/أدمن يرى الكل
    if (!['owner','admin','superadmin','manager'].includes(req.user.role)) {
      const emp = await Employee.findOne({ user: req.user._id, company: getCompany(req) });
      if (emp) extra.employee = emp._id;
    }

    const leaves = await Leave.find(buildFilter(req, extra))
      .populate('employee', 'name position department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('employee', 'name position department').populate('approvedBy', 'name');
    if (!leave) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: leave });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// رصيد إجازة موظف لنوع معيّن خلال السنة الحالية
exports.getBalance = async (req, res) => {
  try {
    const co = getCompany(req);
    const { employeeId, type='annual' } = req.query;
    const yearStart = new Date(new Date().getFullYear(), 0, 1);

    const used = await Leave.aggregate([
      { $match: { company: new (require('mongoose')).Types.ObjectId(co), employee: new (require('mongoose')).Types.ObjectId(employeeId), type, status:'approved', startDate: { $gte: yearStart } } },
      { $group: { _id: null, totalDays: { $sum: '$days' } } }
    ]);

    const usedDays  = used[0]?.totalDays || 0;
    const totalDays = ANNUAL_BALANCE[type] || 21;
    res.json({ success:true, data: { type, totalDays, usedDays, remainingDays: Math.max(0, totalDays - usedDays) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createLeave = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
  try {
    // ربط تلقائي بسجل الموظف الخاص بالمستخدم الحالي إن لم يُحدَّد صراحة (موظفون عاديون)
    let employeeId = req.body.employee;
    if (!employeeId) {
      const emp = await Employee.findOne({ user: req.user._id, company: co });
      employeeId = emp?._id;
    }
    if (!employeeId) return res.status(400).json({ success:false, message:'لم يتم العثور على سجل موظف مرتبط بحسابك' });

    const leave = await Leave.create({ ...req.body, employee: employeeId, company: co, createdBy: req.user._id });
    res.status(201).json({ success: true, data: leave, message: 'تم تقديم طلب الإجازة' });
  } catch (err) { res.status(400).json({ success: false, message: err.message, detail: err.message }); }
};

exports.approveLeave = async (req, res) => {
  try {
    const { action, comment } = req.body; // 'approve' | 'reject'
    const co = getCompany(req);
    const leave = await Leave.findOne(buildFilter(req, { _id: req.params.id }));
    if (!leave) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    if (leave.status !== 'pending') return res.status(400).json({ success:false, message:'تم البت في هذا الطلب مسبقاً' });

    const approverEmp = await Employee.findOne({ user: req.user._id, company: co });

    leave.status = action === 'approve' ? 'approved' : 'rejected';
    leave.approvedBy = approverEmp?._id;
    leave.approvedAt = new Date();
    if (action === 'reject') leave.rejectionReason = comment;
    await leave.save();

    res.json({ success: true, data: leave, message: action==='approve' ? 'تم اعتماد الإجازة' : 'تم رفض الإجازة' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id, status:'pending' }), req.body, { new: true, runValidators: true });
    if (!leave) return res.status(404).json({ success: false, message: 'الطلب غير موجود أو تم البت فيه بالفعل' });
    res.json({ success: true, data: leave });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), { status:'cancelled' }, { new:true });
    if (!leave) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: leave, message: 'تم إلغاء الطلب' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
