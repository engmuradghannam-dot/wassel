const express = require('express');
const router  = express.Router();
const { protect, authorize, getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');
const LegalCase = require('../models/legal/LegalCase');
const PurchaseOrder = require('../models/PurchaseOrder');

router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter.type   = req.query.type;
    const cases = await LegalCase.find(filter)
      .populate('responsibleEmployee','name position')
      .sort({ createdAt:-1 }).limit(100);
    res.json({ success:true, count:cases.length, data:cases });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const c = await LegalCase.findOne(buildFilter(req,{_id:req.params.id}))
      .populate('responsibleEmployee','name')
      .populate('financialJudgment.purchaseOrder','orderNumber status');
    if (!c) return res.status(404).json({ success:false, message:'القضية غير موجودة' });
    res.json({ success:true, data:c });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    const lc = await LegalCase.create({ ...req.body, company:co, createdBy:req.user._id });
    res.status(201).json({ success:true, data:lc });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const lc = await LegalCase.findOneAndUpdate(buildFilter(req,{_id:req.params.id}), req.body, {new:true});
    if (!lc) return res.status(404).json({ success:false, message:'القضية غير موجودة' });
    res.json({ success:true, data:lc });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

// Convert financial judgment → PO
router.put('/:id/convert-to-po', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const co = getCompany(req);
    const lc = await LegalCase.findOne(buildFilter(req,{_id:req.params.id}));
    if (!lc) return res.status(404).json({ success:false, message:'القضية غير موجودة' });
    if (!lc.financialJudgment?.hasFinancial || lc.financialJudgment.direction !== 'payable') {
      return res.status(400).json({ success:false, message:'لا يوجد حكم مالي واجب الدفع' });
    }
    const count = await PurchaseOrder.countDocuments({ company:co }) + 1;
    const po = await PurchaseOrder.create({
      company: co,
      supplier: req.body.supplier,
      orderNumber: `PO-LEGAL-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`,
      legalCase: lc._id,
      items: [{ name:`حكم قضائي - ${lc.title}`, quantity:1, unitPrice:lc.financialJudgment.amount, taxRate:0, total:lc.financialJudgment.amount }],
      subtotal: lc.financialJudgment.amount, taxAmount:0, total:lc.financialJudgment.amount, totalAmount:lc.financialJudgment.amount,
      notes: `حكم قضائي رقم ${lc.caseNumber}`,
      createdBy: req.user._id,
    });
    lc.financialJudgment.purchaseOrder = po._id;
    lc.financialJudgment.convertedAt = new Date();
    await lc.save();
    res.json({ success:true, data:po, message:`تم إنشاء أمر الدفع ${po.orderNumber}` });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

// Add hearing
router.post('/:id/hearings', protect, async (req, res) => {
  try {
    const lc = await LegalCase.findOne(buildFilter(req,{_id:req.params.id}));
    if (!lc) return res.status(404).json({ success:false, message:'القضية غير موجودة' });
    lc.hearings.push({ ...req.body, addedBy:req.user._id });
    if (req.body.nextDate) lc.nextHearing = req.body.nextDate;
    await lc.save();
    res.json({ success:true, data:lc });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

module.exports = router;
