const Counter = require('../models/Counter');

/**
 * getNextSequence — يرجع الرقم التالي بشكل ذرّي وآمن تحت أي تزامن.
 *
 * @param {ObjectId|string} companyId
 * @param {string} key      نوع المستند: 'purchase_order' | 'invoice' | 'quotation' | 'project' | ...
 * @param {object} opts     { prefix: 'PO', pad: 5, year: currentYear }
 * @returns {Promise<{ seq:number, formatted:string }>}
 *
 * مثال:
 *   const { formatted } = await getNextSequence(companyId, 'purchase_order', { prefix:'PO' });
 *   // => { seq: 1, formatted: 'PO-2026-00001' }
 *   // الطلب التالي في نفس الشركة يرجع 'PO-2026-00002' حتى لو صار
 *   // بنفس اللحظة تمامًا من مستخدم آخر — العملية ذرّية على مستوى MongoDB.
 */
async function getNextSequence(companyId, key, opts = {}) {
  const year   = opts.year || new Date().getFullYear();
  const prefix = opts.prefix || key.toUpperCase();
  const pad    = opts.pad ?? 5;

  if (!companyId) {
    // لا يوجد سياق شركة (حالة نادرة جداً) — تراجع آمن بدون كسر الطلب
    const fallback = Date.now();
    return { seq: fallback, formatted: `${prefix}-${year}-${fallback}` };
  }

  const doc = await Counter.findOneAndUpdate(
    { company: companyId, key, year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const formatted = `${prefix}-${year}-${String(doc.seq).padStart(pad, '0')}`;
  return { seq: doc.seq, formatted };
}

module.exports = { getNextSequence };
