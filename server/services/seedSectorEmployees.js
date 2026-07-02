/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sector Employee Seeder — ينشئ موظفين تجريبيين بمناصب مقترحة + حسابات دخول
 * ═══════════════════════════════════════════════════════════════════════════
 * يُستدعى مرة واحدة بعد تسجيل/إعداد الشركة (Register أو Google Setup).
 * كل موظف:
 *   - اسم عربي عام (placeholder) — يُعدّله صاحب الشركة لاحقاً بأسماء حقيقية
 *   - بريد إلكتروني داخلي مبني على النطاق الافتراضي للشركة
 *   - كلمة مرور افتراضية موحّدة يجب تغييرها عند أول دخول
 *   - راتب تقريبي حسب مستواه الهرمي (دراسات HR للسوق السعودي)
 *   - ربط هرمي صحيح (manager/director) عبر reportsTo index
 * ═══════════════════════════════════════════════════════════════════════════
 */

const bcrypt   = require('bcryptjs');
const Employee = require('../models/Employee');
const User     = require('../models/User');
const { SECTOR_POSITIONS, SALARY_BY_LEVEL, APPROVAL_BY_LEVEL } = require('../config/sectorPositions');

// أسماء عربية عامة محايدة (placeholder) — تتنوع بين ذكر/أنثى حسب نمط المنصب
const PLACEHOLDER_NAMES_M = ['عبدالله العتيبي','خالد الشمري','سعد القحطاني','فهد الدوسري','ماجد الحربي','بندر الزهراني','تركي السبيعي','ناصر العنزي'];
const PLACEHOLDER_NAMES_F = ['نورة المطيري','سارة الغامدي','منيرة الشهري','ريم القرني','هند العمري','لمى الجهني'];

const FEMALE_POSITION_HINTS = ['مديرة','معلمة','ممرضة','مشرفة','أخصائية','موظفة','وكيلة','مساعدة'];

const slugify = (str) => str
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]/g, '')
  .toLowerCase() || 'company';

const randomFrom = (arr, usedSet) => {
  const available = arr.filter(n => !usedSet.has(n));
  const pool = available.length ? available : arr;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  usedSet.add(pick);
  return pick;
};

const randomSalary = (level) => {
  const [min, max] = SALARY_BY_LEVEL[level] || SALARY_BY_LEVEL[5];
  return Math.round((min + Math.random() * (max - min)) / 100) * 100;
};

/**
 * seedSectorEmployees
 * @param {Object} opts
 * @param {String} opts.companyId   - Company._id
 * @param {String} opts.companyName - اسم الشركة (لتوليد نطاق البريد الداخلي)
 * @param {String} opts.industry    - مفتاح القطاع (يطابق SECTOR_POSITIONS)
 * @param {String} opts.ownerUserId - صاحب الحساب (owner) — يصير manager الجميع علواً
 * @returns {Promise<Array>} الموظفون المُنشأون
 */
async function seedSectorEmployees({ companyId, companyName, industry, ownerUserId }) {
  const template = SECTOR_POSITIONS[industry] || SECTOR_POSITIONS['other'];
  if (!template || !template.length) return [];

  // نطاق فريد لكل شركة فعليًا (مو بس اسمها) — اسمين متشابهين لشركتين
  // مختلفتين (أو تشغيل التوليد أكثر من مرة) كانا ينتجان نفس البريد
  // بالضبط ويسببان خطأ تكرار (E11000) يوقف كل عملية التوليد
  const domain = `${slugify(companyName)}-${String(companyId).slice(-6)}.wassel.local`;
  const defaultPassword = 'Welcome@2026'; // كلمة مرور افتراضية — يجب تغييرها عند أول دخول
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const usedNames = new Set();
  const createdEmployees = []; // index متطابق مع ترتيب template
  const createdAccounts   = []; // ملخص لإرجاعه للواجهة (بريد + كلمة مرور)

  for (let i = 0; i < template.length; i++) {
    const pos = template[i];

    // تحديد الاسم (ذكر/أنثى) حسب تلميح المسمى الوظيفي
    const isFemaleHint = FEMALE_POSITION_HINTS.some(h => pos.posAr.includes(h));
    const name = randomFrom(isFemaleHint ? PLACEHOLDER_NAMES_F : PLACEHOLDER_NAMES_M, usedNames);

    // بريد داخلي فريد: position-slug@company-domain
    const positionSlug = slugify(pos.posEn.split(' ')[0]);
    const email = `${positionSlug}${i + 1}@${domain}`;

    let linkedUser = null;
    if (pos.hasLogin) {
      try {
        linkedUser = await User.create({
          name,
          email,
          password: hashedPassword,
          company:  companyId,
          role:     pos.level <= 2 ? 'manager' : 'employee',
          isActive: true,
          mustChangePassword: true, // علم اختياري — الواجهة تستخدمه لاحقاً لإجبار تغيير كلمة المرور
        });
        createdAccounts.push({ name, email, password: defaultPassword, position: pos.posAr });
      } catch (err) {
        // بريد مكرر (نادر جداً بعد تفريد النطاق أعلاه) — نتابع بإنشاء سجل
        // الموظف بدون حساب دخول بدل ما نوقف كل عملية التوليد بسبب موظف واحد
        console.error(`[seedSectorEmployees] فشل إنشاء حساب لـ ${email}:`, err.message);
      }
    }

    const employeeId = `EMP-${Date.now().toString(36).toUpperCase()}${i}${Math.floor(Math.random()*10)}`;

    const emp = await Employee.create({
      company:      companyId,
      employeeId,
      name,
      position:     pos.posAr,
      positionEn:   pos.posEn,
      department:   pos.dept,
      grade:        `Level ${pos.level}`,
      email,
      phone:        '',
      gender:       isFemaleHint ? 'female' : 'male',
      employeeType: 'full_time',
      status:       'active',
      hireDate:     new Date(),
      salary:       randomSalary(pos.level),
      prApprovalLimit: APPROVAL_BY_LEVEL[pos.level] || 0,
      canApprovePR: pos.level <= 3,
      approvalLevel: pos.level === 1 ? 'ceo' : pos.level === 2 ? 'director' : pos.level === 3 ? 'manager' : 'none',
      user:         linkedUser?._id || undefined,
      manager:      pos.reportsTo !== null ? createdEmployees[pos.reportsTo]?._id : undefined,
      // المستوى 1 (مدير عام) يُعتبر "director" الجميع تلقائياً إن لم يحدَّد غير ذلك
      director:     pos.level >= 3 ? createdEmployees[0]?._id : undefined,
    });

    createdEmployees.push(emp);
  }

  return { employees: createdEmployees, accounts: createdAccounts, domain, defaultPassword };
}

module.exports = { seedSectorEmployees };
