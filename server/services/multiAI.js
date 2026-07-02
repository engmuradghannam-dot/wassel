const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const User = require('../models/User');
const { decrypt } = require('./crypto');

/**
 * services/multiAI.js
 * ─────────────────────────────────────────────────────────────────────
 * كل مستخدم يقدر يضبط مفتاحه الخاص لأي عدد من مزودي الذكاء الاصطناعي
 * الثلاثة (Claude، Gemini، ChatGPT) من الإعدادات. لو ضبط أكثر من واحد،
 * النظام يستدعيهم كلهم بالتوازي على نفس السؤال، ثم "يعملون معاً" فعلياً:
 * أحدهم (أول واحد ناجح) يُدمج إجاباتهم في إجابة نهائية واحدة أفضل —
 * مو بس عرض الإجابات جنب بعض.
 *
 * لو مفتاح واحد بس مضبوط → يشتغل عادي بمفرده بدون أي خطوة دمج إضافية
 * (بدون تكلفة أو تأخير زائد).
 */

// ── Claude ───────────────────────────────────────────────────────────────
const _claudeCache = new Map();
function claudeClient(apiKey) {
  if (!_claudeCache.has(apiKey)) _claudeCache.set(apiKey, new Anthropic({ apiKey }));
  return _claudeCache.get(apiKey);
}
async function callClaude(apiKey, { system, history = [], userMessage, maxTokens, temperature, light }) {
  const model = light ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-5';
  const res = await claudeClient(apiKey).messages.create({
    model, max_tokens: maxTokens, temperature,
    system: system || undefined,
    messages: [...history.map(h => ({ role: h.role, content: h.content })), { role: 'user', content: userMessage }],
  });
  return res.content?.find(b => b.type === 'text')?.text || '';
}

// ── Gemini ───────────────────────────────────────────────────────────────
const _geminiCache = new Map();
function geminiClient(apiKey) {
  if (!_geminiCache.has(apiKey)) _geminiCache.set(apiKey, new GoogleGenerativeAI(apiKey));
  return _geminiCache.get(apiKey);
}
async function callGemini(apiKey, { system, history = [], userMessage, maxTokens, temperature, light }) {
  // gemini-2.5-pro لها حصة مجانية = صفر تمامًا على حسابات Google AI Studio
  // العادية (تأكدنا من هذا فعليًا من رسالة خطأ 429 حقيقية) — نستخدم flash
  // دائمًا بدل pro حتى يشتغل المزود فعليًا على حساب مجاني بدون فوترة
  const modelName = 'gemini-2.5-flash';
  const model = geminiClient(apiKey).getGenerativeModel({
    model: modelName,
    systemInstruction: system || undefined,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  });
  // Gemini يتوقع أدوار 'user'/'model' (مو 'assistant') ومفتاح 'parts' بدل 'content'
  const geminiHistory = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));
  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(userMessage);
  return result.response.text() || '';
}

// ── ChatGPT (OpenAI) ─────────────────────────────────────────────────────
const _openaiCache = new Map();
function openaiClient(apiKey) {
  if (!_openaiCache.has(apiKey)) _openaiCache.set(apiKey, new OpenAI({ apiKey }));
  return _openaiCache.get(apiKey);
}
async function callOpenAI(apiKey, { system, history = [], userMessage, maxTokens, temperature, light }) {
  const model = light ? 'gpt-5-mini' : 'gpt-5';
  const res = await openaiClient(apiKey).chat.completions.create({
    model,
    max_completion_tokens: maxTokens,
    temperature,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ],
  });
  return res.choices?.[0]?.message?.content || '';
}

// ── Groq (مجاني إلى حد كبير — نماذج مفتوحة مثل Llama بسرعة عالية) ─────────
// Groq يعرض نفس بروتوكول OpenAI تمامًا، فنعيد استخدام مكتبة openai بدل
// تثبيت مكتبة منفصلة — فقط نغيّر baseURL
const _groqCache = new Map();
function groqClient(apiKey) {
  if (!_groqCache.has(apiKey)) _groqCache.set(apiKey, new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }));
  return _groqCache.get(apiKey);
}
async function callGroq(apiKey, { system, history = [], userMessage, maxTokens, temperature, light }) {
  const model = light ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';
  const res = await groqClient(apiKey).chat.completions.create({
    model, max_tokens: maxTokens, temperature,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ],
  });
  return res.choices?.[0]?.message?.content || '';
}

// ── DeepSeek (رخيص جداً، وله رصيد تجريبي مجاني عند التسجيل) ───────────────
// نفس الفكرة — بروتوكول متوافق مع OpenAI، baseURL مختلف بس
const _deepseekCache = new Map();
function deepseekClient(apiKey) {
  if (!_deepseekCache.has(apiKey)) _deepseekCache.set(apiKey, new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' }));
  return _deepseekCache.get(apiKey);
}
async function callDeepSeek(apiKey, { system, history = [], userMessage, maxTokens, temperature }) {
  const res = await deepseekClient(apiKey).chat.completions.create({
    model: 'deepseek-chat', max_tokens: maxTokens, temperature,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ],
  });
  return res.choices?.[0]?.message?.content || '';
}

// ── Grok (xAI) ─────────────────────────────────────────────────────────
const _grokCache = new Map();
function grokClient(apiKey) {
  if (!_grokCache.has(apiKey)) _grokCache.set(apiKey, new OpenAI({ apiKey, baseURL: 'https://api.x.ai/v1' }));
  return _grokCache.get(apiKey);
}
async function callGrok(apiKey, { system, history = [], userMessage, maxTokens, temperature, light }) {
  const model = light ? 'grok-4-fast' : 'grok-4';
  const res = await grokClient(apiKey).chat.completions.create({
    model, max_tokens: maxTokens, temperature,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage },
    ],
  });
  return res.choices?.[0]?.message?.content || '';
}

const PROVIDERS = {
  claude:   { label: 'Claude',   call: callClaude,   keyField: 'aiApiKey',       prefix: 'sk-ant-' },
  gemini:   { label: 'Gemini',   call: callGemini,   keyField: 'geminiApiKey',   prefix: 'AIzaSy'  },
  openai:   { label: 'ChatGPT',  call: callOpenAI,   keyField: 'openaiApiKey',   prefix: 'sk-'     },
  groq:     { label: 'Groq',     call: callGroq,     keyField: 'groqApiKey',     prefix: 'gsk_'    },
  deepseek: { label: 'DeepSeek', call: callDeepSeek, keyField: 'deepseekApiKey', prefix: 'sk-'     },
  grok:     { label: 'Grok',     call: callGrok,     keyField: 'grokApiKey',     prefix: 'xai-'    },
};

/**
 * getUserProviderKeys — يجلب ويفكّ تشفير كل مفاتيح المستخدم دفعة واحدة.
 * أي مفتاح غير مضبوط يرجع null.
 */
async function getUserProviderKeys(userId) {
  const selectFields = Object.values(PROVIDERS).map(p => `+${p.keyField}`).join(' ');
  const user = await User.findById(userId).select(selectFields);
  const out = {};
  for (const [id, p] of Object.entries(PROVIDERS)) {
    out[id] = user?.[p.keyField] ? decrypt(user[p.keyField]) : null;
  }
  return out;
}

/**
 * askEnsemble — يستدعي كل المزودين المضبوطين بالتوازي، ثم يدمج إجاباتهم
 * في إجابة واحدة نهائية لو نجح أكثر من واحد. يرمي خطأ NO_KEY لو ما فيه
 * ولا مفتاح مضبوط، وخطأ ALL_FAILED لو كل المزودين المضبوطين فشلوا.
 */
async function askEnsemble({ userId, system, history = [], userMessage, maxTokens = 1500, temperature = 0.7, light = false }) {
  const keys = await getUserProviderKeys(userId);
  const configured = Object.entries(PROVIDERS).filter(([id]) => keys[id]);

  if (configured.length === 0) {
    const err = new Error('NO_KEY'); err.code = 'NO_KEY'; throw err;
  }

  const results = await Promise.allSettled(
    configured.map(([id, p]) => p.call(keys[id], { system, history, userMessage, maxTokens, temperature, light })
      .then(text => ({ provider: id, text })))
  );

  const successes = results.filter(r => r.status === 'fulfilled' && r.value.text?.trim()).map(r => r.value);
  const failures = results
    .map((r, i) => r.status === 'rejected' ? { provider: configured[i][0], error: r.reason } : null)
    .filter(Boolean);
  const failedProviders = failures.map(f => ({
    provider: f.provider,
    reason: f.error?.message || String(f.error) || 'unknown error',
  }));

  if (successes.length === 0) {
    const err = new Error('ALL_FAILED');
    err.code = 'ALL_FAILED';
    err.failures = failures;
    throw err;
  }

  if (successes.length === 1) {
    return { text: successes[0].text, providers: [successes[0].provider], synthesized: false, failedProviders };
  }

  // ── أكثر من مزود نجح: ندمج الإجابات في إجابة واحدة نهائية أفضل ──────────
  // نستخدم أول مزود ناجح للدمج (تفضيل Claude لو كان من ضمن الناجحين، لجودة
  // التحرير والتلخيص العالية عادة)
  const synthesizerId = successes.find(s => s.provider === 'claude')?.provider || successes[0].provider;
  const synthPrompt = `فيما يلي إجابات عدة نماذج ذكاء اصطناعي مختلفة على نفس سؤال المستخدم. ادمجها في إجابة واحدة نهائية، أدق وأشمل وأوضح من أي إجابة منفردة، مستفيداً من نقاط القوة في كل واحدة وتجاهل أي تكرار أو تناقض بذكاء. لا تذكر أسماء النماذج أو أنك تدمج إجابات — قدّم الإجابة النهائية مباشرة وكأنها إجابتك أنت.

سؤال المستخدم: ${userMessage}

${successes.map((s, i) => `── إجابة ${i + 1} ──\n${s.text}`).join('\n\n')}`;

  try {
    const finalText = await PROVIDERS[synthesizerId].call(keys[synthesizerId], {
      system: 'أنت محرر خبير مهمتك دمج عدة إجابات في إجابة واحدة نهائية دقيقة وواضحة ومباشرة.',
      userMessage: synthPrompt,
      maxTokens, temperature: 0.3,
    });
    return { text: finalText || successes[0].text, providers: successes.map(s => s.provider), synthesized: true, failedProviders };
  } catch {
    // فشل الدمج نفسه (نادر) → نرجع أفضل إجابة منفردة بدل ما نفشل بالكامل
    return { text: successes[0].text, providers: successes.map(s => s.provider), synthesized: false, failedProviders };
  }
}

module.exports = { PROVIDERS, getUserProviderKeys, askEnsemble, callClaude, callGemini, callOpenAI, callGroq, callDeepSeek, callGrok };
