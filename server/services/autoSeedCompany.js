/**
 * services/autoSeedCompany.js
 * ─────────────────────────────────────────────────────────────────────
 * يولّد بيانات تجريبية كاملة وواقعية لشركة جديدة أو قائمة تلقائياً —
 * بدون أي زر يدوي. الهدف: أي مالك أو سوبر أدمن يفتح حسابه يلقى النظام
 * فيه بيانات جاهزة بكل قسم يقدر يعدّلها أو يحذفها، بدل صفحات فاضية.
 *
 * يعمل مرة واحدة فقط لكل شركة (Company.dataSeeded) — لا يتكرر ولا يحذف
 * بيانات حقيقية موجودة، وكل خطوة تتفحص أولاً هل عندها بيانات فعلاً.
 */
const bcrypt = require('bcryptjs');

async function autoSeedCompanyData(companyId, ownerUserId) {
  const Company    = require('../models/Company');
  const Employee   = require('../models/Employee');
  const User       = require('../models/User');
  const Branch     = require('../models/Branch');
  const Warehouse  = require('../models/Warehouse');
  const Inventory  = require('../models/Inventory');
  const Supplier   = require('../models/Supplier');
  const Customer   = require('../models/Customer');
  const Project    = require('../models/Project');
  const PurchaseOrder = require('../models/PurchaseOrder');
  const SalesOrder    = require('../models/SalesOrder');
  const { AZ_EMPLOYEES, SALARY_RANGE_BY_LEVEL } = require('../config/azDemoData');
  const { getNextSequence } = require('./sequence');

  const company = await Company.findById(companyId);
  if (!company) return { skipped: true, reason: 'company not found' };
  if (company.dataSeeded) return { skipped: true, reason: 'already seeded' };

  // نمنع التشغيل المزدوج فوراً (قبل ما نبدأ حتى) — لو جاء طلبين متزامنين
  // (نادر لكن ممكن) ما يشغلونه مرتين
  await Company.findByIdAndUpdate(companyId, { dataSeeded: true });

  const summary = { employees:0, branches:0, warehouses:0, inventory:0, suppliers:0, customers:0, projects:0, purchaseOrders:0, quotations:0, errors:[] };

  const slugify = (str='') => str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]/g,'').toLowerCase() || 'company';

  try {
    // ── 1. الموظفون (A-Z عبر كل الأقسام + Nitaqat) ──────────────────────
    const existingEmployees = await Employee.countDocuments({ company: companyId });
    const createdByLetter = {};
    if (existingEmployees === 0) {
      const domain = `${slugify(company.name)}-${String(companyId).slice(-6)}.wassel.local`;
      const defaultPassword = 'Welcome@2026';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      const randomSalary = (level) => {
        const [min, max] = SALARY_RANGE_BY_LEVEL[level] || SALARY_RANGE_BY_LEVEL[4];
        return Math.round((min + Math.random() * (max - min)) / 100) * 100;
      };

      for (const e of AZ_EMPLOYEES) {
        let linkedUser = null;
        if (e.level <= 2) {
          const email = `${slugify(e.nameEn.split(' ')[0])}@${domain}`;
          try {
            linkedUser = await User.create({
              name: e.name, email, password: hashedPassword, company: companyId,
              role: 'manager', isActive: true, mustChangePassword: true,
            });
          } catch (err) { summary.errors.push(`employee-login ${email}: ${err.message}`); }
        }
        try {
          const emp = await Employee.create({
            company: companyId,
            employeeId: `EMP-${e.letter}${Date.now().toString(36).toUpperCase().slice(-5)}`,
            name: e.name, position: e.position, positionEn: e.positionEn,
            department: e.dept, grade: `Level ${e.level}`, nationality: e.nationality,
            email: `${slugify(e.nameEn.split(' ')[0])}@${domain}`,
            employeeType: 'full_time', status: 'active', hireDate: new Date(),
            salary: randomSalary(e.level),
            canApprovePR: e.level <= 2,
            approvalLevel: e.level === 1 ? 'ceo' : e.level === 2 ? 'manager' : 'none',
            user: linkedUser?._id || undefined,
          });
          createdByLetter[e.letter] = emp;
          summary.employees++;
        } catch (err) { summary.errors.push(`employee ${e.name}: ${err.message}`); }
      }
      // ربط هرمي: مدراء الأقسام → CEO، الموظفون → مدير قسمهم
      const ceo = createdByLetter['A'];
      for (const e of AZ_EMPLOYEES) {
        if (e.level === 1 || !createdByLetter[e.letter]) continue;
        const deptManager = AZ_EMPLOYEES.find(x => x.dept === e.dept && x.level === 2 && x.letter !== e.letter);
        const managerEmp = e.level === 2 ? ceo : (deptManager ? createdByLetter[deptManager.letter] : ceo);
        await Employee.findByIdAndUpdate(createdByLetter[e.letter]._id, { manager: managerEmp?._id, director: ceo?._id });
      }
    }

    // ── 2. الفروع (A/B/C) ────────────────────────────────────────────────
    let branches = await Branch.find({ company: companyId });
    if (branches.length === 0) {
      branches = await Branch.insertMany([
        { company: companyId, name: `${company.name} — فرع A (الرئيسي)`, nameEn: 'Branch A (Main)', code: 'BR-A', isMain: true, address: company.city || '' },
        { company: companyId, name: `${company.name} — فرع B`,           nameEn: 'Branch B',        code: 'BR-B', isMain: false },
        { company: companyId, name: `${company.name} — فرع C`,           nameEn: 'Branch C',        code: 'BR-C', isMain: false },
      ]);
      summary.branches = branches.length;
    }

    // ── 3. المستودعات (واحد لكل فرع) ─────────────────────────────────────
    let warehouses = await Warehouse.find({ company: companyId });
    if (warehouses.length === 0 && branches.length) {
      warehouses = await Warehouse.insertMany([
        { company: companyId, name: 'مستودع فرع A (الرئيسي)', nameEn: 'Branch A Warehouse', code: 'WH-A', branch: branches[0]?._id, capacity: 5000 },
        { company: companyId, name: 'مستودع فرع B',            nameEn: 'Branch B Warehouse', code: 'WH-B', branch: branches[1]?._id || branches[0]?._id, capacity: 3000 },
        { company: companyId, name: 'مستودع فرع C',            nameEn: 'Branch C Warehouse', code: 'WH-C', branch: branches[2]?._id || branches[0]?._id, capacity: 2000 },
      ]);
      summary.warehouses = warehouses.length;
    }

    // ── 4. مخزون تجريبي (10 أصناف) ───────────────────────────────────────
    let inventoryItems = await Inventory.find({ company: companyId });
    if (inventoryItems.length === 0 && warehouses.length) {
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
      inventoryItems = await Inventory.insertMany(DEMO_ITEMS.map((it, i) => ({
        company: companyId, name: it.name, category: it.category,
        sku: `DEMO-${String(i + 1).padStart(3, '0')}`,
        unit: it.unit, costPrice: it.cost, salePrice: it.sale,
        quantity: it.qty, minQuantity: it.min,
        warehouse: warehouses[i % warehouses.length]._id,
        branch: warehouses[i % warehouses.length].branch,
        isActive: true, taxRate: 15,
      })));
      summary.inventory = inventoryItems.length;
    }

    // ── 5. موردون وعملاء تجريبيون (3 من كل نوع) ──────────────────────────
    let suppliers = await Supplier.find({ company: companyId });
    if (suppliers.length === 0) {
      suppliers = await Supplier.insertMany([
        { company: companyId, name: 'شركة الرياض للتوريدات', commercialReg: '1010123456', vatNumber: '300012345600003', phone: '0501234567', paymentTerms: 30 },
        { company: companyId, name: 'مؤسسة الخليج التجارية', commercialReg: '1010123457', vatNumber: '300012345700003', phone: '0502234567', paymentTerms: 45 },
        { company: companyId, name: 'شركة المتحدة للمواد الأولية', commercialReg: '1010123458', vatNumber: '300012345800003', phone: '0503234567', paymentTerms: 60 },
      ]);
      summary.suppliers = suppliers.length;
    }

    let customers = await Customer.find({ company: companyId });
    if (customers.length === 0) {
      customers = await Customer.insertMany([
        { company: companyId, name: 'شركة النخبة للمقاولات', commercialReg: '1010223456', vatNumber: '300022345600003', phone: '0551234567', paymentTerms: 30 },
        { company: companyId, name: 'مؤسسة الأفق للتجارة', commercialReg: '1010223457', vatNumber: '300022345700003', phone: '0552234567', paymentTerms: 0 },
        { company: companyId, name: 'شركة الواحة العقارية', commercialReg: '1010223458', vatNumber: '300022345800003', phone: '0553234567', paymentTerms: 15 },
      ]);
      summary.customers = customers.length;
    }

    // ── 6. مشاريع تجريبية (5) ─────────────────────────────────────────────
    const existingProjects = await Project.countDocuments({ company: companyId });
    if (existingProjects === 0) {
      const anyManager = await Employee.findOne({ company: companyId }).sort({ createdAt: 1 });
      if (anyManager) {
        const year = new Date().getFullYear();
        const DEMO_PROJECTS = [
          { name:'مشروع A — توريد معدات مكتبية', type:'internal', status:'active', priority:'medium', contractValue:85000, budgetCost:70000 },
          { name:'مشروع B — تطوير نظام لوجستي', type:'it', status:'planning', priority:'high', contractValue:220000, budgetCost:180000 },
          { name:'مشروع C — صيانة دورية للفروع', type:'maintenance', status:'active', priority:'low', contractValue:45000, budgetCost:38000 },
          { name:'مشروع D — توسعة المستودع الرئيسي', type:'construction', status:'on_hold', priority:'critical', contractValue:650000, budgetCost:600000 },
          { name:'مشروع E — استشارات تحسين العمليات', type:'consulting', status:'completed', priority:'medium', contractValue:120000, budgetCost:95000 },
        ];
        const inserted = await Project.insertMany(DEMO_PROJECTS.map((p, i) => ({
          company: companyId, code: `PRJ-${year}-DEMO${String(i + 1).padStart(2,'0')}`,
          name: p.name, type: p.type, status: p.status, priority: p.priority,
          contractValue: p.contractValue, budgetCost: p.budgetCost,
          currency: 'SAR', manager: anyManager._id, customer: customers[i % customers.length]?._id,
          startDate: new Date(), progressPct: p.status === 'completed' ? 100 : p.status === 'active' ? 45 : 0,
        })));
        summary.projects = inserted.length;
      }
    }

    // ── 7. أوامر شراء تجريبية (3، بحالات مختلفة) ──────────────────────────
    const existingPOs = await PurchaseOrder.countDocuments({ company: companyId });
    if (existingPOs === 0 && suppliers.length && warehouses.length) {
      const poItems = [
        { name: inventoryItems[0]?.name || 'صنف تجريبي', quantity: 100, unitPrice: 8, taxRate: 15 },
        { name: inventoryItems[1]?.name || 'صنف تجريبي 2', quantity: 200, unitPrice: 3, taxRate: 15 },
      ];
      const subtotal = poItems.reduce((s,i)=>s+i.quantity*i.unitPrice,0);
      const taxAmount = subtotal * 0.15;
      for (let i = 0; i < 3; i++) {
        try {
          const { formatted: orderNumber } = await getNextSequence(companyId, 'purchase_order', { prefix: 'PO' });
          await PurchaseOrder.create({
            company: companyId, orderNumber,
            supplier: suppliers[i % suppliers.length]._id,
            branch: branches[i % branches.length]?._id, warehouse: warehouses[i % warehouses.length]?._id,
            items: poItems.map(it => ({ ...it, total: it.quantity*it.unitPrice*1.15 })),
            subtotal, taxAmount, total: subtotal+taxAmount, totalAmount: subtotal+taxAmount,
            status: ['pending','approved','received'][i], createdBy: ownerUserId,
          });
          summary.purchaseOrders++;
        } catch (err) { summary.errors.push(`PO#${i}: ${err.message}`); }
      }
    }

    // ── 8. عروض أسعار/فواتير تجريبية (3) ──────────────────────────────────
    const existingSOs = await SalesOrder.countDocuments({ company: companyId });
    if (existingSOs === 0 && customers.length) {
      const soItems = [
        { description: inventoryItems[6]?.name || 'خدمة/منتج', quantity: 5, unitPrice: 550, discount: 0, taxRate: 15 },
      ];
      const subtotal = soItems.reduce((s,i)=>s+i.quantity*i.unitPrice,0);
      const taxAmount = subtotal * 0.15;
      const types = ['quotation','quotation','invoice'];
      for (let i = 0; i < 3; i++) {
        try {
          const { formatted: orderNumber } = await getNextSequence(companyId, 'sales_order', { prefix: 'SO' });
          await SalesOrder.create({
            company: companyId, orderNumber, type: types[i],
            customer: customers[i % customers.length]._id,
            items: soItems.map(it => ({ ...it, total: it.quantity*it.unitPrice*1.15 })),
            subtotal, taxAmount, total: subtotal+taxAmount, remainingAmount: subtotal+taxAmount,
            createdBy: ownerUserId,
          });
          summary.quotations++;
        } catch (err) { summary.errors.push(`SO#${i}: ${err.message}`); }
      }
    }
  } catch (err) {
    summary.errors.push(`fatal: ${err.message}`);
    console.error('[autoSeedCompanyData] fatal error:', err);
  }

  return summary;
}

module.exports = { autoSeedCompanyData };
