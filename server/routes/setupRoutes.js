const express = require('express');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router  = express.Router();

/**
 * ⚠️ أمان حرج: هذا المسار كان مفتوحاً بالكامل بدون أي مصادقة (Account Takeover
 * ممكن لأي شخص في العالم — يمكنه تغيير كلمة مرور أي بريد إلكتروني موجود في
 * النظام أو إنشاء حساب admin جديد). تم إغلاقه الآن خلف صلاحية superadmin فقط.
 */
router.post('/setup-admin', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success:false, message:'البريد وكلمة المرور مطلوبان' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      user.password = await bcrypt.hash(password, 12);
      user.isActive = true;
      await user.save();
      return res.json({ success:true, message:'تم تحديث المستخدم', user:{ email:user.email, name:user.name } });
    }

    user = await User.create({
      name: name || 'Admin User',
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12),
      role: 'admin',
      isOnline: false,
      isActive: true,
      language: 'ar',
    });

    res.json({ success:true, message:'تم إنشاء المستخدم', user:{ email:user.email, name:user.name } });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success:false, message:error.message });
  }
});

// ── إصلاح أدوار superadmin الذين يملكون شركة → يجب أن يكونوا owner ──────────
router.post('/fix-owner-role', protect, authorize('superadmin'), async (req, res) => {
  try {
    const users = await User.find({
      role: 'superadmin',
      company: { $exists: true, $ne: null }
    });

    const fixed = [];
    for (const u of users) {
      u.role = 'owner';
      await u.save();
      fixed.push({ email: u.email, company: u.company });
    }

    res.json({ success:true, message:`تم تحديث ${fixed.length} مستخدم`, fixed });
  } catch (e) {
    res.status(500).json({ success:false, message:e.message });
  }
});

// ── إعداد بيانات تجريبية (فروع + مستودعات + مخزون) ──────────────────────────
// ملاحظة: توليد الموظفين والمناصب حسب نشاط الشركة له مساره الخاص فعلاً —
// POST /api/employees/seed-sector (مربوط بزر "توليد فريق مقترح الآن" في
// صفحة الموظفين) — فلا داعي لتكراره هنا.
// آمن للتكرار: كل قسم يتفحّص أولاً هل عنده بيانات موجودة، ولو فيه يتخطاه.
router.post('/seed-demo-data', protect, authorize('owner','admin','superadmin'), async (req, res) => {
  try {
    const { getCompany } = require('../middleware/auth');
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

    const Company   = require('../models/Company');
    const Branch    = require('../models/Branch');
    const Warehouse = require('../models/Warehouse');
    const Inventory = require('../models/Inventory');

    const company = await Company.findById(co);
    if (!company) return res.status(404).json({ success:false, message:'الشركة غير موجودة' });

    const summary = { branches:0, warehouses:0, inventory:0, projects:0, skipped:[] };

    // ── 1. الفروع (فرعان: رئيسي + ثانوي) ───────────────────────────────
    const existingBranches = await Branch.countDocuments({ company: co });
    let branches = [];
    if (existingBranches === 0) {
      branches = await Branch.insertMany([
        { company: co, name: `${company.name} — فرع A (الرئيسي)`, nameEn: 'Branch A (Main)', code: 'BR-A', isMain: true, address: company.city || '' },
        { company: co, name: `${company.name} — فرع B`,           nameEn: 'Branch B',        code: 'BR-B', isMain: false },
        { company: co, name: `${company.name} — فرع C`,           nameEn: 'Branch C',        code: 'BR-C', isMain: false },
      ]);
      summary.branches = branches.length;
    } else {
      branches = await Branch.find({ company: co }).limit(3);
      summary.skipped.push(`الفروع: يوجد ${existingBranches} فرع مسبقاً`);
    }

    // ── 2. المستودعات (ثلاثة، موزّعة على الفروع) ────────────────────────
    const existingWarehouses = await Warehouse.countDocuments({ company: co });
    let warehouses = [];
    if (existingWarehouses === 0 && branches.length) {
      warehouses = await Warehouse.insertMany([
        { company: co, name: 'مستودع فرع A (الرئيسي)', nameEn: 'Branch A Warehouse', code: 'WH-A', branch: branches[0]?._id, capacity: 5000 },
        { company: co, name: 'مستودع فرع B',            nameEn: 'Branch B Warehouse', code: 'WH-B', branch: branches[1]?._id || branches[0]?._id, capacity: 3000 },
        { company: co, name: 'مستودع فرع C',            nameEn: 'Branch C Warehouse', code: 'WH-C', branch: branches[2]?._id || branches[0]?._id, capacity: 2000 },
      ]);
      summary.warehouses = warehouses.length;
    } else {
      warehouses = await Warehouse.find({ company: co }).limit(3);
      summary.skipped.push(`المستودعات: يوجد ${existingWarehouses} مستودع مسبقاً`);
    }

    // ── 3. أصناف مخزون تجريبية (10 أصناف عامة تناسب أي نشاط تجاري) ──────
    const existingInventory = await Inventory.countDocuments({ company: co });
    if (existingInventory === 0 && warehouses.length) {
      const DEMO_ITEMS = [
        { name:'كرتون تغليف مقوى (كبير)', category:'مواد تغليف',  unit:'قطعة', cost:8,   sale:15,  qty:500, min:100 },
        { name:'شريط لاصق تغليف',         category:'مواد تغليف',  unit:'لفة',  cost:3,   sale:6,   qty:800, min:150 },
        { name:'طبقة تغليف بلاستيك',      category:'مواد تغليف',  unit:'رول',  cost:25,  sale:45,  qty:120, min:30  },
        { name:'قفازات عمل جلد',          category:'معدات سلامة', unit:'زوج',  cost:12,  sale:22,  qty:200, min:50  },
        { name:'خوذة سلامة',              category:'معدات سلامة', unit:'قطعة', cost:35,  sale:60,  qty:80,  min:20  },
        { name:'طفاية حريق 6كجم',         category:'معدات سلامة', unit:'قطعة', cost:120, sale:190, qty:40,  min:10  },
        { name:'طاولة مكتب خشبية',        category:'أثاث مكتبي',  unit:'قطعة', cost:350, sale:550, qty:25,  min:5   },
        { name:'كرسي مكتب دوّار',         category:'أثاث مكتبي',  unit:'قطعة', cost:280, sale:450, qty:35,  min:8   },
        { name:'ورق طباعة A4 (كرتون)',    category:'مستلزمات مكتبية', unit:'كرتون', cost:90, sale:140, qty:60, min:15 },
        { name:'حبر طابعة ليزر',          category:'مستلزمات مكتبية', unit:'علبة',  cost:150,sale:240, qty:45, min:10 },
      ];
      const inserted = await Inventory.insertMany(DEMO_ITEMS.map((it, i) => ({
        company: co, name: it.name, category: it.category,
        sku: `DEMO-${String(i + 1).padStart(3, '0')}`,
        unit: it.unit, costPrice: it.cost, salePrice: it.sale,
        quantity: it.qty, minQuantity: it.min,
        warehouse: warehouses[i % warehouses.length]._id,
        branch: warehouses[i % warehouses.length].branch,
        isActive: true, taxRate: 15,
      })));
      summary.inventory = inserted.length;
    } else {
      summary.skipped.push(`المخزون: يوجد ${existingInventory} صنف مسبقاً`);
    }

    // ── 4. مشاريع تجريبية (خمسة، بحالات وأنواع متنوعة) ───────────────────
    const Project  = require('../models/Project');
    const Employee = require('../models/Employee');
    const existingProjects = await Project.countDocuments({ company: co });
    if (existingProjects === 0) {
      const anyManager = await Employee.findOne({ company: co }).sort({ createdAt: 1 });
      if (!anyManager) {
        summary.skipped.push('المشاريع: تحتاج موظف واحد على الأقل كمدير مشروع — ولّد الموظفين أولاً (A-Z أو حسب النشاط)');
      } else {
        const year = new Date().getFullYear();
        const DEMO_PROJECTS = [
          { name:`مشروع A — توريد معدات مكتبية`, type:'internal',     status:'active',    priority:'medium',   contractValue:85000,  budgetCost:70000 },
          { name:`مشروع B — تطوير نظام لوجستي`,  type:'it',           status:'planning',  priority:'high',     contractValue:220000, budgetCost:180000 },
          { name:`مشروع C — صيانة دورية للفروع`, type:'maintenance',  status:'active',    priority:'low',      contractValue:45000,  budgetCost:38000 },
          { name:`مشروع D — توسعة المستودع الرئيسي`, type:'construction', status:'on_hold', priority:'critical', contractValue:650000, budgetCost:600000 },
          { name:`مشروع E — استشارات تحسين العمليات`, type:'consulting', status:'completed', priority:'medium', contractValue:120000, budgetCost:95000 },
        ];
        const inserted = await Project.insertMany(DEMO_PROJECTS.map((p, i) => ({
          company: co, code: `PRJ-${year}-DEMO${String(i + 1).padStart(2,'0')}`,
          name: p.name, type: p.type, status: p.status, priority: p.priority,
          contractValue: p.contractValue, budgetCost: p.budgetCost,
          currency: 'SAR', manager: anyManager._id,
          startDate: new Date(), progressPct: p.status === 'completed' ? 100 : p.status === 'active' ? 45 : 0,
        })));
        summary.projects = inserted.length;
      }
    } else {
      summary.skipped.push(`المشاريع: يوجد ${existingProjects} مشروع مسبقاً`);
    }

    res.json({ success: true, message: 'تم إعداد البيانات التجريبية', data: summary });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message, detail: err.message });
  }
});

module.exports = router;
