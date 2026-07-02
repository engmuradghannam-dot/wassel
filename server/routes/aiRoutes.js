const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const ai      = require('../controllers/aiController');

// ─── ERP Assistant ─────────────────────────────────────────────────────────
router.post('/chat',         protect, ai.chat);
router.delete('/chat',       protect, ai.clearHistory);

// ─── Data Analysis ─────────────────────────────────────────────────────────
router.post('/analyze',      protect, ai.analyze);

// ─── Code Developer (superadmin only) ──────────────────────────────────────
router.post('/develop',      protect, ai.develop);

// ─── HR Advisor ────────────────────────────────────────────────────────────
router.post('/hr-advice',    protect, ai.hrAdvice);

// ─── Smart Suggestions ─────────────────────────────────────────────────────
router.get('/suggestions',   protect, ai.suggestions);

// ─── مفاتيح مزودي الذكاء الاصطناعي الخاصة بالمستخدم (Claude/Gemini/ChatGPT) ──
router.get('/key-status',       protect, ai.getKeyStatus);
router.put('/key',              protect, ai.setKey);           // body: { provider, apiKey }
router.delete('/key/:provider', protect, ai.removeKey);

module.exports = router;
