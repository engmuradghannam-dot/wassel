const Employee = require('../models/Employee');
const User     = require('../models/User');
const { getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');
const bcrypt = require('bcryptjs');

exports.getEmployees = async (req, res) => {
  try {
    const { department, branch, status, search } = req.query;
    const extra = {};
    if (department) extra.department = department;
    if (branch)     extra.branch     = branch;
    if (status)     extra.status     = status;
    if (search) {
      const q = new RegExp(search, 'i');
      extra.$or = [{ name:q },{ nameEn:q },{ email:q },{ phone:q },{ position:q },{ employeeId:q }];
    }
    const employees = await Employee.find(buildFilter(req, extra))
      .populate('branch','name')
      .populate('manager','name position')
      .populate('director','name position')
      .populate('user','email isActive lastSeen isOnline')
      .populate('customRole','name icon color')
      .sort({ name: 1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('branch','name')
      .populate('manager','name email position')
      .populate('director','name email position')
      .populate('user','email isActive lastSeen isOnline')
      .populate('customRole','name icon color permissions');
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    res.json({ success: true, data: emp });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// CREATE — optionally creates a linked internal login (User) at the same time
exports.createEmployee = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

  const { createLogin, loginPassword, ...empData } = req.body;

  try {
    let linkedUser = null;

    // ── Create internal login account if requested ──────────────────────
    if (createLogin) {
      if (!empData.email) {
        return res.status(400).json({ success:false, message:'البريد الإلكتروني مطلوب لإنشاء حساب دخول' });
      }
      if (!loginPassword || loginPassword.length < 6) {
        return res.status(400).json({ success:false, message:'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }

      const existing = await User.findOne({ email: empData.email.toLowerCase().trim() });
      if (existing) {
        return res.status(400).json({ success:false, message:'البريد الإلكتروني مستخدم مسبقاً في النظام' });
      }

      const hashedPw = await bcrypt.hash(loginPassword, 12);
      linkedUser = await User.create({
        name:     empData.name,
        email:    empData.email.toLowerCase().trim(),
        password: hashedPw,
        company:  co,
        role:     'employee',
        customRole: empData.customRole || undefined,
        isActive: true,
      });
    }

    // ── Collision-proof employeeId generation ────────────────────────────
    let emp = null;
    const MAX_RETRIES = 5;
    let lastErr = null;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const employeeId = empData.employeeId ||
          `EMP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*100)}`;
        emp = await Employee.create({
          ...empData,
          company: co,
          employeeId,
          user: linkedUser?._id || empData.user || undefined,
          createdBy: req.user._id,
        });
        break;
      } catch (e) {
        lastErr = e;
        if (e.code === 11000 && Object.keys(e.keyPattern||{}).includes('employeeId')) continue;
        throw e;
      }
    }
    if (!emp) throw lastErr;

    // Link back: User.employee not modeled, but keep consistent
    res.status(201).json({
      success: true,
      data: emp,
      loginCreated: !!linkedUser,
      message: linkedUser
        ? `تم إنشاء الموظف وحساب الدخول بنجاح (${linkedUser.email})`
        : 'تم إنشاء الموظف بنجاح'
    });
  } catch (err) {
    console.error('createEmployee error:', err.message);
    res.status(400).json({ success: false, message: err.message, detail: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { createLogin, loginPassword, ...empData } = req.body;
    const co = getCompany(req);

    const emp = await Employee.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), empData, { new: true, runValidators: true });
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    // ── Create login retroactively if requested and not yet linked ──────
    if (createLogin && !emp.user) {
      if (!emp.email) return res.status(400).json({ success:false, message:'يجب إضافة بريد إلكتروني للموظف أولاً' });
      if (!loginPassword || loginPassword.length < 6) {
        return res.status(400).json({ success:false, message:'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }
      const existing = await User.findOne({ email: emp.email.toLowerCase().trim() });
      if (existing) return res.status(400).json({ success:false, message:'البريد الإلكتروني مستخدم مسبقاً' });

      const hashedPw2 = await bcrypt.hash(loginPassword, 12);
      const newUser = await User.create({
        name: emp.name, email: emp.email.toLowerCase().trim(),
        password: hashedPw2, company: co, role:'employee',
        customRole: emp.customRole || undefined, isActive:true,
      });
      emp.user = newUser._id;
      await emp.save();
      return res.json({ success:true, data:emp, loginCreated:true, message:`تم إنشاء حساب الدخول (${newUser.email})` });
    }

    // ── Reset password for existing linked account ───────────────────────
    if (loginPassword && emp.user) {
      const hashed = await bcrypt.hash(loginPassword, 12);
      await User.findByIdAndUpdate(emp.user, { password: hashed });
    }

    res.json({ success: true, data: emp });
  } catch (err) { res.status(400).json({ success: false, message: err.message, detail: err.message }); }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    // Deactivate linked login but don't delete (audit trail)
    if (emp.user) await User.findByIdAndUpdate(emp.user, { isActive:false });
    res.json({ success: true, message: 'تم حذف الموظف' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Employee.distinct('department', buildFilter(req));
    res.json({ success: true, data: depts.filter(Boolean) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
