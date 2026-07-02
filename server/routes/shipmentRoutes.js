const express  = require('express');
const router   = express.Router();
const { protect, authorize, getCompany} = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const { buildFilter } = require('../middleware/tenant');
const { getNextSequence } = require('../services/sequence');

router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter.type   = req.query.type;
    const shipments = await Shipment.find(filter)
      .populate('purchaseOrder','orderNumber').populate('salesOrder','orderNumber')
      .sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const { formatted: shipmentNumber } = await getNextSequence(getCompany(req), 'shipment', { prefix: 'SHP' });
    const shipment = await Shipment.create({
      ...req.body,
      company: getCompany(req),
      shipmentNumber,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: shipment });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const s = await Shipment.findOne(buildFilter(req, { _id: req.params.id }));
    if (!s) return res.status(404).json({ success: false, message: 'الشحنة غير موجودة' });
    res.json({ success: true, data: s });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const s = await Shipment.findOneAndUpdate(buildFilter(req, { _id: req.params.id }), req.body, { new: true });
    if (!s) return res.status(404).json({ success: false, message: 'الشحنة غير موجودة' });
    res.json({ success: true, data: s });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Add tracking event
router.post('/:id/track', protect, async (req, res) => {
  try {
    const s = await Shipment.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }),
      { $push: { events: { ...req.body, date: new Date() } }, status: req.body.status || undefined },
      { new: true }
    );
    res.json({ success: true, data: s });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
