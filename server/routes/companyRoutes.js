const express = require('express');
const router  = express.Router();
const companyController = require('../controllers/companyController');
const { protect, authorize, getCompany } = require('../middleware/auth');
const upload = require('../middleware/upload'); // رفع شعار الشركة فقط (صورة) — لم يُمس
const { upload: uploadAny, saveFileToGridFS } = require('../middleware/fileStorage');
const Company = require('../models/Company');

// GET /api/company — get company settings
router.get('/', protect, companyController.getCompany);

// PUT /api/company — update company settings (admin or superadmin)
router.put('/', protect, authorize('admin', 'superadmin'), companyController.updateCompany);

// PUT /api/company/location — update location
router.put('/location', protect, authorize('admin', 'superadmin'), companyController.updateLocation);

// POST /api/company/logo — upload logo
router.post('/logo', protect, authorize('admin', 'superadmin'), upload.single('logo'), companyController.uploadLogo);

// GET /api/company/all — all companies (superadmin only)
router.get('/all', protect, authorize('superadmin'), companyController.getAllCompanies);

// ── رفع مستند رسمي للشركة (سجل تجاري، شهادة ضريبية، رخصة...) ──────────────
// docType: commercial_reg | vat_certificate | license | bank_letter | other
router.post('/documents', protect, authorize('owner','admin','superadmin'), uploadAny.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بشركة' });

    const saved = await saveFileToGridFS(req.file, {
      company: co,
      uploadedBy: req.user._id,
      module: 'company_docs',
      recordId: co,
      docType: req.body.docType || 'other',
    });

    const company = await Company.findByIdAndUpdate(
      co,
      { $push: { documents: { fileId: saved.fileId, name: saved.filename, url: saved.url, docType: req.body.docType || 'other', uploadedBy: req.user._id } } },
      { new: true }
    );

    res.status(201).json({ success: true, data: saved, documents: company.documents });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message, detail: err.message });
  }
});

// ── حذف مستند شركة ──────────────────────────────────────────────────────
router.delete('/documents/:fileId', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const co = getCompany(req);
    const { getBucket } = require('../middleware/fileStorage');
    const mongoose = require('mongoose');

    await getBucket().delete(new mongoose.Types.ObjectId(req.params.fileId)).catch(() => {});
    const company = await Company.findByIdAndUpdate(
      co,
      { $pull: { documents: { fileId: req.params.fileId } } },
      { new: true }
    );
    res.json({ success: true, documents: company.documents });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
