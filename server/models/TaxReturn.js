const mongoose = require('mongoose');

// ─── VAT Return — الإقرار الضريبي ────────────────────────────────────────
const taxReturnSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  // ─── Period ───────────────────────────────────────────────────
  periodType: { type: String, enum: ['monthly','quarterly','annual'], default: 'quarterly' },
  periodStart:{ type: Date, required: true },
  periodEnd:  { type: Date, required: true },
  year:       { type: Number },
  quarter:    { type: Number },
  month:      { type: Number },
  
  // ─── Type ─────────────────────────────────────────────────────
  type: {
    type: String,
    enum: ['vat','withholding','corporate','zakat','excise','custom'],
    default: 'vat'
  },
  
  // ─── Status ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft','prepared','submitted','accepted','amended','paid'],
    default: 'draft'
  },
  
  // ─── VAT Details ──────────────────────────────────────────────
  // Sales
  standardRatedSales:    { type: Number, default: 0 },   // مبيعات الضريبة العادية
  zeroRatedSales:        { type: Number, default: 0 },   // مبيعات صفر الضريبة
  exemptSales:           { type: Number, default: 0 },   // مبيعات معفاة
  totalSales:            { type: Number, default: 0 },
  salesVAT:              { type: Number, default: 0 },   // ضريبة المبيعات
  
  // Purchases
  standardRatedPurchases:{ type: Number, default: 0 },
  zeroRatedPurchases:    { type: Number, default: 0 },
  exemptPurchases:       { type: Number, default: 0 },
  totalPurchases:        { type: Number, default: 0 },
  purchasesVAT:          { type: Number, default: 0 },   // ضريبة المشتريات
  
  // Net
  netVAT:               { type: Number, default: 0 },    // صافي الضريبة
  previousCredit:       { type: Number, default: 0 },    // رصيد سابق
  vatPayable:           { type: Number, default: 0 },    // الضريبة المستحقة
  vatRefund:            { type: Number, default: 0 },    // استرداد ضريبي
  
  // ─── Withholding Tax ──────────────────────────────────────────
  withholdingDetails: [{
    category:   { type: String },
    amount:     { type: Number },
    rate:       { type: Number },
    taxAmount:  { type: Number }
  }],
  totalWithholding:  { type: Number, default: 0 },
  
  // ─── Filing ───────────────────────────────────────────────────
  filingDeadline:  { type: Date },
  submittedDate:   { type: Date },
  referenceNumber: { type: String },
  acknowledgment:  { type: String },
  
  // ─── Payment ──────────────────────────────────────────────────
  paymentDate:     { type: Date },
  paymentRef:      { type: String },
  
  // ─── Penalties ────────────────────────────────────────────────
  latePenalty:     { type: Number, default: 0 },
  otherPenalties:  { type: Number, default: 0 },
  
  notes:           { type: String },
  preparedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

taxReturnSchema.index({ company: 1, periodStart: 1, type: 1 });

module.exports = mongoose.model('TaxReturn', taxReturnSchema);
