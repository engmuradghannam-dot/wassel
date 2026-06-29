const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  // ─── Identity ─────────────────────────────────────────────────
  name:     { type: String, required: true },
  year:     { type: Number, required: true },
  type:     { type: String, enum: ['annual','quarterly','project','department'], default: 'annual' },
  status:   { type: String, enum: ['draft','under_review','approved','active','closed'], default: 'draft' },
  currency: { type: String, default: 'SAR' },

  // ─── Links ────────────────────────────────────────────────────
  project:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  department: { type: String },
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },

  // ─── Budget Lines (linked to Chart of Accounts) ───────────────
  lines: [{
    account:    { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    accountCode:{ type: String },
    accountName:{ type: String },
    category:   { type: String, enum: ['revenue','expense','capex','opex'] },
    
    // Monthly breakdown
    jan: { type: Number, default: 0 }, feb: { type: Number, default: 0 },
    mar: { type: Number, default: 0 }, apr: { type: Number, default: 0 },
    may: { type: Number, default: 0 }, jun: { type: Number, default: 0 },
    jul: { type: Number, default: 0 }, aug: { type: Number, default: 0 },
    sep: { type: Number, default: 0 }, oct: { type: Number, default: 0 },
    nov: { type: Number, default: 0 }, dec: { type: Number, default: 0 },
    
    totalBudget:  { type: Number, default: 0 },
    totalActual:  { type: Number, default: 0 },
    variance:     { type: Number, default: 0 },
    variancePct:  { type: Number, default: 0 },
    notes:        { type: String }
  }],

  // ─── Quarterly Targets ────────────────────────────────────────
  q1Budget: { type: Number, default: 0 }, q1Actual: { type: Number, default: 0 },
  q2Budget: { type: Number, default: 0 }, q2Actual: { type: Number, default: 0 },
  q3Budget: { type: Number, default: 0 }, q3Actual: { type: Number, default: 0 },
  q4Budget: { type: Number, default: 0 }, q4Actual: { type: Number, default: 0 },

  // ─── Totals ───────────────────────────────────────────────────
  totalRevenueBudget:  { type: Number, default: 0 },
  totalRevenueActual:  { type: Number, default: 0 },
  totalExpenseBudget:  { type: Number, default: 0 },
  totalExpenseActual:  { type: Number, default: 0 },
  netIncomeBudget:     { type: Number, default: 0 },
  netIncomeActual:     { type: Number, default: 0 },
  totalVariance:       { type: Number, default: 0 },

  // ─── KPIs ─────────────────────────────────────────────────────
  kpis: [{
    name:       { type: String },
    target:     { type: Number },
    actual:     { type: Number },
    unit:       { type: String },
    period:     { type: String }
  }],

  // ─── Approval Workflow ────────────────────────────────────────
  submittedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt:  { type: Date },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:   { type: Date },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:   { type: Date },
  rejectionNote:{ type: String },

  notes:        { type: String },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

budgetSchema.index({ company: 1, year: 1, type: 1 });
budgetSchema.index({ company: 1, project: 1 });
budgetSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
