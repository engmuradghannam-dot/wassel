const mongoose = require('mongoose');

// ─── Chart of Accounts ────────────────────────────────────────────────────
const accountSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  nameEn: { type: String },
  type: {
    type: String,
    required: true,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense']
  },
  category: { type: String }, // e.g. 'current_asset', 'fixed_asset', 'current_liability'
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { timestamps: true });
// رمز الحساب فريد داخل الشركة فقط — لا يتعارض بين شركات مختلفة
accountSchema.index({ company: 1, code: 1 }, { unique: true });

// ─── Journal Entry ─────────────────────────────────────────────────────────
const journalEntrySchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  entryNumber: { type: String },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  reference: { type: String },         // e.g. invoice number, PO number
  referenceType: {
    type: String,
    enum: ['manual', 'purchase', 'sale', 'payment', 'receipt', 'adjustment']
  },
  lines: [{
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: { type: String }
  }],
  status: { type: String, enum: ['draft', 'posted', 'voided'], default: 'draft' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date },
  voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  voidedAt: { type: Date },
  totalDebit: { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 }
}, { timestamps: true });
journalEntrySchema.index({ company: 1, entryNumber: 1 }, { unique: true, sparse: true });
journalEntrySchema.index({ company: 1, status: 1, date: -1 });

// Auto-calculate totals before save
journalEntrySchema.pre('save', function (next) {
  this.totalDebit = this.lines.reduce((s, l) => s + (l.debit || 0), 0);
  this.totalCredit = this.lines.reduce((s, l) => s + (l.credit || 0), 0);
  next();
});

// Auto-generate entry number — مُرقَّم داخل نطاق الشركة فقط
journalEntrySchema.pre('save', async function (next) {
  if (!this.entryNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ company: this.company });
    this.entryNumber = `JE-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ─── Transaction / Payment ─────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  transactionNumber: { type: String },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'SAR' },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  counterAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  description: { type: String },
  reference: { type: String },
  paymentMethod: { type: String, enum: ['cash', 'bank', 'card', 'transfer', 'check'] },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  journalEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
transactionSchema.index({ company: 1, transactionNumber: 1 }, { unique: true, sparse: true });
transactionSchema.index({ company: 1, date: -1 });

transactionSchema.pre('save', async function (next) {
  if (!this.transactionNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ company: this.company });
    this.transactionNumber = `TXN-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ─── Cost Center ───────────────────────────────────────────────────────────
const costCenterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  nameEn: { type: String },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
costCenterSchema.index({ company: 1, code: 1 }, { unique: true });

const Account = mongoose.model('Account', accountSchema);
const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const CostCenter = mongoose.model('CostCenter', costCenterSchema);

module.exports = { Account, JournalEntry, Transaction, CostCenter };
