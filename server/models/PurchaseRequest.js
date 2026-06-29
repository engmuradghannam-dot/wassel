const mongoose = require('mongoose');

const prSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  prNumber:    { type: String },  // PR-2026-00001

  // ─── Requester ──────────────────────────────────────────────
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref:'Employee', required:true },
  department:  { type: String },
  project:     { type: mongoose.Schema.Types.ObjectId, ref:'Project' },  // linked project
  costCenter:  { type: String },

  // ─── Items needed ───────────────────────────────────────────
  items: [{
    description:  { type: String, required:true },
    quantity:     { type: Number, required:true },
    unit:         { type: String, default:'pcs' },
    estimatedPrice:{ type: Number, default:0 },
    notes:        { type: String },
    inventory:    { type: mongoose.Schema.Types.ObjectId, ref:'Inventory' }, // optional link
  }],

  // ─── Financial ──────────────────────────────────────────────
  estimatedTotal:  { type: Number, default:0 },
  currency:        { type: String, default:'SAR' },
  budgetAvailable: { type: Boolean, default:true },

  // ─── Attachments (BOQ, quotations, etc.) ────────────────────
  attachments: [{
    name:        { type: String },
    url:         { type: String },
    type:        { type: String, enum:['boq','quotation','invoice','other'] },
    uploadedBy:  { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    uploadedAt:  { type: Date, default: Date.now },
  }],

  // ─── Approval Workflow ──────────────────────────────────────
  status: {
    type: String,
    enum: ['draft','submitted','manager_review','director_review','procurement_review','approved','rejected','converted'],
    default: 'draft'
  },
  
  approvalChain: [{
    approver:    { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
    role:        { type: String, enum:['manager','director','procurement','finance'] },
    status:      { type: String, enum:['pending','approved','rejected'], default:'pending' },
    comment:     { type: String },
    actionAt:    { type: Date },
  }],

  currentApprover: { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
  rejectionReason: { type: String },

  // ─── Conversion to PO ───────────────────────────────────────
  purchaseOrder:   { type: mongoose.Schema.Types.ObjectId, ref:'PurchaseOrder' },
  convertedAt:     { type: Date },
  convertedBy:     { type: mongoose.Schema.Types.ObjectId, ref:'User' },

  notes:           { type: String },
  urgency:         { type: String, enum:['normal','urgent','critical'], default:'normal' },
  neededBy:        { type: Date },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref:'User' },
}, { timestamps: true });

prSchema.index({ company:1, prNumber:1 }, { unique:true, sparse:true });
prSchema.index({ company:1, status:1 });
prSchema.index({ company:1, requestedBy:1 });

prSchema.pre('save', function(next) {
  if (!this.prNumber) {
    const y = new Date().getFullYear();
    this.prNumber = `PR-${y}-${Date.now().toString().slice(-5)}`;
  }
  this.estimatedTotal = (this.items||[]).reduce((s,i)=>s+(+(i.quantity||0))*(+(i.estimatedPrice||0)),0);
  next();
});

module.exports = mongoose.model('PurchaseRequest', prSchema);
