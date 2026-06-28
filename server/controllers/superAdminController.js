const Company = require('../models/Company');
const User    = require('../models/User');

const PLAN_LIMITS = {
  trial:        { maxUsers: 5,    maxEmployees: 50,   maxBranches: 1  },
  starter:      { maxUsers: 15,   maxEmployees: 200,  maxBranches: 3  },
  professional: { maxUsers: 50,   maxEmployees: 1000, maxBranches: 10 },
  enterprise:   { maxUsers: 9999, maxEmployees: 9999, maxBranches: 999 }
};

// ─── List all companies ───────────────────────────────────
exports.getCompanies = async (req, res) => {
  try {
    const { plan, isActive, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (plan)            filter.plan     = plan;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { nameEn:{ $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Company.countDocuments(filter)
    ]);

    // Enrich with user counts
    const enriched = await Promise.all(companies.map(async (c) => {
      const [userCount, employeeCount] = await Promise.all([
        User.countDocuments({ company: c._id }),
        require('../models/Employee').countDocuments({ company: c._id, status: 'active' })
      ]);
      return { ...c.toObject(), _userCount: userCount, _employeeCount: employeeCount };
    }));

    res.json({ success: true, total, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get single company details ───────────────────────────
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('owner', 'name email');
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    const [users, employees] = await Promise.all([
      User.find({ company: company._id }).select('-password'),
      require('../models/Employee').countDocuments({ company: company._id })
    ]);

    res.json({ success: true, data: { ...company.toObject(), users, _employeeCount: employees } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Create company (by superadmin) ──────────────────────
exports.createCompany = async (req, res) => {
  try {
    const { plan = 'trial', trialDays = 30, ...rest } = req.body;
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.trial;

    const company = await Company.create({
      ...rest, plan,
      planExpiresAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
      ...limits,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Update company ───────────────────────────────────────
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── Change plan ──────────────────────────────────────────
exports.changePlan = async (req, res) => {
  try {
    const { plan, durationDays = 365 } = req.body;
    if (!PLAN_LIMITS[plan]) {
      return res.status(400).json({ success: false, message: 'خطة غير صالحة' });
    }

    const limits = PLAN_LIMITS[plan];
    const company = await Company.findByIdAndUpdate(req.params.id, {
      plan,
      planExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      ...limits
    }, { new: true });

    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    res.json({
      success: true,
      message: `تم تغيير الخطة إلى ${plan} — تنتهي في ${company.planExpiresAt.toLocaleDateString('ar-SA')}`,
      data: company
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Suspend / Activate company ───────────────────────────
exports.toggleSuspend = async (req, res) => {
  try {
    const { suspend, reason } = req.body;
    const company = await Company.findByIdAndUpdate(req.params.id, {
      isSuspended: !!suspend,
      suspendReason: suspend ? reason : null,
      isActive: !suspend
    }, { new: true });

    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });
    res.json({ success: true, message: suspend ? 'تم إيقاف الشركة' : 'تم تفعيل الشركة', data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Delete company + all its data ───────────────────────
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    // Delete all related data
    await Promise.all([
      User.deleteMany({ company: company._id }),
      require('../models/Employee').deleteMany({ company: company._id }),
      require('../models/Inventory').deleteMany({ company: company._id }),
      require('../models/Supplier').deleteMany({ company: company._id }),
      require('../models/Branch').deleteMany({ company: company._id }),
      require('../models/Warehouse').deleteMany({ company: company._id }),
      require('../models/PurchaseOrder').deleteMany({ company: company._id }),
      require('../models/ChatRoom').deleteMany({ company: company._id }),
    ]);

    await company.deleteOne();
    res.json({ success: true, message: 'تم حذف الشركة وجميع بياناتها' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Platform Stats ───────────────────────────────────────
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      totalCompanies, activeCompanies, trialCompanies,
      totalUsers, totalEmployees,
      planBreakdown
    ] = await Promise.all([
      Company.countDocuments(),
      Company.countDocuments({ isActive: true }),
      Company.countDocuments({ plan: 'trial' }),
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      require('../models/Employee').countDocuments({ status: 'active' }),
      Company.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }])
    ]);

    res.json({
      success: true,
      data: {
        companies: { total: totalCompanies, active: activeCompanies, trial: trialCompanies },
        users: { total: totalUsers },
        employees: { total: totalEmployees },
        planBreakdown: planBreakdown.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {})
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
