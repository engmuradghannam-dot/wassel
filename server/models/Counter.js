const mongoose = require('mongoose');

/**
 * Counter — عدّاد تسلسلي ذري لكل شركة ولكل نوع مستند (PO, SO, INV, PRJ...).
 * ─────────────────────────────────────────────────────────────────────
 * لماذا هذا الملف موجود:
 * كل الأماكن السابقة التي ولّدت أرقام المستندات كانت تعتمد على
 * `countDocuments() + 1` أو حتى `Date.now()` — كلاهما غير آمن:
 *
 * 1) countDocuments()+1: لو طلب شراء اتنين اتعملوا في نفس اللحظة
 *    (نفس الميلي ثانية تقريباً، شائع جداً مع أكتر من مستخدم)، ممكن
 *    الاتنين يقروا نفس العدد الحالي قبل ما أي واحد يحفظ، فيطلع نفس
 *    الرقم مرتين. وكمان الرقم يرجع للخلف لو انحذف مستند قديم.
 * 2) Date.now(): مش رقم تسلسلي متتابع من 1 للا نهاية زي ما هو مطلوب،
 *    ومش قابل للقراءة/الترتيب بمنطقية للمستخدم.
 *
 * الحل: عملية MongoDB واحدة ذرّية (findOneAndUpdate + $inc) — ضمنيًا
 * لا يمكن لطلبين يقرأوا نفس القيمة أبداً، بغض النظر عن التزامن.
 */
const counterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  key:     { type: String, required: true }, // e.g. 'purchase_order', 'invoice', 'project'
  year:    { type: Number, required: true }, // sequences reset per calendar year
  seq:     { type: Number, default: 0 },
}, { timestamps: true });

counterSchema.index({ company: 1, key: 1, year: 1 }, { unique: true });

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

module.exports = Counter;
