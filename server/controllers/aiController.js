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
const User = require('../models/User');
const { encrypt, decrypt, maskKey } = require('../services/crypto');

// ── مفتاح Claude API لكل مستخدم على حدة ─────────────────────────────────────
// كل مستخدم يجلب مفتاح Claude API الخاص به من console.anthropic.com ويحفظه
// من الإعدادات → الذكاء الاصطناعي. لا يوجد مفتاح مشترك على مستوى السيرفر —
// كل مستخدم يستخدم رصيده الخاص بحسابه في Anthropic.
//
// كاش خفيف لعملاء Anthropic (مفتاح واحد → عميل واحد مُعاد استخدامه) بدل
// إنشاء عميل جديد بكل طلب — بدون أي تخزين للمفتاح بصيغته الأصلية في الذاكرة
// لمدة أطول من عمر السيرفر نفسه.
const _clientCache = new Map(); // apiKey -> Anthropic client
function getClaudeClientForKey(apiKey) {
  if (_clientCache.has(apiKey)) return _clientCache.get(apiKey);
  const client = new Anthropic({ apiKey });
  _clientCache.set(apiKey, client);
  return client;
}

/**
 * getUserApiKey — يجلب ويفكّ تشفير مفتاح Claude الخاص بالمستخدم من قاعدة
 * البيانات. يرجع null لو المستخدم ما ضبط مفتاحه بعد.
 */
async function getUserApiKey(userId) {
  const user = await User.findById(userId).select('+aiApiKey');
  if (!user?.aiApiKey) return null;
  return decrypt(user.aiApiKey);
}

// رسالة موحّدة تُرجَع لكل نقطة نهاية عندما لا يوجد مفتاح محفوظ بعد —
// الواجهة الأمامية تتعرف عليها عبر code:'NO_AI_KEY' وتوجّه المستخدم للإعدادات
const NO_KEY_RESPONSE = {
  success: false,
  code: 'NO_AI_KEY',
  message: 'لم تُضِف مفتاح Claude API الخاص بك بعد. أضِفه من الإعدادات ← الذكاء الاصطناعي لتفعيل المساعد.',
};

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
async function askClaude({ apiKey, model = MODEL_MAIN, system, history = [], userMessage, maxTokens = 1500, temperature = 0.7 }) {
  const client = getClaudeClientForKey(apiKey);
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

    const apiKey = await getUserApiKey(userId);
    if (!apiKey) return res.status(200).json(NO_KEY_RESPONSE);

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
      apiKey,
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
    // مفتاح غير صالح/مرفوض من Anthropic → رسالة واضحة توجّه للإعدادات،
    // بدل إخفاء الخطأ خلف رد احتياطي عام يوحي بأن كل شيء تمام
    if (err.status === 401 || err.status === 403) {
      return res.status(200).json({
        success: false, code: 'INVALID_AI_KEY',
        message: 'مفتاح Claude API المحفوظ غير صالح أو مرفوض. تحقق منه من الإعدادات ← الذكاء الاصطناعي.',
      });
    }
    // أخطاء أخرى (شبكة، تحميل زائد على Anthropic...) → رد احتياطي عام
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

    const apiKey = await getUserApiKey(req.user.id);
    if (!apiKey) return res.status(200).json(NO_KEY_RESPONSE);

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
      apiKey,
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

    const apiKey = await getUserApiKey(req.user.id);
    if (!apiKey) return res.status(200).json(NO_KEY_RESPONSE);

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
      apiKey,
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

    const apiKey = await getUserApiKey(req.user.id);
    if (!apiKey) return res.status(200).json(NO_KEY_RESPONSE);

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
      apiKey,
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

    const apiKey = await getUserApiKey(req.user.id);
    if (!apiKey) return res.json({ success: true, data: { suggestions: [], page } });

    const erpContext = await buildERPContext(req.user.id, companyId, page);

    const suggPrompt = `بناءً على هذا السياق:
المستخدم في صفحة: ${page}
إحصائيات: ${JSON.stringify(erpContext.stats || {})}

اقترح 4 أسئلة قصيرة يمكن للمستخدم سؤالها الآن لتحسين أداء عمله.
كل سؤال في سطر واحد، بدون ترقيم، بالعربية، مباشر وعملي.
مثال: "ما هي المنتجات التي ستنفد قريباً؟"`;

    const { text: raw } = await askClaude({
      apiKey,
      model: MODEL_LIGHT,
      userMessage: suggPrompt,
      maxTokens: 200,
      temperature: 0.8,
    });

    const suggestions = raw?.split('\n').filter(s => s.trim().length > 5).slice(0, 4) || [];

    res.json({ success: true, data: { suggestions, page } });

  } catch (err) {
    // ميزة خلفية غير حرجة — فشلها لا يجب أن يظهر كخطأ مزعج للمستخدم
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
// 7. مفتاح Claude API الخاص بالمستخدم
// ═══════════════════════════════════════════════════════════════════

// يرجع فقط: هل يوجد مفتاح محفوظ؟ + آخر 4 خانات منه للعرض — لا يُرجع
// المفتاح كاملاً أبداً في أي استجابة API
exports.getKeyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+aiApiKey');
    const plain = user?.aiApiKey ? decrypt(user.aiApiKey) : null;
    res.json({
      success: true,
      data: { configured: !!plain, maskedKey: plain ? maskKey(plain) : null },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ success: false, message: 'المفتاح مطلوب' });
    }
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      return res.status(400).json({
        success: false,
        message: 'هذا لا يبدو مفتاح Claude API صحيح — يجب أن يبدأ بـ sk-ant-',
      });
    }

    // تحقق فعلي من صلاحية المفتاح قبل حفظه — استدعاء صغير جداً ورخيص
    // (Haiku + رسالة قصيرة) بدل حفظ مفتاح قد يكون خاطئاً بدون علم المستخدم
    try {
      const testClient = getClaudeClientForKey(trimmed);
      await testClient.messages.create({
        model: MODEL_LIGHT, max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }],
      });
    } catch (testErr) {
      _clientCache.delete(trimmed); // لا نُبقي عميلاً مرتبطاً بمفتاح فشل التحقق منه
      if (testErr.status === 401 || testErr.status === 403) {
        return res.status(400).json({ success: false, message: 'المفتاح غير صالح أو مرفوض من Anthropic. تأكد من نسخه كاملاً.' });
      }
      // أخطاء غير متعلقة بصحة المفتاح (شبكة، تحميل زائد) لا تمنع الحفظ
    }

    await User.findByIdAndUpdate(req.user.id, { aiApiKey: encrypt(trimmed) });
    res.json({ success: true, message: 'تم حفظ المفتاح بنجاح', data: { maskedKey: maskKey(trimmed) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeKey = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $unset: { aiApiKey: 1 } });
    res.json({ success: true, message: 'تم حذف المفتاح' });
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
