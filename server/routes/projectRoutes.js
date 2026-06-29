const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Project  = require('../models/Project');
const Budget   = require('../models/Budget');
const { buildFilter } = require('../middleware/tenant');

// ─── GET all projects ──────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.manager)  filter.manager  = req.query.manager;
    if (req.query.customer) filter.customer = req.query.customer;

    const projects = await Project.find(filter)
      .populate('manager', 'name')
      .populate('customer', 'name code')
      .populate('budget', 'name totalExpenseBudget totalExpenseActual')
      .sort({ createdAt: -1 });

    // Compute summary stats
    const stats = {
      total:     projects.length,
      active:    projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      totalValue: projects.reduce((s, p) => s + (p.contractValue || 0), 0),
      totalBilled: projects.reduce((s, p) => s + (p.billedAmount || 0), 0)
    };

    res.json({ success: true, count: projects.length, stats, data: projects });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── CREATE project ───────────────────────────────────────────────────────
router.post('/', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const count = await Project.countDocuments({ company: req.user.company }) + 1;
    const project = await Project.create({
      ...req.body,
      company: req.user.company,
      code: `PRJ-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`,
      createdBy: req.user.id
    });

    // Auto-create project budget if budgetCost provided
    if (req.body.budgetCost > 0) {
      const budget = await Budget.create({
        company: req.user.company,
        name: `ميزانية ${project.name}`,
        year: new Date().getFullYear(),
        type: 'project',
        project: project._id,
        totalExpenseBudget: req.body.budgetCost,
        currency: req.body.currency || 'SAR',
        createdBy: req.user.id
      });
      await Project.findByIdAndUpdate(project._id, { budget: budget._id });
    }

    const populated = await Project.findById(project._id)
      .populate('manager','name').populate('customer','name').populate('budget');
    res.status(201).json({ success: true, data: populated });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ─── GET single project with full details ────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const p = await Project.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('manager', 'name email avatar')
      .populate('team.employee', 'name position avatar')
      .populate('customer', 'name phone email')
      .populate('budget')
      .populate('purchaseOrders', 'orderNumber status total')
      .populate('salesOrders', 'orderNumber status total paymentStatus')
      .populate('shipments', 'shipmentNumber status');

    if (!p) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });

    // Compute financial summary
    const financials = {
      contractValue: p.contractValue,
      budgetCost:    p.budgetCost,
      actualCost:    p.actualCost,
      billedAmount:  p.billedAmount,
      paidAmount:    p.paidAmount,
      remainingBilling: p.contractValue - p.billedAmount,
      profitMargin:  p.contractValue > 0
        ? ((p.contractValue - p.actualCost) / p.contractValue * 100).toFixed(1)
        : 0,
      costOverrun:   p.actualCost > p.budgetCost
    };

    res.json({ success: true, data: { ...p.toObject(), financials } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── UPDATE project ───────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const p = await Project.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true })
      .populate('manager','name').populate('customer','name');
    if (!p) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ─── UPDATE task status ───────────────────────────────────────────────────
router.patch('/:id/tasks/:taskId', protect, async (req, res) => {
  try {
    const p = await Project.findOneAndUpdate(
      { ...buildFilter(req, { _id: req.params.id }), 'tasks._id': req.params.taskId },
      { $set: Object.fromEntries(Object.entries(req.body).map(([k,v]) => [`tasks.$.${k}`, v])) },
      { new: true }
    );
    if (!p) return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ─── UPDATE milestone ─────────────────────────────────────────────────────
router.patch('/:id/milestones/:msId', protect, async (req, res) => {
  try {
    const p = await Project.findOneAndUpdate(
      { ...buildFilter(req, { _id: req.params.id }), 'milestones._id': req.params.msId },
      { $set: Object.fromEntries(Object.entries(req.body).map(([k,v]) => [`milestones.$.${k}`, v])) },
      { new: true }
    );
    if (!p) return res.status(404).json({ success: false, message: 'الإنجاز غير موجود' });

    // Auto-update progress based on completed milestones
    const completedWeight = p.milestones
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => sum + (m.weight || 0), 0);
    if (completedWeight > 0) {
      await Project.findByIdAndUpdate(p._id, { progressPct: Math.min(100, completedWeight) });
    }

    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ─── Link PO/SO to project ────────────────────────────────────────────────
router.post('/:id/link', protect, async (req, res) => {
  try {
    const { type, documentId } = req.body;
    const field = type === 'po' ? 'purchaseOrders' : type === 'so' ? 'salesOrders' : 'shipments';
    const p = await Project.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }),
      { $addToSet: { [field]: documentId } },
      { new: true }
    );
    if (!p) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// ─── GET project dashboard stats ──────────────────────────────────────────
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    const [total, byStatus] = await Promise.all([
      Project.countDocuments(filter),
      Project.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$contractValue' }, totalCost: { $sum: '$actualCost' } } }
      ])
    ]);
    res.json({ success: true, data: { total, byStatus } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
