/**
 * AI Context Builder
 * يبني سياقاً كاملاً عن المستخدم وشركته ليُرسل للـ AI
 * هذا هو "الذاكرة" الذكية للنظام
 */

const User     = require('../models/User');
const Company  = require('../models/Company');
const mongoose = require('mongoose');

exports.buildERPContext = async (userId, companyId, page = null) => {
  try {
    const context = { timestamp: new Date().toISOString() };

    // ─── User Context ──────────────────────────────────────────
    const user = await User.findById(userId).select('name role language');
    if (user) {
      context.user = { name: user.name, role: user.role, lang: user.language };
    }

    // ─── Company Context ───────────────────────────────────────
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      const company = await Company.findById(companyId)
        .select('name currency plan planExpiresAt country timezone');
      if (company) {
        context.company = {
          name: company.name,
          currency: company.currency,
          plan: company.plan,
          country: company.country || 'SA',
          timezone: company.timezone
        };
      }

      // ─── Live Stats (quick aggregates) ─────────────────────
      try {
        const Inventory    = require('../models/Inventory');
        const PurchaseOrder = require('../models/PurchaseOrder');
        const Employee     = require('../models/Employee');
        const Supplier     = require('../models/Supplier');

        const [invCount, lowStock, pendingPOs, empCount, suppCount] = await Promise.all([
          Inventory.countDocuments({ company: companyId, isActive: true }),
          Inventory.countDocuments({ company: companyId, $expr: { $lte: ['$quantity', '$minQuantity'] } }),
          PurchaseOrder.countDocuments({ company: companyId, status: { $in: ['pending','approved'] } }),
          Employee.countDocuments({ company: companyId, status: 'active' }),
          Supplier.countDocuments({ company: companyId, isActive: true })
        ]);

        context.stats = {
          inventory: { total: invCount, lowStock },
          pendingPurchaseOrders: pendingPOs,
          employees: empCount,
          suppliers: suppCount
        };
      } catch {}
    }

    // ─── Current Page Context ──────────────────────────────────
    if (page) context.currentPage = page;

    return context;
  } catch (err) {
    return { error: err.message };
  }
};

// ─── ERP Knowledge Base ────────────────────────────────────────────
// هذا "التدريب" الأساسي للـ AI على نظام وصّل والسوق السعودي
exports.ERP_SYSTEM_PROMPT = `أنت WasselAI، مساعد ذكي مدمج في نظام وصّل ERP.

## هويتك:
- اسمك WasselAI، مبني على أحدث نماذج اللغة (LLaMA 70B / Claude)
- متخصص في: المشتريات، المبيعات، المحاسبة، الموارد البشرية، اللوجستيك، الجمارك
- تعرف السوق السعودي: ضريبة القيمة المضافة 15%، نظام ZATCA، نظام WPS، GOSI
- تتحدث العربية والإنجليزية بطلاقة

## قدراتك:
1. **إرشاد المستخدم**: شرح كيفية استخدام كل ميزة في البرنامج
2. **تحليل البيانات**: قراءة إحصائيات الشركة وتقديم توصيات
3. **إجابة أسئلة ERP**: محاسبة، مشتريات، مبيعات، جمارك، ضرائب
4. **تطوير البرنامج**: اقتراح تحسينات وإنشاء كود جديد
5. **التعلم المستمر**: تحسين إجاباتك بناءً على تفاعلات المستخدم

## قواعد محاسبية ومالية تعرفها:
- قيد محاسبي مزدوج: المدين = الدائن دائماً
- ضريبة VAT السعودية: 15% على معظم السلع والخدمات
- ضريبة الاستقطاع: 5-20% حسب طبيعة الخدمة
- زكاة الشركات السعودية: 2.5% من الوعاء الزكوي
- نظام ZATCA: الفواتير الإلكترونية إلزامية

## قواعد لوجستية تعرفها:
- Incoterms 2020: FOB, CIF, EXW, DDP...
- HS Codes: نظام تصنيف البضائع الجمركي
- SABER: نظام الاعتماد السعودي للمنتجات
- FASAH: منصة الجمارك السعودية

## أسلوبك:
- مباشر وواضح، لا تطيل بدون فائدة
- استخدم أمثلة من السياق الفعلي للمستخدم
- إذا لم تعرف الإجابة، قل ذلك واقترح مصدراً
- أجب بنفس لغة السؤال (عربي/إنجليزي)`;
