const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/auth');
const SalesOrder = require('../models/SalesOrder');
const { buildFilter } = require('../middleware/tenant');

const calcTotals = (items = []) => {
  let subtotal = 0, taxAmount = 0;
  const processed = items.map(item => {
    const lineTotal = item.quantity * item.unitPrice * (1 - (item.discount||0)/100);
    const lineTax   = lineTotal * (item.taxRate||15) / 100;
    subtotal  += lineTotal;
    taxAmount += lineTax;
    return { ...item, total: lineTotal + lineTax };
  });
  return { items: processed, subtotal, taxAmount, total: subtotal + taxAmount };
};

router.get('/', protect, async (req, res) => {
  try {
    const { status, type, customer } = req.query;
    const filter = buildFilter(req, {});
    if (status)   filter.status = status;
    if (type)     filter.type   = type;
    if (customer) filter.customer = customer;
    const orders = await SalesOrder.find(filter)
      .populate('customer', 'name code')
      .populate('salesRep', 'name')
      .sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const totals = calcTotals(items);
    const count  = await SalesOrder.countDocuments({ company: req.user.company }) + 1;
    const order  = await SalesOrder.create({
      ...rest, ...totals,
      company: req.user.company,
      orderNumber: `SO-${new Date().getFullYear()}-${String(count).padStart(5,'0')}`,
      remainingAmount: totals.total,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: order });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await SalesOrder.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('customer').populate('items.inventory', 'name sku unit');
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: order });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    const update = items ? { ...rest, ...calcTotals(items) } : rest;
    const order  = await SalesOrder.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: order });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;

// ── Convert quotation to invoice ──────────────────────────────────────────
router.put('/:id/convert-to-invoice', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const order = await SalesOrder.findOne(buildFilter(req, { _id: req.params.id }));
    if (!order) return res.status(404).json({ success: false, message: 'عرض السعر غير موجود' });
    if (order.type !== 'quotation') return res.status(400).json({ success: false, message: 'هذا ليس عرض سعر' });

    const invCount   = await SalesOrder.countDocuments({ company: order.company, type: 'invoice' }) + 1;
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(invCount).padStart(5,'0')}`;

    order.type          = 'invoice';
    order.status        = 'confirmed';
    order.invoiceNumber = invoiceNum;
    order.orderDate     = new Date();
    if (req.body.dueDate) order.dueDate = req.body.dueDate;
    await order.save();

    res.json({ success: true, data: order, message: `تم تحويل عرض السعر إلى فاتورة رقم ${invoiceNum}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Search customers (for autocomplete) ───────────────────────────────────
router.get('/search/customers', protect, async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    const { buildFilter } = require('../middleware/tenant');
    const q = req.query.q || '';
    const filter = buildFilter(req, {});
    if (q) filter.$or = [
      { name:  { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { commercialReg: { $regex: q, $options: 'i' } },
      { vatNumber:     { $regex: q, $options: 'i' } },
      { code:          { $regex: q, $options: 'i' } },
    ];
    const customers = await Customer.find(filter).limit(30).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
