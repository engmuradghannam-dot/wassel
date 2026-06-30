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

module.exports = router;