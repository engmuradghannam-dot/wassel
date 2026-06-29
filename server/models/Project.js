const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  // ─── Identity ─────────────────────────────────────────────────
  code:       { type: String },
  name:       { type: String, required: true },
  nameEn:     { type: String },
  description:{ type: String },
  
  // ─── Classification ───────────────────────────────────────────
  type: {
    type: String,
    enum: ['internal','external','construction','it','consulting','maintenance','other'],
    default: 'external'
  },
  status: {
    type: String,
    enum: ['planning','active','on_hold','completed','cancelled'],
    default: 'planning'
  },
  priority:   { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  
  // ─── Customer / Client ────────────────────────────────────────
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  contractNo: { type: String },
  
  // ─── Team ─────────────────────────────────────────────────────
  manager:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  team: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    role:     { type: String },
    allocation: { type: Number, default: 100 }  // %
  }],
  
  // ─── Timeline ─────────────────────────────────────────────────
  startDate:     { type: Date },
  plannedEndDate:{ type: Date },
  actualEndDate: { type: Date },
  
  // ─── Budget ───────────────────────────────────────────────────
  currency:      { type: String, default: 'SAR' },
  contractValue: { type: Number, default: 0 },  // قيمة العقد
  budgetCost:    { type: Number, default: 0 },   // التكلفة المقدرة
  actualCost:    { type: Number, default: 0 },   // التكلفة الفعلية
  billedAmount:  { type: Number, default: 0 },   // المفوتر
  paidAmount:    { type: Number, default: 0 },   // المقبوض
  
  // ─── Progress ─────────────────────────────────────────────────
  progressPct:   { type: Number, default: 0, min: 0, max: 100 },
  milestones: [{
    name:        { type: String, required: true },
    dueDate:     { type: Date },
    completedAt: { type: Date },
    weight:      { type: Number, default: 0 },  // % من المشروع
    status:      { type: String, enum: ['pending','in_progress','completed','delayed'], default: 'pending' },
    billingAmount: { type: Number, default: 0 }
  }],
  
  // ─── Tasks ────────────────────────────────────────────────────
  tasks: [{
    title:       { type: String, required: true },
    description: { type: String },
    assignee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    dueDate:     { type: Date },
    completedAt: { type: Date },
    status:      { type: String, enum: ['todo','in_progress','review','done'], default: 'todo' },
    priority:    { type: String, enum: ['low','medium','high'], default: 'medium' },
    estimatedHours: { type: Number },
    actualHours:    { type: Number }
  }],
  
  // ─── Documents ────────────────────────────────────────────────
  documents: [{
    name:    { type: String },
    url:     { type: String },
    type:    { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // ─── Location (for construction) ──────────────────────────────
  location: {
    address: { type: String },
    city:    { type: String },
    country: { type: String },
    lat:     { type: Number },
    lng:     { type: Number }
  },
  
  // ─── Accounting ───────────────────────────────────────────────
  costCenter:  { type: String },
  
  notes:       { type: String },
  tags:        [{ type: String }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

projectSchema.index({ company: 1, status: 1 });
projectSchema.index({ company: 1, manager: 1 });
projectSchema.index({ company: 1, customer: 1 });

module.exports = mongoose.model('Project', projectSchema);
