/**
 * WasselAI Controller
 * ════════════════════════════════════════════════════════════════
 * يدير جميع تفاعلات الذكاء الاصطناعي في النظام:
 * 1. مساعد ERP (إرشاد المستخدم)
 * 2. محلل البيانات (insights)
 * 3. مطور الكود (self-improvement)
 * 4. نظام التعلم الذاتي
 *
 * كل مستخدم يضبط مفاتيحه الخاصة لأي عدد من مزودي الذكاء الاصطناعي الثلاثة
 * (Claude، Gemini، ChatGPT) من الإعدادات. لو ضبط أكثر من واحد، يُستدعون
 * كلهم بالتوازي على نفس السؤال ثم تُدمج إجاباتهم في إجابة واحدة نهائية —
 * راجع services/multiAI.js لتفاصيل آلية الدمج.
 */

const { getCompany } = require('../middleware/auth');
const { buildERPContext, ERP_SYSTEM_PROMPT } = require('../middleware/aiContext');
const User = require('../models/User');
const { encrypt, decrypt, maskKey } = require('../services/crypto');
const { PROVIDERS, getUserProviderKeys, askEnsemble, callClaude, callGemini, callOpenAI } = require('../services/multiAI');

// رسالة موحّدة تُرجَع لكل نقطة نهاية عندما لا يوجد ولا مفتاح واحد محفوظ —
// الواجهة الأمامية تتعرف عليها عبر code:'NO_AI_KEY' وتوجّه المستخدم للإعدادات
const NO_KEY_RESPONSE = {
  success: false,
  code: 'NO_AI_KEY',
  message: 'لم تُضِف أي مفتاح ذكاء اصطناعي بعد (Claude / Gemini / ChatGPT). أضِف واحداً على الأقل من الإعدادات ← الذكاء الاصطناعي لتفعيل المساعد.',
};

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

    // ─── AI Call (كل المزودين المضبوطين معاً) ─────────────────
    const { text: reply, providers, synthesized } = await askEnsemble({
      userId,
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
        providers, synthesized,
      }
    });

  } catch (err) {
    console.error('AI Chat error:', err);

    if (err.code === 'NO_KEY') return res.status(200).json(NO_KEY_RESPONSE);

    if (err.code === 'ALL_FAILED') {
      // كل المزودين المضبوطين رفضوا الطلب — على الأغلب مفاتيح غير صالحة
      return res.status(200).json({
        success: false, code: 'INVALID_AI_KEY',
        message: 'كل المفاتيح المحفوظة فشلت في الرد. تحقق منها من الإعدادات ← الذكاء الاصطناعي.',
      });
    }

    // أخطاء أخرى (شبكة، تحميل زائد...) → رد احتياطي عام بدل فشل كامل
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

    const { text: analysis, providers, synthesized } = await askEnsemble({
      userId: req.user.id,
      system: ERP_SYSTEM_PROMPT,
      userMessage: prompt,
      maxTokens: 2000,
      temperature: 0.3,
    });

    res.json({
      success: true,
      data: { analysis, type, providers, synthesized }
    });

  } catch (err) {
    if (err.code === 'NO_KEY') return res.status(200).json(NO_KEY_RESPONSE);
    if (err.code === 'ALL_FAILED') {
      return res.status(200).json({
        success: false, code: 'INVALID_AI_KEY',
        message: 'كل المفاتيح المحفوظة فشلت في الرد. تحقق منها من الإعدادات ← الذكاء الاصطناعي.',
      });
    }
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

    const { text: code, providers, synthesized } = await askEnsemble({
      userId: req.user.id,
      userMessage: devPrompt,
      maxTokens: 4000,
      temperature: 0.2,
    });

    res.json({
      success: true,
      data: {
        code,
        request,
        providers, synthesized,
        warning: 'راجع الكود قبل التطبيق — المسؤولية على المستخدم'
      }
    });

  } catch (err) {
    if (err.code === 'NO_KEY') return res.status(200).json(NO_KEY_RESPONSE);
    if (err.code === 'ALL_FAILED') {
      return res.status(200).json({
        success: false, code: 'INVALID_AI_KEY',
        message: 'كل المفاتيح المحفوظة فشلت في الرد. تحقق منها من الإعدادات ← الذكاء الاصطناعي.',
      });
    }
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

    const { text: advice, providers, synthesized } = await askEnsemble({
      userId: req.user.id,
      userMessage: hrPrompt,
      maxTokens: 1500,
      temperature: 0.2,
    });

    res.json({
      success: true,
      data: { advice, providers, synthesized }
    });

  } catch (err) {
    if (err.code === 'NO_KEY') return res.status(200).json(NO_KEY_RESPONSE);
    if (err.code === 'ALL_FAILED') {
      return res.status(200).json({
        success: false, code: 'INVALID_AI_KEY',
        message: 'كل المفاتيح المحفوظة فشلت في الرد. تحقق منها من الإعدادات ← الذكاء الاصطناعي.',
      });
    }
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

    const { text: raw } = await askEnsemble({
      userId: req.user.id,
      userMessage: suggPrompt,
      maxTokens: 200,
      temperature: 0.8,
      light: true,
    });

    const suggestions = raw?.split('\n').filter(s => s.trim().length > 5).slice(0, 4) || [];

    res.json({ success: true, data: { suggestions, page } });

  } catch (err) {
    // ميزة خلفية غير حرجة (لا مفتاح، أو فشل مؤقت) — فشلها لا يجب أن يظهر
    // كخطأ مزعج للمستخدم؛ ترجع فقط قائمة فارغة بصمت
    res.json({ success: true, data: { suggestions: [], page: req.query.page } });
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
// 7. مفاتيح مزودي الذكاء الاصطناعي الخاصة بالمستخدم (Claude/Gemini/ChatGPT)
// ═══════════════════════════════════════════════════════════════════

// يرجع حالة كل المزودين الثلاثة دفعة واحدة: هل مضبوط؟ + آخر 4 خانات
// للعرض — لا يُرجع أي مفتاح كاملاً في أي استجابة API على الإطلاق
exports.getKeyStatus = async (req, res) => {
  try {
    const keys = await getUserProviderKeys(req.user.id);
    const data = {};
    for (const id of Object.keys(PROVIDERS)) {
      data[id] = { configured: !!keys[id], maskedKey: keys[id] ? maskKey(keys[id]) : null };
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const TEST_CALL = {
  claude: (key) => callClaude(key, { userMessage: 'hi', maxTokens: 5, light: true }),
  gemini: (key) => callGemini(key, { userMessage: 'hi', maxTokens: 5, light: true }),
  openai: (key) => callOpenAI(key, { userMessage: 'hi', maxTokens: 5, light: true }),
};

exports.setKey = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    if (!PROVIDERS[provider]) {
      return res.status(400).json({ success: false, message: 'مزود غير معروف — يجب أن يكون claude أو gemini أو openai' });
    }
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, message: 'المفتاح مطلوب' });
    }
    const trimmed = apiKey.trim();
    const { prefix, label } = PROVIDERS[provider];
    if (!trimmed.startsWith(prefix)) {
      return res.status(400).json({
        success: false,
        message: `هذا لا يبدو مفتاح ${label} صحيح — يجب أن يبدأ بـ ${prefix}`,
      });
    }

    // تحقق فعلي من صلاحية المفتاح قبل حفظه — استدعاء صغير جداً ورخيص
    // بدل حفظ مفتاح قد يكون خاطئاً بدون علم المستخدم
    try {
      await TEST_CALL[provider](trimmed);
    } catch (testErr) {
      if (testErr.status === 401 || testErr.status === 403) {
        return res.status(400).json({ success: false, message: `المفتاح غير صالح أو مرفوض من ${label}. تأكد من نسخه كاملاً.` });
      }
      // أخطاء غير متعلقة بصحة المفتاح (شبكة، تحميل زائد) لا تمنع الحفظ
    }

    await User.findByIdAndUpdate(req.user.id, { [PROVIDERS[provider].keyField]: encrypt(trimmed) });
    res.json({ success: true, message: `تم حفظ مفتاح ${label} بنجاح`, data: { maskedKey: maskKey(trimmed) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeKey = async (req, res) => {
  try {
    const { provider } = req.params;
    if (!PROVIDERS[provider]) {
      return res.status(400).json({ success: false, message: 'مزود غير معروف' });
    }
    await User.findByIdAndUpdate(req.user.id, { $unset: { [PROVIDERS[provider].keyField]: 1 } });
    res.json({ success: true, message: `تم حذف مفتاح ${PROVIDERS[provider].label}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
