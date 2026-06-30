const express = require('express');
const router  = express.Router();
const { protect, authorize, getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');
const PR = require('../models/PurchaseRequest');
const Employee = require('../models/Employee');
const PurchaseOrder = require('../models/PurchaseOrder');

// GET all PRs (filtered by company + role)
router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.project) filter.project = req.query.project;
    const role = req.user.role;
    // Employees see only their own PRs; managers/admins see all
    if (!['owner','admin','superadmin','manager'].includes(role)) {
      const emp = await Employee.findOne({ user: req.user._id, company: getCompany(req) });
      if (emp) filter.requestedBy = emp._id;
    }
    const prs = await PR.find(filter)
      .populate('requestedBy','name position department')
      .populate('project','name code')
      .populate('currentApprover','name position')
      .sort({ createdAt:-1 }).limit(200);
    res.json({ success:true, count:prs.length, data:prs });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// GET single PR
router.get('/:id', protect, async (req, res) => {
  try {
    const pr = await PR.findOne(buildFilter(req,{_id:req.params.id}))
      .populate('requestedBy','name position department')
      .populate('project','name code')
      .populate('approvalChain.approver','name position')
      .populate('purchaseOrder','orderNumber status');
    if (!pr) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    res.json({ success:true, data:pr });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// CREATE PR — any employee
router.post('/', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    
    // Find employee record for this user
    const emp = await Employee.findOne({ user: req.user._id, company: co });
    const requestedBy = req.body.requestedBy || emp?._id;
    if (!requestedBy) return res.status(400).json({ success:false, message:'يرجى ربط حسابك بسجل موظف أولاً' });

    // Build approval chain: manager → director → procurement
    const employee = await Employee.findById(requestedBy).populate('manager director');
    const chain = [];
    if (employee?.manager) chain.push({ approver:employee.manager._id, role:'manager', status:'pending' });
    if (employee?.director) chain.push({ approver:employee.director._id, role:'director', status:'pending' });
    chain.push({ approver:null, role:'procurement', status:'pending' }); // procurement team

    const pr = await PR.create({
      ...req.body, company:co,
      requestedBy, approvalChain:chain,
      currentApprover: chain[0]?.approver || null,
      status: req.body.status || 'draft',
      createdBy: req.user._id,
    });

    res.status(201).json({ success:true, data:pr });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

// SUBMIT PR for approval
router.put('/:id/submit', protect, async (req, res) => {
  try {
    const pr = await PR.findOne(buildFilter(req,{_id:req.params.id}));
    if (!pr) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    pr.status = 'submitted';
    await pr.save();
    res.json({ success:true, data:pr, message:'تم إرسال الطلب للاعتماد' });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// APPROVE / REJECT at current step
router.put('/:id/approve', protect, async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'approve' | 'reject'
    const co  = getCompany(req);
    const pr  = await PR.findOne(buildFilter(req,{_id:req.params.id}));
    if (!pr) return res.status(404).json({ success:false, message:'الطلب غير موجود' });

    const emp = await Employee.findOne({ user:req.user._id, company:co });

    // Find current pending step
    const stepIdx = pr.approvalChain.findIndex(s => s.status==='pending');
    if (stepIdx === -1) return res.status(400).json({ success:false, message:'لا يوجد خطوة اعتماد معلقة' });

    pr.approvalChain[stepIdx].status  = action==='approve'?'approved':'rejected';
    pr.approvalChain[stepIdx].comment = comment;
    pr.approvalChain[stepIdx].actionAt= new Date();

    if (action === 'reject') {
      pr.status = 'rejected';
      pr.rejectionReason = comment;
    } else {
      // Move to next step
      const nextStep = pr.approvalChain.find((s,i)=>i>stepIdx&&s.status==='pending');
      if (nextStep) {
        pr.currentApprover = nextStep.approver;
        pr.status = nextStep.role==='procurement' ? 'procurement_review' : 
                    nextStep.role==='director' ? 'director_review' : 'manager_review';
      } else {
        pr.status = 'approved';
        pr.currentApprover = null;
      }
    }
    await pr.save();
    res.json({ success:true, data:pr, message:action==='approve'?'تم الاعتماد':'تم الرفض' });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

// CONVERT PR → PO
router.put('/:id/convert-to-po', protect, authorize('owner','admin','superadmin','manager'), async (req, res) => {
  try {
    const co = getCompany(req);
    const pr = await PR.findOne(buildFilter(req,{_id:req.params.id}));
    if (!pr) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    if (!['approved','procurement_review'].includes(pr.status)) {
      return res.status(400).json({ success:false, message:'الطلب يجب أن يكون معتمداً أولاً' });
    }

    const count = await PurchaseOrder.countDocuments({ company:co }) + 1;
    const po = await PurchaseOrder.create({
      company: co,
      supplier: req.body.supplier,
      orderNumber: `PO-${new Date().getFullYear()}-${String(count).padStart(5,'0')}`,
      purchaseRequest: pr._id,
      project: pr.project,
      items: pr.items.map(i=>({ name:i.description, quantity:i.quantity, unit:i.unit, unitPrice:i.estimatedPrice||0, taxRate:15, total:i.quantity*(i.estimatedPrice||0) })),
      subtotal: pr.estimatedTotal,
      taxAmount: pr.estimatedTotal*0.15,
      total:  pr.estimatedTotal*1.15,
      totalAmount: pr.estimatedTotal*1.15,
      notes: req.body.notes || pr.notes,
      createdBy: req.user._id,
    });

    pr.status = 'converted';
    pr.purchaseOrder = po._id;
    pr.convertedAt = new Date();
    pr.convertedBy = req.user._id;
    await pr.save();

    res.json({ success:true, data:po, message:`تم تحويل طلب الشراء إلى أمر شراء ${po.orderNumber}` });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

// UPDATE PR
router.put('/:id', protect, async (req, res) => {
  try {
    const pr = await PR.findOneAndUpdate(buildFilter(req,{_id:req.params.id}), req.body, {new:true});
    if (!pr) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    res.json({ success:true, data:pr });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

// ── رفع مرفق لطلب الشراء (BOQ، عرض سعر، فاتورة...) ─────────────────────────
// docType: boq | quotation | invoice | other
router.post('/:id/documents', protect, async (req, res) => {
  const { upload: uploadAny, saveFile } = require('../middleware/fileStorage');
  uploadAny.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success: false, message: uploadErr.message });
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });
      const co = getCompany(req);

      const pr = await PR.findOne(buildFilter(req, { _id: req.params.id }));
      if (!pr) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      const saved = await saveFile(req.file, {
        company: co,
        uploadedBy: req.user._id,
        module: 'purchase_request',
        recordId: req.params.id,
        docType: req.body.docType || 'other',
      });

      pr.attachments.push({
        name: saved.filename, url: saved.url,
        type: req.body.docType || 'other', uploadedBy: req.user._id,
      });
      await pr.save();

      res.status(201).json({ success: true, data: saved, attachments: pr.attachments });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message, detail: err.message });
    }
  });
});

module.exports = router;
