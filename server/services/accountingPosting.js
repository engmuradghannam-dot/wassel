/**
 * services/accountingPosting.js
 * ════════════════════════════════════════════════════════════════════════
 * الترابط المحاسبي التلقائي (Auto-Posting Engine)
 *
 * قبل هذا الملف: قسم المحاسبة كان معزولاً تماماً — لا أمر شراء ولا فاتورة
 * بيع ولا دفعة كانت تُنشئ أي قيد محاسبي. هذا الملف يسد الفجوة عبر نمط
 * القيد المزدوج (Double-Entry) القياسي المستخدم في SAP/Dynamics/Odoo:
 * كل حدث تجاري (استلام بضاعة، فاتورة بيع، تحصيل دفعة...) يُنشئ تلقائياً
 * قيداً موزوناً (مجموع المدين = مجموع الدائن) في دفتر اليومية.
 *
 * يُستدعى هذا الملف من services/businessLogic.js ومن مسارات الطلبات
 * (routes/purchaseOrderRoutes.js, routes/salesOrderRoutes.js) — وليس
 * العكس، حتى لا تنشأ حلقة استيراد دائرية.
 */

const Account      = require('../models/Accounting').Account;
const JournalEntry = require('../models/Accounting').JournalEntry;

// ─── دليل الحسابات القياسي (Standard Chart of Accounts) ───────────────────
// يُنشأ تلقائياً لكل شركة عند أول عملية محاسبية تلقائية — لا حاجة لإعداد
// يدوي مسبق. الأكواد مطابقة لنمط SAP/الفهرسة السعودية الشائعة.
const STANDARD_ACCOUNTS = {
  CASH:         { code: '1010', name: 'الصندوق',                nameEn: 'Cash on Hand',        type: 'asset',     category: 'current_asset' },
  BANK:         { code: '1020', name: 'البنك',                   nameEn: 'Bank',                 type: 'asset',     category: 'current_asset' },
  AR:           { code: '1200', name: 'ذمم مدينة (عملاء)',        nameEn: 'Accounts Receivable',  type: 'asset',     category: 'current_asset' },
  INVENTORY:    { code: '1300', name: 'المخزون',                  nameEn: 'Inventory',            type: 'asset',     category: 'current_asset' },
  VAT_INPUT:    { code: '1400', name: 'ضريبة القيمة المضافة - مدخلات', nameEn: 'VAT Receivable', type: 'asset',     category: 'current_asset' },
  AP:           { code: '2100', name: 'ذمم دائنة (موردون)',        nameEn: 'Accounts Payable',     type: 'liability', category: 'current_liability' },
  VAT_OUTPUT:   { code: '2400', name: 'ضريبة القيمة المضافة - مخرجات', nameEn: 'VAT Payable',    type: 'liability', category: 'current_liability' },
  SALES:        { code: '4000', name: 'إيرادات المبيعات',          nameEn: 'Sales Revenue',        type: 'revenue',   category: 'operating_revenue' },
  COGS:         { code: '5000', name: 'تكلفة البضاعة المباعة',      nameEn: 'Cost of Goods Sold',   type: 'expense',   category: 'cost_of_sales' },
  PURCHASES:    { code: '5100', name: 'المشتريات',                 nameEn: 'Purchases',            type: 'expense',   category: 'cost_of_sales' },
};

// Get-or-create — آمن للاستدعاء المتكرر (idempotent) بفضل الفهرس الفريد
// company+code في موديل Account
async function getOrCreateAccount(company, key) {
  const def = STANDARD_ACCOUNTS[key];
  if (!def) throw new Error(`حساب غير معروف في الدليل القياسي: ${key}`);
  let acc = await Account.findOne({ company, code: def.code });
  if (!acc) {
    acc = await Account.create({
      company, code: def.code, name: def.name, nameEn: def.nameEn,
      type: def.type, category: def.category,
    });
  }
  return acc;
}

// ─── القيد المحاسبي الأساسي ────────────────────────────────────────────────
async function postJournalEntry(company, { description, reference, referenceType, lines, userId }) {
  const totalDebit  = lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

  // لا نسمح بترحيل قيد غير موزون — هذا هو أساس علم المحاسبة (مدين = دائن)
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    console.error(`[Accounting] قيد غير موزون تم تجاهله: ${description} — مدين ${totalDebit} ≠ دائن ${totalCredit}`);
    return null;
  }
  if (totalDebit === 0) return null; // لا شيء لترحيله (مبلغ صفري)

  const entry = await JournalEntry.create({
    company, description, reference, referenceType,
    lines: lines.filter(l => (l.debit || l.credit)),
    status: 'posted',
    postedBy: userId,
    postedAt: new Date(),
  });

  // تحديث أرصدة الحسابات (asset/expense: مدين يزيد | liability/equity/revenue: دائن يزيد)
  for (const line of entry.lines) {
    const acc = await Account.findById(line.account);
    if (!acc) continue;
    const isDebitNormal = ['asset', 'expense'].includes(acc.type);
    const delta = isDebitNormal
      ? (line.debit || 0) - (line.credit || 0)
      : (line.credit || 0) - (line.debit || 0);
    await Account.findByIdAndUpdate(acc._id, { $inc: { balance: delta } });
  }

  return entry;
}

// ═══════════════════════════════════════════════════════════════════════
// 1. استلام أمر شراء → مخزون يزيد + ذمم دائنة (مورد) تزيد
//    Dr Inventory (subtotal) | Dr VAT Input (tax) | Cr Accounts Payable (total)
// ═══════════════════════════════════════════════════════════════════════
exports.postPurchaseReceipt = async ({ company, po, userId }) => {
  try {
    const [inventory, vatInput, ap] = await Promise.all([
      getOrCreateAccount(company, 'INVENTORY'),
      getOrCreateAccount(company, 'VAT_INPUT'),
      getOrCreateAccount(company, 'AP'),
    ]);
    const subtotal = po.subtotal || (po.total - (po.taxAmount || 0));
    const lines = [
      { account: inventory._id, debit: subtotal, credit: 0, description: `استلام بضاعة — ${po.orderNumber}` },
    ];
    if (po.taxAmount > 0) lines.push({ account: vatInput._id, debit: po.taxAmount, credit: 0, description: 'ضريبة قيمة مضافة - مدخلات' });
    lines.push({ account: ap._id, debit: 0, credit: po.total, description: `مستحق للمورد — ${po.orderNumber}` });

    return await postJournalEntry(company, {
      description: `استلام أمر شراء ${po.orderNumber}`,
      reference: po.orderNumber, referenceType: 'purchase',
      lines, userId,
    });
  } catch (err) {
    console.error('[Accounting] فشل ترحيل قيد استلام الشراء:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 2. تسليم أمر بيع (تكلفة البضاعة المباعة) → المخزون ينقص
//    Dr COGS (cost) | Cr Inventory (cost)
// ═══════════════════════════════════════════════════════════════════════
exports.postCOGS = async ({ company, so, costTotal, userId }) => {
  try {
    if (!costTotal || costTotal <= 0) return null;
    const [cogs, inventory] = await Promise.all([
      getOrCreateAccount(company, 'COGS'),
      getOrCreateAccount(company, 'INVENTORY'),
    ]);
    return await postJournalEntry(company, {
      description: `تكلفة البضاعة المباعة — ${so.orderNumber}`,
      reference: so.orderNumber, referenceType: 'sale',
      lines: [
        { account: cogs._id,      debit: costTotal, credit: 0, description: 'تكلفة بضاعة مباعة' },
        { account: inventory._id, debit: 0, credit: costTotal, description: 'نقص المخزون' },
      ],
      userId,
    });
  } catch (err) {
    console.error('[Accounting] فشل ترحيل قيد تكلفة البضاعة المباعة:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 3. فاتورة بيع → إيراد مبيعات + ذمم مدينة (عميل) تزيد
//    Dr Accounts Receivable (total) | Cr Sales (subtotal) | Cr VAT Output (tax)
// ═══════════════════════════════════════════════════════════════════════
exports.postSalesInvoice = async ({ company, so, userId }) => {
  try {
    const [ar, sales, vatOutput] = await Promise.all([
      getOrCreateAccount(company, 'AR'),
      getOrCreateAccount(company, 'SALES'),
      getOrCreateAccount(company, 'VAT_OUTPUT'),
    ]);
    const subtotal = so.subtotal || (so.total - (so.taxAmount || 0));
    const lines = [
      { account: ar._id, debit: so.total, credit: 0, description: `فاتورة بيع — ${so.invoiceNumber || so.orderNumber}` },
      { account: sales._id, debit: 0, credit: subtotal, description: 'إيراد مبيعات' },
    ];
    if (so.taxAmount > 0) lines.push({ account: vatOutput._id, debit: 0, credit: so.taxAmount, description: 'ضريبة قيمة مضافة - مخرجات' });

    return await postJournalEntry(company, {
      description: `فاتورة بيع ${so.invoiceNumber || so.orderNumber}`,
      reference: so.invoiceNumber || so.orderNumber, referenceType: 'sale',
      lines, userId,
    });
  } catch (err) {
    console.error('[Accounting] فشل ترحيل قيد فاتورة البيع:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 4. تحصيل دفعة من عميل → نقدية/بنك تزيد + ذمم مدينة تنقص
//    Dr Cash/Bank (amount) | Cr Accounts Receivable (amount)
// ═══════════════════════════════════════════════════════════════════════
exports.postCustomerPayment = async ({ company, so, amount, method, userId }) => {
  try {
    if (!amount || amount <= 0) return null;
    const [cashOrBank, ar] = await Promise.all([
      getOrCreateAccount(company, method === 'cash' ? 'CASH' : 'BANK'),
      getOrCreateAccount(company, 'AR'),
    ]);
    return await postJournalEntry(company, {
      description: `تحصيل دفعة من العميل — ${so.orderNumber}`,
      reference: so.orderNumber, referenceType: 'receipt',
      lines: [
        { account: cashOrBank._id, debit: amount, credit: 0, description: 'تحصيل نقدي/بنكي' },
        { account: ar._id, debit: 0, credit: amount, description: 'تخفيض ذمم مدينة' },
      ],
      userId,
    });
  } catch (err) {
    console.error('[Accounting] فشل ترحيل قيد تحصيل الدفعة:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 5. سداد دفعة لمورد → ذمم دائنة تنقص + نقدية/بنك تنقص
//    Dr Accounts Payable (amount) | Cr Cash/Bank (amount)
// ═══════════════════════════════════════════════════════════════════════
exports.postSupplierPayment = async ({ company, po, amount, method, userId }) => {
  try {
    if (!amount || amount <= 0) return null;
    const [ap, cashOrBank] = await Promise.all([
      getOrCreateAccount(company, 'AP'),
      getOrCreateAccount(company, method === 'cash' ? 'CASH' : 'BANK'),
    ]);
    return await postJournalEntry(company, {
      description: `سداد دفعة للمورد — ${po.orderNumber}`,
      reference: po.orderNumber, referenceType: 'payment',
      lines: [
        { account: ap._id, debit: amount, credit: 0, description: 'تخفيض ذمم دائنة' },
        { account: cashOrBank._id, debit: 0, credit: amount, description: 'سداد نقدي/بنكي' },
      ],
      userId,
    });
  } catch (err) {
    console.error('[Accounting] فشل ترحيل قيد سداد المورد:', err.message);
    return null;
  }
};

exports.postJournalEntry   = postJournalEntry;
exports.getOrCreateAccount = getOrCreateAccount;
exports.STANDARD_ACCOUNTS  = STANDARD_ACCOUNTS;
