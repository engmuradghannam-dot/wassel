/**
 * WasselAI Controller
 * ════════════════════════════════════════════════════════════════
 * يدير جميع تفاعلات الذكاء الاصطناعي في النظام:
 * 1. مساعد ERP (إرشاد المستخدم)
 * 2. محلل البيانات (insights)
 * 3. مطور الكود (self-improvement)
 * 4. نظام التعلم الذاتي
 */

const Anthropic   = require('@anthropic-ai/sdk');
const { getCompany } = require('../middleware/auth');
const { buildERPContext, ERP_SYSTEM_PROMPT } = require('../middleware/aiContext');

// ── تهيئة كسولة (lazy init) ─────────────────────────────────────────────────
// لا نُنشئ Anthropic client عند تحميل الملف، بل عند أول استخدام فعلي فقط.
// هذا يمنع تعطّل السيرفر بالكامل لو غاب ANTHROPIC_API_KEY مؤقتاً أو لم يُضبط
// بعد — بدلاً من ذلك يفشل فقط طلب الذكاء الاصطناعي نفسه برسالة واضحة، وكل
// بقية النظام (المخزون، المبيعات، البريد، إلخ) يستمر بالعمل طبيعياً.
//
// كل مستخدم في النظام يستخدم Claude عبر مفتاح API واحد مضبوط على مستوى
// السيرفر (ANTHROPIC_API_KEY في متغيرات بيئة Render) — التكلفة على حساب
// الشركة المالكة للنظام، وليس على كل مستخدم بمفتاحه الخاص.
let _anthropic = null;
function getClaudeClient() {
  if (_anthropic) return _anthropic;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('مساعد الذكاء الاصطناعي غير مُفعَّل — لم يتم ضبط ANTHROPIC_API_KEY بعد');
  }
  _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// النماذج المستخدمة: Sonnet للمهام التي تحتاج جودة وفهم عميق (محادثة، تحليل،
// كود، استشارات قانونية)، وHaiku للمهام الخفيفة السريعة (اقتراحات قصيرة) —
// توفيراً بالتكلفة دون التأثير على جودة أهم الميزات.
const MODEL_MAIN  = 'claude-sonnet-5';
const MODEL_LIGHT = 'claude-haiku-4-5-20251001';

/**
 * askClaude — غلاف موحّد فوق Anthropic Messages API.
 * يحوّل شكل الاستدعاء المعتاد (system + history + user) إلى الشكل الذي
 * تتوقعه Claude API فعلياً: `system` كمعامل منفصل عن `messages`، ومصفوفة
 * `messages` تحتوي فقط أدوار user/assistant (بدون system بداخلها).
 */
async function askClaude({ model = MODEL_MAIN, system, history = [], userMessage, maxTokens = 1500, temperature = 0.7 }) {
  const client = getClaudeClient();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: system || undefined,
    messages: [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ],
  });
  const text = response.content?.find(b => b.type === 'text')?.text || '';
  const totalTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);
  return { text, totalTokens };
}

// ─── Conversation Memory (in-memory, يمكن ترقيته لـ Redis) ──────────────
const conversationMemory = new Map(); // userId -> [{role, content}]

const getHistory = (userId) => conversationMemory.get(userId) || [];
const addToHistory = (userId, role, content) => {
  const history = getHistory(userId);
  history.push({ role, content: content.slice(0, 2000) }); // limit per message
  if (history.length > 20) history.splice(0, history.length - 20); // keep last 20
  conversationMemory.set(userId, history);
};

// ═══════════════════════════════════════════════════════════════════
// 1. ERP ASSISTANT — المساعد الشامل
// ═══════════════════════════════════════════════════════════════════
exports.chat = async (req, res) => {
  try {
    const { message, page, clearHistory } = req.body;
    const userId    = req.user.id;
    const companyId = getCompany(req);

    if (!message) return res.status(400).json({ success: false, message: 'الرسالة مطلوبة' });

    if (clearHistory) conversationMemory.delete(userId);

    // ─── Build ERP Context ─────────────────────────────────────
    const erpContext = await buildERPContext(userId, companyId, page);

    // ─── Conversation History ──────────────────────────────────
    const history = getHistory(userId);

    // ─── System Prompt with Context ───────────────────────────
    const contextStr = `
## سياق المستخدم الحالي:
- المستخدم: ${erpContext.user?.name} (${erpContext.user?.role})
- الشركة: ${erpContext.company?.name || 'غير محدد'}
- العملة: ${erpContext.company?.currency || 'SAR'}
- الخطة: ${erpContext.company?.plan || 'trial'}
- الصفحة الحالية: ${page || 'لوحة التحكم'}
${erpContext.stats ? `
## إحصائيات الشركة الحالية:
- المخزون: ${erpContext.stats.inventory?.total} صنف (${erpContext.stats.inventory?.lowStock} تحت الحد الأدنى)
- أوامر الشراء المعلقة: ${erpContext.stats.pendingPurchaseOrders}
- الموظفون: ${erpContext.stats.employees}
- الموردون: ${erpContext.stats.suppliers}` : ''}`;

    const systemPrompt = ERP_SYSTEM_PROMPT + '\n\n' + contextStr;

    // ─── AI Call ───────────────────────────────────────────────
    const { text: reply, totalTokens } = await askClaude({
      system: systemPrompt,
      history: history.slice(-10),
      userMessage: message,
      maxTokens: 1500,
      temperature: 0.7,
    });

    // ─── Save to History ───────────────────────────────────────
    addToHistory(userId, 'user', message);
    addToHistory(userId, 'assistant', reply);

    // ─── Log interaction for learning ─────────────────────────
    await logInteraction(userId, companyId, message, reply, page);

    res.json({
      success: true,
      data: {
        message: reply,
        context: { page, user: erpContext.user?.name },
        tokens: totalTokens
      }
    });

  } catch (err) {
    console.error('AI Chat error:', err);
    // Fallback response if API fails
    res.json({
      success: true,
      data: {
        message: getFallbackResponse(req.body.message),
        fallback: true
      }
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 2. DATA ANALYST — تحليل البيانات
// ═══════════════════════════════════════════════════════════════════
exports.analyze = async (req, res) => {
  try {
    const { type, data, question } = req.body;
    const companyId = getCompany(req);

    // Gather data based on type
    let analysisData = data;
    if (!analysisData && type) {
      analysisData = await gatherDataForAnalysis(type, companyId);
    }

    const prompt = `أنت محلل بيانات ERP خبير.
    
البيانات المطلوب تحليلها:
${JSON.stringify(analysisData, null, 2).slice(0, 3000)}

السؤال: ${question || `قدم تحليلاً شاملاً لهذه البيانات مع توصيات عملية`}

أجب بـ:
1. ملخص الوضع الحالي
2. المشاكل أو الفرص الرئيسية
3. 3 توصيات عملية وقابلة للتنفيذ
4. مؤشرات KPI المقترحة لتحسين الأداء

كن محدداً وعملياً، لا تكتر الكلام.`;

    const { text: analysis, totalTokens } = await askClaude({
      system: ERP_SYSTEM_PROMPT,
      userMessage: prompt,
      maxTokens: 2000,
      temperature: 0.3,
    });

    res.json({
      success: true,
      data: {
        analysis,
        type,
        tokens: totalTokens
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 3. CODE DEVELOPER — مطور الكود (التطوير الذاتي)
// ═══════════════════════════════════════════════════════════════════
exports.develop = async (req, res) => {
  try {
    const { request, context } = req.body;

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'هذه الميزة للمشرف العام فقط' });
    }

    const devPrompt = `أنت مطور full-stack خبير في بناء أنظمة ERP.
    
تقنيات المشروع:
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + Material-UI
- Auth: JWT + Passport Google OAuth
- Hosting: Render (backend) + Vercel (frontend)

الطلب: ${request}
السياق: ${context || 'لا يوجد سياق إضافي'}

قدم:
1. الكود الكامل القابل للتطبيق فوراً
2. شرح ما يفعله الكود
3. خطوات التطبيق
4. أي تحذيرات أو اعتبارات أمنية

اكتب كوداً نظيفاً وموثقاً بالتعليقات العربية.`;

    const { text: code } = await askClaude({
      userMessage: devPrompt,
      maxTokens: 4000,
      temperature: 0.2,
    });

    res.json({
      success: true,
      data: {
        code,
        request,
        warning: 'راجع الكود قبل التطبيق — المسؤولية على المستخدم'
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 4. HR ADVISOR — مستشار الموارد البشرية
// ═══════════════════════════════════════════════════════════════════
exports.hrAdvice = async (req, res) => {
  try {
    const { question, employeeData } = req.body;

    const hrPrompt = `أنت مستشار موارد بشرية خبير في قوانين العمل السعودية.

تعرف تفصيلياً:
- نظام العمل السعودي ومستجداته
- نظام التأمينات الاجتماعية GOSI
- نظام حماية الأجور WPS
- حساب مكافأة نهاية الخدمة
- أحكام الإجازات السنوية والمرضية والأمومة
- نظام العمل عن بعد
- توطين الوظائف (نطاقات)

${employeeData ? `بيانات الموظف: ${JSON.stringify(employeeData).slice(0, 500)}` : ''}

السؤال: ${question}

قدم إجابة دقيقة مع:
- المادة القانونية ذات الصلة (إن وُجدت)
- حساب مالي إن احتاج الأمر
- توصية عملية`;

    const { text: advice } = await askClaude({
      userMessage: hrPrompt,
      maxTokens: 1500,
      temperature: 0.2,
    });

    res.json({
      success: true,
      data: { advice }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 5. SMART SUGGESTIONS — اقتراحات ذكية حسب السياق
// ═══════════════════════════════════════════════════════════════════
exports.suggestions = async (req, res) => {
  try {
    const { page } = req.query;
    const companyId = getCompany(req);
    const erpContext = await buildERPContext(req.user.id, companyId, page);

    const suggPrompt = `بناءً على هذا السياق:
المستخدم في صفحة: ${page}
إحصائيات: ${JSON.stringify(erpContext.stats || {})}

اقترح 4 أسئلة قصيرة يمكن للمستخدم سؤالها الآن لتحسين أداء عمله.
كل سؤال في سطر واحد، بدون ترقيم، بالعربية، مباشر وعملي.
مثال: "ما هي المنتجات التي ستنفد قريباً؟"`;

    const { text: raw } = await askClaude({
      model: MODEL_LIGHT,
      userMessage: suggPrompt,
      maxTokens: 200,
      temperature: 0.8,
    });

    const suggestions = raw?.split('\n').filter(s => s.trim().length > 5).slice(0, 4) || [];

    res.json({ success: true, data: { suggestions, page } });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// 6. CLEAR HISTORY
// ═══════════════════════════════════════════════════════════════════
exports.clearHistory = (req, res) => {
  conversationMemory.delete(req.user.id);
  res.json({ success: true, message: 'تم مسح سجل المحادثة' });
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
async function gatherDataForAnalysis(type, companyId) {
  try {
    switch (type) {
      case 'inventory': {
        const Inventory = require('../models/Inventory');
        const items = await Inventory.find({ company: companyId, isActive: true })
          .select('name quantity minQuantity costPrice category').limit(50);
        return { type: 'inventory', count: items.length, items };
      }
      case 'purchases': {
        const PO = require('../models/PurchaseOrder');
        const orders = await PO.find({ company: companyId })
          .sort({ createdAt: -1 }).limit(20)
          .select('orderNumber status total orderDate supplier');
        return { type: 'purchases', count: orders.length, orders };
      }
      default:
        return { type, message: 'لا توجد بيانات محددة لهذا النوع' };
    }
  } catch (e) {
    return { error: e.message };
  }
}

async function logInteraction(userId, companyId, message, reply, page) {
  try {
    // يمكن توسيع هذا لقاعدة بيانات لاحقاً
    // لأغراض التعلم والتحسين المستمر
    console.log(`[AI] User:${userId} Page:${page} Q:${message.slice(0,50)}`);
  } catch {}
}

function getFallbackResponse(message = '') {
  const msg = message.toLowerCase();
  if (msg.includes('مخزون') || msg.includes('inventory'))
    return 'يمكنك إدارة المخزون من قسم "المخزون" في القائمة الجانبية. هناك يمكنك إضافة منتجات وتتبع الكميات وضبط نقاط إعادة الطلب.';
  if (msg.includes('مورد') || msg.includes('supplier'))
    return 'قسم "الموردون" يتيح لك إدارة جميع مورديك. يمكنك إضافة مورد جديد وتتبع المشتريات والمدفوعات.';
  if (msg.includes('موظف') || msg.includes('employee'))
    return 'قسم "الموارد البشرية" يتيح إدارة الموظفين والرواتب والإجازات. ابدأ بإضافة موظف جديد من الزر الأزرق.';
  return 'أنا WasselAI، مساعدك الذكي في نظام وصّل ERP. يمكنني مساعدتك في إدارة المخزون والمبيعات والموارد البشرية والمحاسبة. كيف أساعدك اليوم؟';
}
