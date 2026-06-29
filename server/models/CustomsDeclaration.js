const mongoose = require('mongoose');

const customsSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  shipment:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  
  // ─── Declaration ──────────────────────────────────────────────
  declarationNumber: { type: String },   // رقم البيان الجمركي
  declarationType: {
    type: String,
    enum: ['import','export','transit','re_export','temporary'],
    required: true
  },
  
  // ─── Status ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft','submitted','under_review','approved','released','rejected'],
    default: 'draft'
  },
  
  // ─── Port of Entry / Exit ─────────────────────────────────────
  port:           { type: String },
  customsOffice:  { type: String },
  country:        { type: String, default: 'SA' },
  
  // ─── Goods ────────────────────────────────────────────────────
  items: [{
    hsCode:         { type: String, required: true },  // HS Code
    description:    { type: String },
    descriptionAr:  { type: String },
    countryOfOrigin:{ type: String },
    quantity:       { type: Number },
    unit:           { type: String },
    grossWeight:    { type: Number },  // كغ
    netWeight:      { type: Number },
    customsValue:   { type: Number },  // القيمة الجمركية
    currency:       { type: String, default: 'USD' },
    
    // ─── Duties & Taxes ─────────────────────────────────────────
    dutyRate:       { type: Number, default: 0 },    // نسبة الجمارك
    dutyAmount:     { type: Number, default: 0 },    // مبلغ الجمارك
    vatRate:        { type: Number, default: 15 },   // ضريبة القيمة المضافة
    vatAmount:      { type: Number, default: 0 },
    exciseRate:     { type: Number, default: 0 },    // الضريبة الانتقائية
    exciseAmount:   { type: Number, default: 0 },
    otherDuties:    { type: Number, default: 0 },
    totalDuties:    { type: Number, default: 0 }
  }],
  
  // ─── Financial Summary ────────────────────────────────────────
  totalCustomsValue: { type: Number, default: 0 },
  totalDuties:       { type: Number, default: 0 },
  totalVAT:          { type: Number, default: 0 },
  totalExcise:       { type: Number, default: 0 },
  totalPayable:      { type: Number, default: 0 },
  currency:          { type: String, default: 'SAR' },
  exchangeRate:      { type: Number, default: 1 },
  
  // ─── Clearance Agent ──────────────────────────────────────────
  broker:         { type: String },    // وكيل التخليص
  brokerLicense:  { type: String },
  brokerFee:      { type: Number, default: 0 },
  
  // ─── Dates ────────────────────────────────────────────────────
  submissionDate: { type: Date },
  approvalDate:   { type: Date },
  releaseDate:    { type: Date },
  
  // ─── Documents ────────────────────────────────────────────────
  documents: [{
    type:     { type: String },
    name:     { type: String },
    url:      { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // ─── Free Trade Agreements ────────────────────────────────────
  ftaApplied:    { type: Boolean, default: false },
  ftaName:       { type: String },    // GCC, Arab League, etc.
  preferentialRate: { type: Number },
  
  notes:         { type: String },
  rejectionReason: { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

customsSchema.index({ company: 1, declarationNumber: 1 }, { unique: true, sparse: true });
customsSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('CustomsDeclaration', customsSchema);
