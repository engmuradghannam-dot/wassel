const express = require('express');
const router = express.Router();
const { protect, authorize, getCompany } = require('../middleware/auth');
const { buildFilter } = require('../middleware/tenant');
const {  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, receivePurchaseOrder, deletePurchaseOrder } = require('../controllers/purchaseOrderController');

router.route('/')
  .get( protect, getPurchaseOrders)
  .post(protect, authorize('owner','admin','manager'), createPurchaseOrder);

router.route('/:id')
  .get(   protect, getPurchaseOrder)
  .put(   protect, authorize('owner','admin','manager'), updatePurchaseOrder)
  .delete(protect, authorize('owner','admin'), deletePurchaseOrder);

router.put('/:id/receive', protect, authorize('owner','admin','manager'), receivePurchaseOrder);

// ── تصدير PDF لأمر الشراء ────────────────────────────────────────────────
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const PurchaseOrder = require('../models/PurchaseOrder');
    const Company = require('../models/Company');

    const order = await PurchaseOrder.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('supplier', 'name commercialReg vatNumber phone address');
    if (!order) return res.status(404).json({ success: false, message: 'أمر الشراء غير موجود' });

    const company = await Company.findById(getCompany(req));
    const { generateDocumentPDF } = require('../services/pdfService');

    const pdfBuffer = await generateDocumentPDF({
      docType: 'purchase_order',
      company: {
        name: company?.name, nameEn: company?.nameEn,
        commercialReg: company?.commercialReg, vatNumber: company?.vatNumber,
        address: company?.address, phone: company?.phone,
      },
      party: {
        name: order.supplier?.name,
        commercialReg: order.supplier?.commercialReg,
        vatNumber: order.supplier?.vatNumber,
        phone: order.supplier?.phone,
      },
      docNumber: order.orderNumber,
      date: order.createdAt,
      items: order.items,
      totals: {
        subtotal: order.subtotal ?? order.total,
        taxAmount: order.taxAmount ?? 0,
        total: order.total ?? order.totalAmount,
      },
      notes: order.notes,
    });

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="PO-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message, detail: e.message });
  }
});

// ── رفع مرفق لأمر الشراء (عرض سعر عند الإنشاء، فاتورة ضريبية عند طلب الدفع) ──
// docType: quotation | tax_invoice | pro_forma | boq | contract | other
router.post('/:id/documents', protect, async (req, res) => {
  const { upload: uploadAny, saveFile } = require('../middleware/fileStorage');
  uploadAny.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success: false, message: uploadErr.message });
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });
      const co = getCompany(req);
      const PurchaseOrder = require('../models/PurchaseOrder');

      const order = await PurchaseOrder.findOne(buildFilter(req, { _id: req.params.id }));
      if (!order) return res.status(404).json({ success: false, message: 'أمر الشراء غير موجود' });

      const docType = req.body.docType || 'other';
      const saved = await saveFile(req.file, {
        company: co,
        uploadedBy: req.user._id,
        module: 'purchase_order',
        recordId: req.params.id,
        docType,
      });

      order.attachments.push({
        name: saved.filename, url: saved.url,
        type: docType, uploadedBy: req.user._id,
      });

      // ── طلب الدفع لا يكتمل بدون إرفاق الفاتورة الضريبية فعلياً ──────────
      if (docType === 'tax_invoice') {
        order.paymentRequest = order.paymentRequest || {};
        order.paymentRequest.taxInvoiceUrl = saved.url;
        order.paymentRequest.taxInvoiceNo = req.body.invoiceNo || order.paymentRequest.taxInvoiceNo;
      }

      await order.save();
      res.status(201).json({ success: true, data: saved, attachments: order.attachments });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message, detail: err.message });
    }
  });
});

// ── طلب الدفع لأمر الشراء — يرفض الطلب إن لم تُرفع فاتورة ضريبية أولاً ────────
router.put('/:id/request-payment', protect, authorize('owner','admin','manager'), async (req, res) => {
  try {
    const PurchaseOrder = require('../models/PurchaseOrder');
    const order = await PurchaseOrder.findOne(buildFilter(req, { _id: req.params.id }));
    if (!order) return res.status(404).json({ success: false, message: 'أمر الشراء غير موجود' });

    const hasTaxInvoice = order.attachments?.some(a => a.type === 'tax_invoice');
    if (!hasTaxInvoice) {
      return res.status(400).json({
        success: false,
        message: 'يجب رفع الفاتورة الضريبية أولاً قبل تقديم طلب الدفع',
      });
    }

    order.paymentRequest = order.paymentRequest || {};
    order.paymentRequest.requested = true;
    order.paymentRequest.requestedAt = new Date();
    order.paymentRequest.requestedBy = req.user._id;
    order.paymentRequest.paymentStatus = 'pending';
    await order.save();

    res.json({ success: true, data: order, message: 'تم تقديم طلب الدفع' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message, detail: e.message });
  }
});

module.exports = router;