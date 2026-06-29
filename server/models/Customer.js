const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  company:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  // ─── Identity ─────────────────────────────────────────────────
  code:           { type: String },
  name:           { type: String, required: true },
  nameEn:         { type: String },
  type:           { type: String, enum: ['individual','company','government'], default: 'company' },
  
  // ─── Contact ──────────────────────────────────────────────────
  email:          { type: String },
  phone:          { type: String },
  mobile:         { type: String },
  contactPerson:  { type: String },
  website:        { type: String },
  
  // ─── Legal ────────────────────────────────────────────────────
  taxNumber:      { type: String },   // رقم الضريبة
  commercialReg:  { type: String },   // السجل التجاري
  vatNumber:      { type: String },   // رقم ضريبة القيمة المضافة
  
  // ─── Address ──────────────────────────────────────────────────
  address:        { type: String },
  city:           { type: String },
  country:        { type: String, default: 'SA' },
  zipCode:        { type: String },
  
  // ─── Financial ────────────────────────────────────────────────
  currency:       { type: String, default: 'SAR' },
  paymentTerms:   { type: Number, default: 30 }, // أيام
  creditLimit:    { type: Number, default: 0 },
  balance:        { type: Number, default: 0 },  // رصيد مستحق
  
  // ─── Classification ───────────────────────────────────────────
  category:       { type: String, enum: ['A','B','C','VIP'], default: 'B' },
  salesRep:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  priceList:      { type: String, enum: ['retail','wholesale','special'], default: 'retail' },
  
  // ─── Banking ──────────────────────────────────────────────────
  bankName:       { type: String },
  bankIBAN:       { type: String },
  
  notes:          { type: String },
  isActive:       { type: Boolean, default: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

customerSchema.index({ company: 1, code: 1 }, { unique: true, sparse: true });
customerSchema.index({ company: 1, taxNumber: 1 });

module.exports = mongoose.model('Customer', customerSchema);
