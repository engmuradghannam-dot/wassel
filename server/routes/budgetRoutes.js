const express = require('express');
const router  = express.Router();
const { protect, authorize, getCompany} = require('../middleware/auth');
const Budget  = require('../models/Budget');
const { buildFilter } = require('../middleware/tenant');

router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.year)    filter.year    = parseInt(req.query.year);
    if (req.query.type)    filter.type    = req.query.type;
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.project) filter.project = req.query.project;

    const budgets = await Budget.find(filter)
      .populate('project','name code status')
      .populate('branch','name')
      .populate('approvedBy','name')
      .sort({ year: -1, createdAt: -1 });

    res.json({ success: true, count: budgets.length, data: budgets });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    // Calculate totals from lines
    const lines = req.body.lines || [];
    const totalRevenueBudget = lines.filter(l => l.category === 'revenue').reduce((s,l) => s + (l.totalBudget||0), 0);
    const totalExpenseBudget = lines.filter(l => l.category !== 'revenue').reduce((s,l) => s + (l.totalBudget||0), 0);

    const budget = await Budget.create({
      ...req.body,
      company: getCompany(req),
      totalRevenueBudget,
      totalExpenseBudget,
      netIncomeBudget: totalRevenueBudget - totalExpenseBudget,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: budget });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const b = await Budget.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('project','name code progressPct contractValue')
      .populate('branch','name')
      .populate('approvedBy','name')
      .populate('lines.account','code name type');
    if (!b) return res.status(404).json({ success: false, message: 'الميزانية غير موجودة' });
    res.json({ success: true, data: b });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const b = await Budget.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true });
    if (!b) return res.status(404).json({ success: false, message: 'الميزانية غير موجودة' });
    res.json({ success: true, data: b });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Approve budget
router.patch('/:id/approve', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const b = await Budget.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }),
      { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, data: b });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Update actuals from accounting entries
router.patch('/:id/actuals', protect, async (req, res) => {
  try {
    const { lineId, month, actual } = req.body;
    const monthFields = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthField  = monthFields[month - 1];

    const b = await Budget.findOneAndUpdate(
      { ...buildFilter(req, { _id: req.params.id }), 'lines._id': lineId },
      { $set: { [`lines.$.${monthField}Actual`]: actual } },
      { new: true }
    );
    res.json({ success: true, data: b });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
