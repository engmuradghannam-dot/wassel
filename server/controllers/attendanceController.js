const Attendance = require('../models/Attendance');
const Employee   = require('../models/Employee');
const { getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

exports.getAttendance = async (req, res) => {
  try {
    const extra = {};
    if (req.query.employee) extra.employee = req.query.employee;
    if (req.query.status)   extra.status   = req.query.status;
    if (req.query.from || req.query.to) {
      extra.date = {};
      if (req.query.from) extra.date.$gte = startOfDay(req.query.from);
      if (req.query.to)   extra.date.$lte = startOfDay(req.query.to);
    }
    const records = await Attendance.find(buildFilter(req, extra))
      .populate('employee', 'name position department')
      .sort({ date: -1 }).limit(500);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// تسجيل حضور (check-in) — يُنشئ سجل اليوم إن لم يوجد
exports.checkIn = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
  try {
    let employeeId = req.body.employee;
    if (!employeeId) {
      const emp = await Employee.findOne({ user: req.user._id, company: co });
      employeeId = emp?._id;
    }
    if (!employeeId) return res.status(400).json({ success:false, message:'لم يتم العثور على سجل موظف مرتبط بحسابك' });

    const today = startOfDay(new Date());
    let record = await Attendance.findOne({ company: co, employee: employeeId, date: today });
    if (record && record.checkIn) {
      return res.status(400).json({ success:false, message:'تم تسجيل الحضور لهذا اليوم مسبقاً' });
    }
    if (!record) {
      record = await Attendance.create({
        company: co, employee: employeeId, date: today,
        checkIn: new Date(), status: 'present', createdBy: req.user._id,
      });
    } else {
      record.checkIn = new Date();
      record.status = 'present';
      await record.save();
    }
    res.status(201).json({ success: true, data: record, message: 'تم تسجيل الحضور' });
  } catch (err) { res.status(400).json({ success: false, message: err.message, detail: err.message }); }
};

// تسجيل انصراف (check-out)
exports.checkOut = async (req, res) => {
  const co = getCompany(req);
  try {
    let employeeId = req.body.employee;
    if (!employeeId) {
      const emp = await Employee.findOne({ user: req.user._id, company: co });
      employeeId = emp?._id;
    }
    const today = startOfDay(new Date());
    const record = await Attendance.findOne({ company: co, employee: employeeId, date: today });
    if (!record || !record.checkIn) {
      return res.status(400).json({ success:false, message:'يجب تسجيل الحضور أولاً' });
    }
    if (record.checkOut) {
      return res.status(400).json({ success:false, message:'تم تسجيل الانصراف لهذا اليوم مسبقاً' });
    }
    record.checkOut = new Date();
    await record.save();
    res.json({ success: true, data: record, message: 'تم تسجيل الانصراف' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// تقرير شهري لموظف واحد (لكشف الراتب وربطه بـ Payroll)
exports.getMonthlyReport = async (req, res) => {
  try {
    const co = getCompany(req);
    const { employeeId, month, year } = req.query;
    const y = +year || new Date().getFullYear();
    const m = +month || (new Date().getMonth() + 1);
    const start = new Date(y, m-1, 1);
    const end   = new Date(y, m, 0, 23,59,59);

    const records = await Attendance.find({ company: co, employee: employeeId, date: { $gte: start, $lte: end } }).sort({ date:1 });

    const summary = records.reduce((acc, r) => {
      acc[r.status] = (acc[r.status]||0) + 1;
      acc.totalWorkedHours += r.workedHours || 0;
      acc.totalLateMinutes += r.lateMinutes || 0;
      return acc;
    }, { present:0, absent:0, late:0, half_day:0, on_leave:0, holiday:0, weekend:0, totalWorkedHours:0, totalLateMinutes:0 });

    res.json({ success: true, data: { records, summary, month:m, year:y } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// إنشاء/تعديل سجل يدوياً (للأدمن — تصحيح أخطاء أو تسجيل بأثر رجعي)
exports.upsertManual = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
  try {
    const { employee, date, ...rest } = req.body;
    const day = startOfDay(date);
    const record = await Attendance.findOneAndUpdate(
      { company: co, employee, date: day },
      { ...rest, company: co, employee, date: day, createdBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: record });
  } catch (err) { res.status(400).json({ success: false, message: err.message, detail: err.message }); }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!record) return res.status(404).json({ success: false, message: 'السجل غير موجود' });
    res.json({ success: true, message: 'تم حذف السجل' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
