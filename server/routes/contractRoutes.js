const express = require('express');
const router  = express.Router();
const { protect, getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');
const Contract = require('../models/legal/Contract');

router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter.type   = req.query.type;
    const contracts = await Contract.find(filter)
      .populate('employee','name position').populate('project','name').populate('supplier','name').populate('customer','name')
      .sort({ createdAt:-1 }).limit(100);
    res.json({ success:true, count:contracts.length, data:contracts });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    const contract = await Contract.create({ ...req.body, company:co, createdBy:req.user._id });
    res.status(201).json({ success:true, data:contract });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const contract = await Contract.findOne(buildFilter(req,{_id:req.params.id}));
    if (!contract) return res.status(404).json({ success:false, message:'العقد غير موجود' });
    res.json({ success:true, data:contract });
  } catch(e){ res.status(500).json({ success:false, message:e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const contract = await Contract.findOneAndUpdate(buildFilter(req,{_id:req.params.id}), req.body, {new:true});
    if (!contract) return res.status(404).json({ success:false, message:'العقد غير موجود' });
    res.json({ success:true, data:contract });
  } catch(e){ res.status(400).json({ success:false, message:e.message }); }
});

module.exports = router;
