const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Customer = require('../models/Customer');
const { buildFilter } = require('../middleware/tenant');

router.get('/', protect, async (req, res) => {
  try {
    const { search, category, isActive } = req.query;
    const filter = buildFilter(req, {});
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (category) filter.category = category;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { code:  { $regex: search, $options: 'i' } }
    ];
    const customers = await Customer.find(filter).sort({ name: 1 }).limit(200);
    res.json({ success: true, count: customers.length, data: customers });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, company: req.user.company, createdBy: req.user.id });
    res.status(201).json({ success: true, data: customer });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne(buildFilter(req, { _id: req.params.id }));
    if (!customer) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    res.json({ success: true, data: customer });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    res.json({ success: true, data: customer });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.delete('/:id', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    await Customer.findOneAndUpdate(buildFilter(req, { _id: req.params.id }), { isActive: false });
    res.json({ success: true, message: 'تم أرشفة العميل' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
