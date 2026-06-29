const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  // ─── Period ───────────────────────────────────────────────────
  month:      { type: Number, required: true },
  year:       { type: Number, required: true },
  
  status: {
    type: String,
    enum: ['draft','calculated','approved','paid','cancelled'],
    default: 'draft'
  },
  
  // ─── Lines ────────────────────────────────────────────────────
  lines: [{
    employee:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    
    // Earnings — المستحقات
    basicSalary:   { type: Number, default: 0 },
    housingAllowance: { type: Number, default: 0 },  // بدل سكن
    transportAllowance: { type: Number, default: 0 }, // بدل مواصلات
    foodAllowance:    { type: Number, default: 0 },   // بدل طعام
    phoneAllowance:   { type: Number, default: 0 },
    overtime:         { type: Number, default: 0 },   // عمل إضافي
    bonus:            { type: Number, default: 0 },
    commission:       { type: Number, default: 0 },
    otherEarnings:    { type: Number, default: 0 },
    grossSalary:      { type: Number, default: 0 },   // إجمالي المستحقات
    
    // Deductions — الاستقطاعات
    gosi:             { type: Number, default: 0 },   // التأمينات الاجتماعية
    incomeTax:        { type: Number, default: 0 },   // ضريبة الدخل
    absence:          { type: Number, default: 0 },   // غياب
    lateness:         { type: Number, default: 0 },   // تأخير
    loans:            { type: Number, default: 0 },   // قروض
    advances:         { type: Number, default: 0 },   // سلف
    otherDeductions:  { type: Number, default: 0 },
    totalDeductions:  { type: Number, default: 0 },
    
    // Net
    netSalary:        { type: Number, default: 0 },
    
    // Days worked
    workingDays:      { type: Number, default: 30 },
    actualDays:       { type: Number, default: 30 },
    absenceDays:      { type: Number, default: 0 },
    overtimeHours:    { type: Number, default: 0 },
    
    // Payment
    paymentMethod:    { type: String, enum: ['bank','cash','cheque'], default: 'bank' },
    bankIBAN:         { type: String },
    paidAt:           { type: Date },
    transactionRef:   { type: String }
  }],
  
  // ─── Totals ───────────────────────────────────────────────────
  totalEmployees:    { type: Number, default: 0 },
  totalGross:        { type: Number, default: 0 },
  totalDeductions:   { type: Number, default: 0 },
  totalNet:          { type: Number, default: 0 },
  totalGOSI:         { type: Number, default: 0 },
  
  // ─── WPS (Wage Protection System) ────────────────────────────
  wpsSubmitted:      { type: Boolean, default: false },
  wpsSubmittedAt:    { type: Date },
  wpsRef:            { type: String },
  
  // ─── Accounting ───────────────────────────────────────────────
  journalEntry:      { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  
  notes:             { type: String },
  approvedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:        { type: Date },
  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

payrollSchema.index({ company: 1, year: 1, month: 1 }, { unique: true });
module.exports = mongoose.model('Payroll', payrollSchema);
