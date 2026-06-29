const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Role    = require('../models/Role');
const User    = require('../models/User');

const { DEFAULT_ROLES_BY_INDUSTRY, ALL_MODULES, ALL_ACTIONS } = require('../models/Role');

// ── GET all roles for company ─────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const roles = await Role.find({ company: req.user.company, isActive: true })
      .populate('createdBy', 'name')
      .sort({ level: 1, createdAt: 1 });

    // Also get user counts per role
    const roleCounts = await User.aggregate([
      { $match: { company: req.user.company } },
      { $group: { _id: '$customRole', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(roleCounts.map(r => [r._id?.toString(), r.count]));

    const enriched = roles.map(r => ({
      ...r.toObject(),
      userCount: countMap[r._id.toString()] || 0
    }));

    res.json({ success: true, count: roles.length, data: enriched });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET available modules & actions ───────────────────────────────────────
router.get('/modules', protect, (req, res) => {
  res.json({ success: true, data: { modules: ALL_MODULES, actions: ALL_ACTIONS } });
});

// ── GET single role ───────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, company: req.user.company });
    if (!role) return res.status(404).json({ success: false, message: 'الدور غير موجود' });
    res.json({ success: true, data: role });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CREATE role ───────────────────────────────────────────────────────────
router.post('/', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const role = await Role.create({
      ...req.body,
      company:   req.user.company,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: role });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ── UPDATE role ───────────────────────────────────────────────────────────
router.put('/:id', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, company: req.user.company });
    if (!role) return res.status(404).json({ success: false, message: 'الدور غير موجود' });
    if (role.isSystem) return res.status(403).json({ success: false, message: 'لا يمكن تعديل الأدوار النظامية' });
    Object.assign(role, req.body);
    await role.save();
    res.json({ success: true, data: role });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ── DELETE role ───────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, company: req.user.company });
    if (!role) return res.status(404).json({ success: false, message: 'الدور غير موجود' });
    if (role.isSystem) return res.status(403).json({ success: false, message: 'لا يمكن حذف الأدوار النظامية' });
    const users = await User.countDocuments({ customRole: role._id });
    if (users > 0) return res.status(400).json({ success: false, message: `يوجد ${users} مستخدم بهذا الدور. انقل المستخدمين أولاً.` });
    await role.deleteOne();
    res.json({ success: true, message: 'تم حذف الدور' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Seed default roles for company's industry ─────────────────────────────
router.post('/seed-defaults', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const Company = require('../models/Company');
    const company = await Company.findById(req.user.company);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    const industryRoles = DEFAULT_ROLES_BY_INDUSTRY[company.industry]
      || DEFAULT_ROLES_BY_INDUSTRY['trading_general'];

    // Also always include base trading roles
    const baseRoles = DEFAULT_ROLES_BY_INDUSTRY['trading_general'];

    // Merge: industry-specific first, then base ones not already covered
    const allRoles = [...industryRoles];
    for (const base of baseRoles) {
      if (!allRoles.find(r => r.name === base.name)) allRoles.push(base);
    }

    const created = [];
    for (const roleDef of allRoles) {
      const existing = await Role.findOne({ company: req.user.company, name: roleDef.name });
      if (!existing) {
        const newRole = await Role.create({
          ...roleDef,
          company: req.user.company,
          industry: company.industry,
          isDefault: true,
          createdBy: req.user.id
        });
        created.push(newRole.name);
      }
    }

    res.json({ success: true, message: `تم إنشاء ${created.length} دور`, data: created });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Assign role to user ────────────────────────────────────────────────────
router.post('/assign', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const { userId, roleId, permissionOverrides } = req.body;
    const user = await User.findOne({ _id: userId, company: req.user.company });
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });

    user.customRole = roleId;
    if (permissionOverrides) user.permissionOverrides = permissionOverrides;
    await user.save();

    const updated = await User.findById(userId).populate('customRole');
    res.json({ success: true, data: updated });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
