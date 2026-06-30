const express = require('express');
const router = express.Router();
const { protect, authorize, getCompany } = require('../middleware/auth');
const { checkPlanLimit } = require('../middleware/tenant');
const { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, getDepartments } = require('../controllers/employeeController');
const { seedSectorEmployees } = require('../services/seedSectorEmployees');
const Employee = require('../models/Employee');
const Company  = require('../models/Company');

router.get('/departments', protect, getDepartments);

router.route('/')
  .get( protect, getEmployees)
  .post(protect, authorize('owner','admin','manager'), createEmployee);

// ── Generate sector-suggested employees + login accounts ────────────────────
// Idempotent-ish guard: refuses if employees already exist, unless ?force=true
router.post('/seed-sector', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

    const existingCount = await Employee.countDocuments({ company: co });
    if (existingCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success:false,
        message:`يوجد بالفعل ${existingCount} موظف. أضف ?force=true لإعادة التوليد فوق الموجود (لن يحذف الموظفين الحاليين).`,
      });
    }

    const company = await Company.findById(co);
    if (!company) return res.status(404).json({ success:false, message:'الشركة غير موجودة' });

    const result = await seedSectorEmployees({
      companyId:   co,
      companyName: company.name,
      industry:    req.body.industry || company.industry,
      ownerUserId: req.user._id,
    });

    res.status(201).json({
      success: true,
      count: result.employees.length,
      data: result.employees,
      accounts: result.accounts,
      domain: result.domain,
      defaultPassword: result.defaultPassword,
      message: `تم إنشاء ${result.employees.length} موظف، منهم ${result.accounts.length} بحساب دخول فعّال`,
    });
  } catch (e) {
    console.error('seed-sector error:', e.message);
    res.status(500).json({ success:false, message:e.message, detail:e.message });
  }
});

router.route('/:id')
  .get(   protect, getEmployee)
  .put(   protect, authorize('owner','admin','manager'), updateEmployee)
  .delete(protect, authorize('owner','admin'), deleteEmployee);

// ── رفع مستند للموظف (هوية/إقامة، عقد، شهادة...) ──────────────────────────
// docType: national_id | iqama | passport | contract | certificate | cv | photo | other
router.post('/:id/documents', protect, authorize('owner','admin','manager'), async (req, res) => {
  const { upload: uploadAny, saveFileToGridFS } = require('../middleware/fileStorage');
  uploadAny.single('file')(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ success: false, message: uploadErr.message });
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'لم يتم إرفاق أي ملف' });
      const co = getCompany(req);

      const emp = await Employee.findOne({ _id: req.params.id, company: co });
      if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

      const saved = await saveFileToGridFS(req.file, {
        company: co,
        uploadedBy: req.user._id,
        module: 'employee_docs',
        recordId: req.params.id,
        docType: req.body.docType || 'other',
      });

      emp.documents.push({
        fileId: saved.fileId, name: saved.filename, url: saved.url,
        docType: req.body.docType || 'other', uploadedBy: req.user._id,
      });
      await emp.save();

      res.status(201).json({ success: true, data: saved, documents: emp.documents });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message, detail: err.message });
    }
  });
});

// ── حذف مستند موظف ──────────────────────────────────────────────────────
router.delete('/:id/documents/:fileId', protect, authorize('owner','admin','manager'), async (req, res) => {
  try {
    const co = getCompany(req);
    const { getBucket } = require('../middleware/fileStorage');
    const mongoose = require('mongoose');

    const emp = await Employee.findOne({ _id: req.params.id, company: co });
    if (!emp) return res.status(404).json({ success: false, message: 'الموظف غير موجود' });

    await getBucket().delete(new mongoose.Types.ObjectId(req.params.fileId)).catch(() => {});
    emp.documents = emp.documents.filter(d => d.fileId !== req.params.fileId);
    await emp.save();

    res.json({ success: true, documents: emp.documents });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;