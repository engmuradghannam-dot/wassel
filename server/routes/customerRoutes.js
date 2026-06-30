const express  = require('express');
const router   = express.Router();
const { protect, authorize, getCompany } = require('../middleware/auth');
const Customer = require('../models/Customer');
const { buildFilter } = require('../middleware/tenant');

// GET all
router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    const { search, category, isActive } = req.query;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (category) filter.category = category;
    if (search) {
      const q = new RegExp(search, 'i');
      filter.$or = [
        { name:q }, { nameEn:q }, { email:q },
        { phone:q }, { commercialReg:q }, { vatNumber:q }, { code:q }
      ];
    }
    const customers = await Customer.find(filter).sort({ name:1 }).limit(300);
    res.json({ success:true, count:customers.length, data:customers });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// POST create — collision-proof code generation with retry
router.post('/', protect, async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

  const MAX_RETRIES = 5;
  let lastErr = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Unique code: timestamp-based suffix avoids race conditions entirely
      const code = req.body.code ||
        `CUS-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*100)}`;

      const customer = await Customer.create({
        ...req.body,
        company:   co,
        code,
        createdBy: req.user._id
      });
      return res.status(201).json({ success:true, data:customer });
    } catch (e) {
      lastErr = e;
      // Duplicate key on code → retry with a new code
      if (e.code === 11000 && Object.keys(e.keyPattern||{}).includes('code')) {
        continue;
      }
      // Any other error → fail immediately with real reason
      console.error('Customer create error:', e.message, '| company:', co, '| body:', JSON.stringify(req.body));
      return res.status(400).json({
        success:false,
        message: e.message,
        detail:  e.message,
        code:    e.code || null,
      });
    }
  }

  console.error('Customer create failed after retries:', lastErr?.message);
  res.status(400).json({ success:false, message:'فشل إنشاء العميل بعد عدة محاولات: ' + (lastErr?.message||''), detail: lastErr?.message });
});

// GET single
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne(buildFilter(req, { _id:req.params.id }));
    if (!customer) return res.status(404).json({ success:false, message:'العميل غير موجود' });
    res.json({ success:true, data:customer });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// PUT update
router.put('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      buildFilter(req, { _id:req.params.id }),
      req.body,
      { new:true, runValidators:true }
    );
    if (!customer) return res.status(404).json({ success:false, message:'العميل غير موجود' });
    res.json({ success:true, data:customer });
  } catch (e) { res.status(400).json({ success:false, message:e.message, detail:e.message }); }
});

// DELETE (soft delete)
router.delete('/:id', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    await Customer.findOneAndUpdate(buildFilter(req, { _id:req.params.id }), { isActive:false });
    res.json({ success:true, message:'تم أرشفة العميل' });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
