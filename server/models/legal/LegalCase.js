const mongoose = require('mongoose');

const legalCaseSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  caseNumber:  { type: String },      // رقم القضية
  caseRef:     { type: String },      // رقم مرجعي محكمة

  // ─── Type & Classification ───────────────────────────────────
  type: {
    type: String,
    enum: ['commercial','labor','civil','criminal','administrative','arbitration','real_estate','intellectual_property','other'],
    required: true
  },
  category:    { type: String },      // تصنيف داخلي
  title:       { type: String, required: true },
  description: { type: String },

  // ─── Parties ────────────────────────────────────────────────
  ourRole:     { type: String, enum:['plaintiff','defendant','respondent','claimant'], default:'defendant' },
  counterParty: {
    name:      { type: String },
    type:      { type: String, enum:['individual','company','government'] },
    lawyer:    { type: String },
    phone:     { type: String },
  },

  // ─── Legal Team ─────────────────────────────────────────────
  assignedLawyer:  { type: String },           // محامي الشركة
  externalLaw:     { type: String },           // مكتب المحاماة الخارجي
  responsibleEmployee: { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },

  // ─── Court / Arbitration ────────────────────────────────────
  court:       { type: String },               // المحكمة / جهة التحكيم
  jurisdiction:{ type: String },               // الاختصاص القضائي
  claimValue:  { type: Number, default:0 },    // قيمة المطالبة
  currency:    { type: String, default:'SAR' },

  // ─── Dates ──────────────────────────────────────────────────
  filingDate:    { type: Date },               // تاريخ رفع الدعوى
  nextHearing:   { type: Date },               // الجلسة القادمة
  expectedResolutionDate: { type: Date },

  // ─── Status & Outcome ───────────────────────────────────────
  status: {
    type: String,
    enum: ['draft','active','in_court','awaiting_judgment','settled','won','lost','appealed','closed'],
    default: 'draft'
  },

  outcome:     { type: String, enum:['pending','won','lost','settled','dismissed','withdrawn'] },
  
  // ─── Financial Judgment ─────────────────────────────────────
  financialJudgment: {
    hasFinancial:  { type: Boolean, default: false },
    amount:        { type: Number, default: 0 },
    direction:     { type: String, enum:['payable','receivable'] }, // علينا أم لنا
    description:   { type: String },
    dueDate:       { type: Date },
    // إذا علينا → يتحول لـ PO
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref:'PurchaseOrder' },
    convertedAt:   { type: Date },
  },

  // ─── Hearings Log ───────────────────────────────────────────
  hearings: [{
    date:        { type: Date },
    summary:     { type: String },
    nextDate:    { type: Date },
    outcome:     { type: String },
    addedBy:     { type: mongoose.Schema.Types.ObjectId, ref:'User' },
  }],

  // ─── Attachments ────────────────────────────────────────────
  attachments: [{
    name:        { type: String },
    url:         { type: String },
    type:        { type: String, enum:['judgment','contract','evidence','correspondence','other'] },
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    uploadedAt:  { type: Date, default: Date.now },
  }],

  // ─── Costs Tracking ─────────────────────────────────────────
  legalCosts:  [{ description:String, amount:Number, date:Date }],
  totalCost:   { type: Number, default:0 },

  priority:    { type: String, enum:['low','medium','high','critical'], default:'medium' },
  notes:       { type: String },
  tags:        [{ type: String }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' },
}, { timestamps: true });

legalCaseSchema.index({ company:1, status:1 });
legalCaseSchema.index({ company:1, type:1 });
legalCaseSchema.index({ company:1, nextHearing:1 });
legalCaseSchema.pre('save', function(next) {
  if (!this.caseNumber) {
    const y = new Date().getFullYear();
    this.caseNumber = `CASE-${y}-${Date.now().toString().slice(-4)}`;
  }
  this.totalCost = (this.legalCosts||[]).reduce((s,c)=>s+(+(c.amount||0)),0);
  next();
});

module.exports = mongoose.model('LegalCase', legalCaseSchema);
