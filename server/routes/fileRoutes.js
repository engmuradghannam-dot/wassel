/**
 * routes/fileRoutes.js
 * ───────────────────────────────────────────────────────────────────────
 * نقاط نهاية عامة لرفع/تنزيل/حذف الملفات، تُستخدم من أي قسم في النظام
 * (تسجيل الشركة، ملفات الموظفين، مرفقات أوامر الشراء، طلبات الشراء،
 * فواتير الدفع، إلخ). كل ملف مرتبط بـ company + module + recordId
 * حتى يمكن لاحقاً جلب كل مرفقات سجل معيّن أو حذفها معاً.
 *
 * POST   /api/files/upload          - رفع ملف واحد، يُرجع رابط دائم
 * GET    /api/files/:id             - تنزيل/عرض الملف (محمي بصلاحية الشركة)
 * GET    /api/files/list/:module/:recordId - كل ملفات سجل معيّن
 * DELETE /api/files/:id             - حذف ملف
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, getCompany } = require('../middleware/auth');
const { upload, getBucket, saveFileToGridFS } = require('../middleware/fileStorage');

// ── رفع ملف ──────────────────────────────────────────────────────────────
// module: نوع القسم (company_docs, employee_docs, purchase_order, purchase_request, payment, quotation, invoice...)
// recordId: معرّف السجل المرتبط (اختياري — مثلاً أثناء تسجيل شركة جديدة لا يوجد company._id بعد)
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });

    const co = getCompany(req);
    const { module: moduleType, recordId, docType } = req.body;

    const saved = await saveFileToGridFS(req.file, {
      company: co || null,
      uploadedBy: req.user._id,
      module: moduleType || 'general',
      recordId: recordId || null,
      docType: docType || 'other', // مثل: quotation, tax_invoice, boq, commercial_reg, iqama...
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, detail: err.message });
  }
});

// ── تنزيل/عرض ملف ────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ success: false, message: 'الملف غير موجود' });
    const file = files[0];

    // التحقق من الصلاحية: الملف يجب أن ينتمي لنفس شركة المستخدم، إلا لو superadmin
    const co = getCompany(req);
    const fileCo = file.metadata?.company?.toString();
    if (req.user.role !== 'superadmin' && fileCo && co && fileCo !== co) {
      return res.status(403).json({ success: false, message: 'لا تملك صلاحية الوصول لهذا الملف' });
    }

    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(file.metadata?.originalName || file.filename)}"`);

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── كل ملفات سجل معيّن (مثلاً كل مرفقات أمر شراء واحد) ────────────────────
router.get('/list/:module/:recordId', protect, async (req, res) => {
  try {
    const bucket = getBucket();
    const co = getCompany(req);
    const filter = {
      'metadata.module': req.params.module,
      'metadata.recordId': req.params.recordId,
    };
    if (co) filter['metadata.company'] = co;

    const files = await bucket.find(filter).sort({ uploadDate: -1 }).toArray();
    res.json({
      success: true,
      data: files.map(f => ({
        fileId: f._id.toString(),
        filename: f.metadata?.originalName || f.filename,
        url: `/api/files/${f._id.toString()}`,
        size: f.length,
        mimeType: f.contentType,
        docType: f.metadata?.docType || 'other',
        uploadedAt: f.metadata?.uploadedAt || f.uploadDate,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── حذف ملف ──────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ success: false, message: 'الملف غير موجود' });

    const co = getCompany(req);
    const fileCo = files[0].metadata?.company?.toString();
    if (req.user.role !== 'superadmin' && fileCo && co && fileCo !== co) {
      return res.status(403).json({ success: false, message: 'لا تملك صلاحية حذف هذا الملف' });
    }

    await bucket.delete(fileId);
    res.json({ success: true, message: 'تم حذف الملف' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
