const express  = require('express');
const router   = express.Router();
const { protect, authorize, getCompany} = require('../middleware/auth');
const Project  = require('../models/Project');
const Budget   = require('../models/Budget');
const { buildFilter } = require('../middleware/tenant');
const { getNextSequence } = require('../services/sequence');

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
    const { formatted: code } = await getNextSequence(getCompany(req), 'project', { prefix: 'PRJ', pad: 4 });
    const project = await Project.create({
      ...req.body,
      company: getCompany(req),
      code,
      createdBy: req.user.id
    });

    // Auto-create project budget if budgetCost provided
    if (req.body.budgetCost > 0) {
      const budget = await Budget.create({
        company: getCompany(req),
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

// ─── رفع مستند على المشروع (عقد، BOQ، مخطط، تقرير تقدم...) ──────────────
// docType: contract | boq | drawing | permit | progress_report | other
router.post('/:id/documents', protect, async (req, res) => {
  const { upload: uploadAny, saveFile } = require('../middleware/fileStorage');
  uploadAny.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success: false, message: uploadErr.message });
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });
      const co = getCompany(req);
      const project = await Project.findOne(buildFilter(req, { _id: req.params.id }));
      if (!project) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });

      const docType = req.body.docType || 'other';
      const saved = await saveFile(req.file, {
        company: co, uploadedBy: req.user._id,
        module: 'project', recordId: req.params.id, docType,
      });

      project.documents.push({
        name: saved.filename, url: saved.url, type: docType,
        uploadedBy: req.user._id,
      });
      await project.save();

      res.status(201).json({ success: true, data: saved, documents: project.documents });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message, detail: err.message });
    }
  });
});

// ─── تصدير تقرير PDF شامل للمشروع (نظرة عامة + مالية + إنجازات) ──────────
router.get('/:id/report', protect, async (req, res) => {
  try {
    const Company = require('../models/Company');
    const { generateReportPDF } = require('../services/pdfService');

    const p = await Project.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('manager', 'name').populate('customer', 'name')
      .populate('budget').populate('tasks.assignee', 'name');
    if (!p) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    const company = await Company.findById(getCompany(req));

    const sections = [
      {
        heading: 'نظرة عامة / Overview', type: 'kv',
        data: {
          'الحالة / Status': p.status,
          'مدير المشروع / Manager': p.manager?.name || '-',
          'العميل / Customer': p.customer?.name || '-',
          'نسبة الإنجاز / Progress': `${p.progressPct || 0}%`,
          'تاريخ البدء / Start': p.startDate ? new Date(p.startDate).toLocaleDateString('en-GB') : '-',
          'تاريخ الانتهاء المتوقع / End': p.endDate ? new Date(p.endDate).toLocaleDateString('en-GB') : '-',
        },
      },
      {
        heading: 'الملخص المالي / Financial Summary', type: 'kv',
        data: {
          'قيمة العقد / Contract Value': (p.contractValue || 0).toLocaleString(),
          'الميزانية / Budget Cost': (p.budgetCost || 0).toLocaleString(),
          'التكلفة الفعلية / Actual Cost': (p.actualCost || 0).toLocaleString(),
          'المبلغ المُفوتَر / Billed': (p.billedAmount || 0).toLocaleString(),
          'المبلغ المُحصَّل / Paid': (p.paidAmount || 0).toLocaleString(),
          'تجاوز الميزانية؟ / Over Budget': (p.actualCost || 0) > (p.budgetCost || 0) ? 'نعم / Yes' : 'لا / No',
        },
      },
    ];

    if (p.milestones?.length) {
      sections.push({
        heading: 'الإنجازات / Milestones', type: 'table',
        columns: ['Milestone', 'Status', 'Weight %', 'Due Date'],
        widths: [220, 100, 90, 105],
        rows: p.milestones.map(m => [m.name, m.status, m.weight, m.dueDate ? new Date(m.dueDate).toLocaleDateString('en-GB') : '-']),
      });
    }
    if (p.tasks?.length) {
      sections.push({
        heading: 'المهام / Tasks', type: 'table',
        columns: ['Task', 'Status', 'Assignee'],
        widths: [280, 120, 115],
        rows: p.tasks.map(t => [t.title || t.name, t.status, t.assignee?.name || '-']),
      });
    }

    const pdfBuffer = await generateReportPDF({
      title: 'PROJECT REPORT', subtitle: p.name,
      company: { name: company?.name, nameEn: company?.nameEn },
      docNumber: p.code, date: new Date(), sections,
    });

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="Project-${p.code}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) { res.status(500).json({ success: false, message: e.message, detail: e.message }); }
});

module.exports = router;
