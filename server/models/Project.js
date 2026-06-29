const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  // ─── Identity ─────────────────────────────────────────────────
  code:        { type: String },
  name:        { type: String, required: true },
  nameEn:      { type: String },
  description: { type: String },
  type:        { type: String, enum: ['internal','external','construction','it','consulting','maintenance','other'], default: 'external' },
  status:      { type: String, enum: ['planning','active','on_hold','completed','cancelled'], default: 'planning' },
  priority:    { type: String, enum: ['low','medium','high','critical'], default: 'medium' },

  // ─── Customer & Contract ──────────────────────────────────────
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  contractNo:  { type: String },
  contractValue:{ type: Number, default: 0 },
  currency:    { type: String, default: 'SAR' },

  // ─── Team ─────────────────────────────────────────────────────
  manager:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  team: [{
    employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    role:       { type: String },
    allocation: { type: Number, default: 100 }
  }],

  // ─── Timeline ─────────────────────────────────────────────────
  startDate:      { type: Date },
  plannedEndDate: { type: Date },
  actualEndDate:  { type: Date },
  progressPct:    { type: Number, default: 0, min: 0, max: 100 },

  // ─── Budget (linked to Budget module) ─────────────────────────
  budget:         { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  budgetCost:     { type: Number, default: 0 },
  actualCost:     { type: Number, default: 0 },
  billedAmount:   { type: Number, default: 0 },
  paidAmount:     { type: Number, default: 0 },
  costCenter:     { type: String },

  // ─── Milestones (linked to SalesOrder billing) ────────────────
  milestones: [{
    name:          { type: String, required: true },
    dueDate:       { type: Date },
    completedAt:   { type: Date },
    weight:        { type: Number, default: 0 },
    status:        { type: String, enum: ['pending','in_progress','completed','delayed'], default: 'pending' },
    billingAmount: { type: Number, default: 0 },
    salesOrder:    { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' }
  }],

  // ─── Tasks (with time tracking) ───────────────────────────────
  tasks: [{
    title:          { type: String, required: true },
    description:    { type: String },
    assignee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    dueDate:        { type: Date },
    completedAt:    { type: Date },
    status:         { type: String, enum: ['todo','in_progress','review','done'], default: 'todo' },
    priority:       { type: String, enum: ['low','medium','high'], default: 'medium' },
    estimatedHours: { type: Number },
    actualHours:    { type: Number },
    purchaseOrder:  { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' }
  }],

  // ─── Financials linked across modules ─────────────────────────
  purchaseOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' }],
  salesOrders:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' }],
  shipments:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  journalEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' }],

  // ─── Risk & Issues ────────────────────────────────────────────
  risks: [{
    title:       { type: String },
    probability: { type: String, enum: ['low','medium','high'] },
    impact:      { type: String, enum: ['low','medium','high'] },
    mitigation:  { type: String },
    status:      { type: String, enum: ['open','mitigated','closed'], default: 'open' }
  }],

  // ─── Documents ────────────────────────────────────────────────
  documents: [{
    name:       { type: String },
    url:        { type: String },
    type:       { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  location: {
    address: { type: String },
    city:    { type: String },
    country: { type: String },
    lat:     { type: Number },
    lng:     { type: Number }
  },

  notes:     { type: String },
  tags:      [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

projectSchema.index({ company: 1, status: 1 });
projectSchema.index({ company: 1, manager: 1 });
projectSchema.index({ company: 1, customer: 1 });
projectSchema.index({ company: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Project', projectSchema);
