const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  contractNumber: { type: String },
  title:       { type: String, required: true },

  type: {
    type: String,
    enum: ['sales','purchase','employment','service','lease','partnership','nda','maintenance','consulting','government','other'],
    required: true
  },
  status:      { type: String, enum:['draft','under_review','active','expired','terminated','renewed'], default:'draft' },

  // ─── Parties ────────────────────────────────────────────────
  counterParty: {
    name:        { type: String, required: true },
    type:        { type: String, enum:['individual','company','government'] },
    commercialReg:{ type: String },
    vatNumber:   { type: String },
    phone:       { type: String },
    email:       { type: String },
  },

  // ─── Links ──────────────────────────────────────────────────
  employee:    { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },   // employment contracts
  project:     { type: mongoose.Schema.Types.ObjectId, ref:'Project' },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref:'Customer' },
  supplier:    { type: mongoose.Schema.Types.ObjectId, ref:'Supplier' },

  // ─── Dates ──────────────────────────────────────────────────
  startDate:   { type: Date, required: true },
  endDate:     { type: Date },
  renewalDate: { type: Date },
  autoRenew:   { type: Boolean, default: false },

  // ─── Financial ──────────────────────────────────────────────
  value:       { type: Number, default: 0 },
  currency:    { type: String, default: 'SAR' },
  paymentTerms:{ type: String },

  // ─── Responsible ────────────────────────────────────────────
  owner:       { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },   // المسؤول عن العقد
  reviewer:    { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },

  // ─── Attachments ────────────────────────────────────────────
  attachments: [{
    name:      { type: String },
    url:       { type: String },
    type:      { type: String },
    uploadedAt:{ type: Date, default: Date.now },
  }],

  notes:       { type: String },
  tags:        [{ type: String }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' },
}, { timestamps: true });

contractSchema.index({ company:1, status:1 });
contractSchema.index({ company:1, endDate:1 });  // للتنبيهات بالانتهاء
contractSchema.pre('save', function(next) {
  if (!this.contractNumber) {
    const y = new Date().getFullYear();
    this.contractNumber = `CON-${y}-${Date.now().toString().slice(-4)}`;
  }
  next();
});

module.exports = mongoose.model('Contract', contractSchema);
