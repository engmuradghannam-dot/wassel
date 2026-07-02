const BL = require('../services/businessLogic');
const express  = require('express');
const router   = express.Router();
const { protect, authorize, getCompany } = require('../middleware/auth');
const SalesOrder = require('../models/SalesOrder');
const { buildFilter } = require('../middleware/tenant');
const { getNextSequence } = require('../services/sequence');

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
    const { formatted: orderNumber } = await getNextSequence(getCompany(req), 'sales_order', { prefix: 'SO' });
    const order  = await SalesOrder.create({
      ...rest, ...totals,
      company: getCompany(req),
      orderNumber,
      remainingAmount: totals.total,
      createdBy: req.user.id
    });

    // ── الترابط المحاسبي: إذا أُنشئت كفاتورة مباشرة (وليست عرض سعر) نُرحّل
    // قيد الإيراد فوراً — Dr ذمم مدينة | Cr إيرادات + ضريبة مخرجات
    if (order.type === 'invoice') {
      const Acct = require('../services/accountingPosting');
      Acct.postSalesInvoice({ company: order.company, so: order, userId: req.user.id })
        .catch(err => console.error('[SalesOrder] فشل ترحيل قيد الفاتورة:', err.message));
    }

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

// Deliver sales order → update inventory (stock out)
router.put('/:id/deliver', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const filter = buildFilter(req, { _id: req.params.id });
    const order  = await SalesOrder.findOne(filter).populate('items.inventory');
    if (!order) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    if (!['confirmed','processing'].includes(order.status)) {
      return res.status(400).json({ success:false, message:'الطلب يجب أن يكون مؤكداً قبل التسليم' });
    }

    // Ship inventory
    await BL.shipStock({
      company:      order.company,
      salesOrderId: order._id,
      userId:       req.user._id,
      items: order.items
        .filter(i => i.inventory)
        .map(i => ({ inventoryId: i.inventory._id || i.inventory, qty: i.quantity })),
    });

    order.status      = 'delivered';
    order.deliveredAt = new Date();
    await order.save();

    // Update customer balance
    await BL.updatePartyBalance({ model:'Customer', id:order.customer, amount:order.total, direction:'debit' });

    res.json({ success:true, data:order, message:'تم التسليم وتحديث المخزون' });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});


// ── Convert quotation to invoice ──────────────────────────────────────────
router.put('/:id/convert-to-invoice', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const order = await SalesOrder.findOne(buildFilter(req, { _id: req.params.id }));
    if (!order) return res.status(404).json({ success: false, message: 'عرض السعر غير موجود' });
    if (order.type !== 'quotation') return res.status(400).json({ success: false, message: 'هذا ليس عرض سعر' });

    const { formatted: invoiceNum } = await getNextSequence(order.company, 'invoice', { prefix: 'INV' });

    order.type          = 'invoice';
    order.status        = 'confirmed';
    order.invoiceNumber = invoiceNum;
    order.orderDate     = new Date();
    if (req.body.dueDate) order.dueDate = req.body.dueDate;
    await order.save();

    // ── الترابط المحاسبي: تحويل عرض السعر لفاتورة يُرحّل قيد الإيراد تلقائياً
    const Acct = require('../services/accountingPosting');
    Acct.postSalesInvoice({ company: order.company, so: order, userId: req.user.id })
      .catch(err => console.error('[SalesOrder] فشل ترحيل قيد تحويل عرض السعر لفاتورة:', err.message));

    res.json({ success: true, data: order, message: `تم تحويل عرض السعر إلى فاتورة رقم ${invoiceNum}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Record customer payment (تحصيل دفعة من عميل) ──────────────────────────
router.put('/:id/record-payment', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success:false, message:'المبلغ غير صحيح' });

    const order = await SalesOrder.findOne(buildFilter(req, { _id: req.params.id }));
    if (!order) return res.status(404).json({ success:false, message:'الطلب غير موجود' });

    const updated = await BL.updateSalesPaymentStatus(order._id, +amount, { userId: req.user.id, method: method || 'bank' });

    res.json({ success:true, data:updated, message:'تم تسجيل تحصيل الدفعة وترحيلها محاسبياً' });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
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

// ── تصدير PDF (عرض سعر أو فاتورة، حسب type السجل) ──────────────────────────
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const order = await SalesOrder.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('customer', 'name commercialReg vatNumber phone address')
      .populate('company');
    if (!order) return res.status(404).json({ success: false, message: 'السجل غير موجود' });

    const Company = require('../models/Company');
    const company = await Company.findById(order.company);

    const { generateDocumentPDF } = require('../services/pdfService');
    const docType = order.type === 'invoice' ? 'invoice' : 'quotation';

    const pdfBuffer = await generateDocumentPDF({
      docType,
      company: {
        name: company?.name, nameEn: company?.nameEn,
        commercialReg: company?.commercialReg, vatNumber: company?.vatNumber,
        address: company?.address, phone: company?.phone,
      },
      party: {
        name: order.customer?.name,
        commercialReg: order.customer?.commercialReg,
        vatNumber: order.customer?.vatNumber,
        phone: order.customer?.phone,
      },
      docNumber: order.invoiceNumber || order.orderNumber,
      date: order.orderDate,
      dueDate: docType === 'quotation' ? order.validUntil : order.dueDate,
      items: order.items,
      totals: { subtotal: order.subtotal, taxAmount: order.taxAmount, total: order.total },
      notes: order.notes,
    });

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${docType}-${order.invoiceNumber || order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message, detail: e.message });
  }
});

module.exports = router;
