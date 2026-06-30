const { Account, JournalEntry, Transaction, CostCenter } = require('../models/Accounting');
const { getCompany } = require('../middleware/auth');

// ════════════════════════════════════════════════════════
// ACCOUNTS (Chart of Accounts)
// ════════════════════════════════════════════════════════

exports.getAccounts = async (req, res) => {
  try {
    const co = getCompany(req);
    const { type, isActive } = req.query;
    const filter = { company: co };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const accounts = await Account.find(filter).populate('parent', 'name code').sort({ code: 1 });
    res.json({ success: true, count: accounts.length, data: accounts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getAccount = async (req, res) => {
  try {
    const co = getCompany(req);
    const account = await Account.findOne({ _id: req.params.id, company: co }).populate('parent', 'name code');
    if (!account) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });
    res.json({ success: true, data: account });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createAccount = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بشركة' });
    const account = await Account.create({ ...req.body, company: co });
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'رمز الحساب مستخدم بالفعل في شركتك' });
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const co = getCompany(req);
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, company: co }, req.body, { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });
    res.json({ success: true, data: account });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteAccount = async (req, res) => {
  try {
    const co = getCompany(req);
    // Check if account has journal lines (within the same company only)
    const hasLines = await JournalEntry.findOne({ company: co, 'lines.account': req.params.id });
    if (hasLines) return res.status(400).json({ success: false, message: 'لا يمكن حذف حساب له قيود محاسبية' });
    const account = await Account.findOneAndDelete({ _id: req.params.id, company: co });
    if (!account) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });
    res.json({ success: true, message: 'تم حذف الحساب' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Seed default chart of accounts — لكل شركة على حدة
exports.seedAccounts = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بشركة' });

    const existing = await Account.countDocuments({ company: co });
    if (existing > 0) return res.json({ success: true, message: 'دليل الحسابات موجود بالفعل', count: existing });

    const defaults = [
      // Assets
      { code: '1000', name: 'الأصول', nameEn: 'Assets', type: 'asset', category: 'heading' },
      { code: '1100', name: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'asset', category: 'current_asset' },
      { code: '1110', name: 'النقدية وما في حكمها', nameEn: 'Cash & Cash Equivalents', type: 'asset', category: 'current_asset' },
      { code: '1120', name: 'البنك الرئيسي', nameEn: 'Main Bank Account', type: 'asset', category: 'current_asset' },
      { code: '1130', name: 'الصندوق النقدي', nameEn: 'Petty Cash', type: 'asset', category: 'current_asset' },
      { code: '1200', name: 'الذمم المدينة', nameEn: 'Accounts Receivable', type: 'asset', category: 'current_asset' },
      { code: '1300', name: 'المخزون', nameEn: 'Inventory', type: 'asset', category: 'current_asset' },
      { code: '1400', name: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'asset', category: 'fixed_asset' },
      { code: '1410', name: 'الأثاث والمعدات', nameEn: 'Furniture & Equipment', type: 'asset', category: 'fixed_asset' },
      { code: '1420', name: 'أجهزة الحاسب', nameEn: 'Computer Equipment', type: 'asset', category: 'fixed_asset' },
      // Liabilities
      { code: '2000', name: 'الخصوم', nameEn: 'Liabilities', type: 'liability', category: 'heading' },
      { code: '2100', name: 'الخصوم المتداولة', nameEn: 'Current Liabilities', type: 'liability', category: 'current_liability' },
      { code: '2110', name: 'الذمم الدائنة', nameEn: 'Accounts Payable', type: 'liability', category: 'current_liability' },
      { code: '2120', name: 'ضريبة القيمة المضافة المستحقة', nameEn: 'VAT Payable', type: 'liability', category: 'current_liability' },
      { code: '2200', name: 'القروض طويلة الأجل', nameEn: 'Long-term Loans', type: 'liability', category: 'long_term_liability' },
      // Equity
      { code: '3000', name: 'حقوق الملكية', nameEn: 'Equity', type: 'equity', category: 'heading' },
      { code: '3100', name: 'رأس المال', nameEn: 'Capital', type: 'equity', category: 'equity' },
      { code: '3200', name: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'equity', category: 'equity' },
      // Revenue
      { code: '4000', name: 'الإيرادات', nameEn: 'Revenue', type: 'revenue', category: 'heading' },
      { code: '4100', name: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'revenue', category: 'revenue' },
      { code: '4200', name: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'revenue', category: 'revenue' },
      { code: '4300', name: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'revenue', category: 'revenue' },
      // Expenses
      { code: '5000', name: 'المصروفات', nameEn: 'Expenses', type: 'expense', category: 'heading' },
      { code: '5100', name: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'expense', category: 'expense' },
      { code: '5200', name: 'مصروفات الرواتب', nameEn: 'Salary Expenses', type: 'expense', category: 'expense' },
      { code: '5300', name: 'مصروفات الإيجار', nameEn: 'Rent Expenses', type: 'expense', category: 'expense' },
      { code: '5400', name: 'مصروفات المرافق', nameEn: 'Utilities Expenses', type: 'expense', category: 'expense' },
      { code: '5500', name: 'مصروفات إدارية عامة', nameEn: 'General & Admin Expenses', type: 'expense', category: 'expense' },
      { code: '5600', name: 'مصروفات تسويقية', nameEn: 'Marketing Expenses', type: 'expense', category: 'expense' },
    ];

    await Account.insertMany(defaults.map(d => ({ ...d, company: co })));
    res.json({ success: true, message: 'تم إنشاء دليل الحسابات الافتراضي', count: defaults.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ════════════════════════════════════════════════════════
// JOURNAL ENTRIES
// ════════════════════════════════════════════════════════

exports.getJournalEntries = async (req, res) => {
  try {
    const co = getCompany(req);
    const { status, from, to, page = 1, limit = 50 } = req.query;
    const filter = { company: co };
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const entries = await JournalEntry.find(filter)
      .populate('lines.account', 'code name')
      .populate('postedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await JournalEntry.countDocuments(filter);
    res.json({ success: true, count: entries.length, total, data: entries });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getJournalEntry = async (req, res) => {
  try {
    const co = getCompany(req);
    const entry = await JournalEntry.findOne({ _id: req.params.id, company: co })
      .populate('lines.account', 'code name type')
      .populate('postedBy', 'name')
      .populate('voidedBy', 'name');
    if (!entry) return res.status(404).json({ success: false, message: 'القيد غير موجود' });
    res.json({ success: true, data: entry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createJournalEntry = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بشركة' });

    const { lines } = req.body;
    // Validate debit = credit
    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ success: false, message: 'مجموع المدين يجب أن يساوي مجموع الدائن' });
    }

    // Validate every referenced account actually belongs to this company
    const accountIds = lines.map(l => l.account);
    const ownedCount = await Account.countDocuments({ _id: { $in: accountIds }, company: co });
    if (ownedCount !== new Set(accountIds.map(String)).size) {
      return res.status(400).json({ success: false, message: 'أحد الحسابات المحددة لا ينتمي لشركتك' });
    }

    const entry = await JournalEntry.create({ ...req.body, company: co });
    const populated = await entry.populate('lines.account', 'code name');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.postJournalEntry = async (req, res) => {
  try {
    const co = getCompany(req);
    const entry = await JournalEntry.findOne({ _id: req.params.id, company: co });
    if (!entry) return res.status(404).json({ success: false, message: 'القيد غير موجود' });
    if (entry.status === 'posted') return res.status(400).json({ success: false, message: 'القيد محدث بالفعل' });
    if (entry.status === 'voided') return res.status(400).json({ success: false, message: 'القيد ملغى' });

    // Update account balances — scoped to company
    for (const line of entry.lines) {
      const account = await Account.findOne({ _id: line.account, company: co });
      if (!account) continue;
      const isDebitNature = ['asset', 'expense'].includes(account.type);
      const change = isDebitNature ? (line.debit - line.credit) : (line.credit - line.debit);
      await Account.findOneAndUpdate({ _id: line.account, company: co }, { $inc: { balance: change } });
    }

    entry.status = 'posted';
    entry.postedBy = req.user.id;
    entry.postedAt = new Date();
    await entry.save();

    res.json({ success: true, data: entry, message: 'تم ترحيل القيد بنجاح' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.voidJournalEntry = async (req, res) => {
  try {
    const co = getCompany(req);
    const entry = await JournalEntry.findOne({ _id: req.params.id, company: co });
    if (!entry) return res.status(404).json({ success: false, message: 'القيد غير موجود' });
    if (entry.status === 'voided') return res.status(400).json({ success: false, message: 'القيد ملغى بالفعل' });

    if (entry.status === 'posted') {
      for (const line of entry.lines) {
        const account = await Account.findOne({ _id: line.account, company: co });
        if (!account) continue;
        const isDebitNature = ['asset', 'expense'].includes(account.type);
        const change = isDebitNature ? (line.debit - line.credit) : (line.credit - line.debit);
        await Account.findOneAndUpdate({ _id: line.account, company: co }, { $inc: { balance: -change } });
      }
    }

    entry.status = 'voided';
    entry.voidedBy = req.user.id;
    entry.voidedAt = new Date();
    await entry.save();

    res.json({ success: true, data: entry, message: 'تم إلغاء القيد' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteJournalEntry = async (req, res) => {
  try {
    const co = getCompany(req);
    const entry = await JournalEntry.findOne({ _id: req.params.id, company: co });
    if (!entry) return res.status(404).json({ success: false, message: 'القيد غير موجود' });
    if (entry.status === 'posted') return res.status(400).json({ success: false, message: 'لا يمكن حذف قيد مرحّل' });
    await entry.deleteOne();
    res.json({ success: true, message: 'تم حذف القيد' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ════════════════════════════════════════════════════════
// TRANSACTIONS
// ════════════════════════════════════════════════════════

exports.getTransactions = async (req, res) => {
  try {
    const co = getCompany(req);
    const { type, from, to, page = 1, limit = 50 } = req.query;
    const filter = { company: co };
    if (type) filter.type = type;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const txns = await Transaction.find(filter)
      .populate('account', 'code name')
      .populate('counterAccount', 'code name')
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, count: txns.length, total, data: txns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createTransaction = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success: false, message: 'الحساب غير مرتبط بشركة' });
    const txn = await Transaction.create({ ...req.body, company: co, createdBy: req.user.id });
    res.status(201).json({ success: true, data: txn });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// ════════════════════════════════════════════════════════
// FINANCIAL REPORTS
// ════════════════════════════════════════════════════════

// Balance Sheet
exports.getBalanceSheet = async (req, res) => {
  try {
    const co = getCompany(req);
    const assets = await Account.find({ company: co, type: 'asset', isActive: true }).sort({ code: 1 });
    const liabilities = await Account.find({ company: co, type: 'liability', isActive: true }).sort({ code: 1 });
    const equity = await Account.find({ company: co, type: 'equity', isActive: true }).sort({ code: 1 });

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

    res.json({
      success: true,
      data: {
        assets, liabilities, equity,
        totalAssets, totalLiabilities, totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Income Statement (P&L)
exports.getIncomeStatement = async (req, res) => {
  try {
    const co = getCompany(req);
    const revenues = await Account.find({ company: co, type: 'revenue', isActive: true }).sort({ code: 1 });
    const expenses = await Account.find({ company: co, type: 'expense', isActive: true }).sort({ code: 1 });

    const totalRevenue = revenues.reduce((s, a) => s + a.balance, 0);
    const totalExpenses = expenses.reduce((s, a) => s + a.balance, 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: { revenues, expenses, totalRevenue, totalExpenses, netIncome }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Trial Balance
exports.getTrialBalance = async (req, res) => {
  try {
    const co = getCompany(req);
    const accounts = await Account.find({ company: co, isActive: true }).sort({ code: 1 });
    const withBalances = accounts.map(a => ({
      ...a.toObject(),
      debit: a.balance > 0 && ['asset', 'expense'].includes(a.type) ? a.balance : 0,
      credit: a.balance > 0 && ['liability', 'equity', 'revenue'].includes(a.type) ? a.balance : 0
    }));

    const totalDebit = withBalances.reduce((s, a) => s + a.debit, 0);
    const totalCredit = withBalances.reduce((s, a) => s + a.credit, 0);

    res.json({
      success: true,
      data: { accounts: withBalances, totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Account Ledger (كشف حساب)
exports.getAccountLedger = async (req, res) => {
  try {
    const co = getCompany(req);
    const { accountId } = req.params;
    const { from, to } = req.query;

    const account = await Account.findOne({ _id: accountId, company: co });
    if (!account) return res.status(404).json({ success: false, message: 'الحساب غير موجود' });

    const filter = { company: co, 'lines.account': accountId, status: 'posted' };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const entries = await JournalEntry.find(filter)
      .populate('lines.account', 'code name')
      .sort({ date: 1 });

    let runningBalance = 0;
    const ledgerLines = [];

    for (const entry of entries) {
      for (const line of entry.lines) {
        if (line.account._id.toString() === accountId) {
          runningBalance += (line.debit || 0) - (line.credit || 0);
          ledgerLines.push({
            date: entry.date,
            entryNumber: entry.entryNumber,
            description: entry.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            balance: runningBalance
          });
        }
      }
    }

    res.json({ success: true, data: { account, lines: ledgerLines } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
