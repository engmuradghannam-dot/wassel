const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  company:        { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  employeeId:     { type: String },   // EMP-0001

  // ─── Identity ───────────────────────────────────────────────
  name:           { type: String, required:true },
  nameEn:         { type: String },
  email:          { type: String },
  phone:          { type: String },
  phone2:         { type: String },
  nationalId:     { type: String },
  nationality:    { type: String, default:'سعودي' },
  gender:         { type: String, enum:['male','female'] },
  dateOfBirth:    { type: Date },
  maritalStatus:  { type: String, enum:['single','married','divorced','widowed'] },
  avatar:         { type: String },
  address:        { type: String },

  // ─── Documents ──────────────────────────────────────────────
  iqama:          { type: String },
  iqamaExpiry:    { type: Date },
  passportNumber: { type: String },
  passportExpiry: { type: Date },
  drivingLicense: { type: String },

  // ─── Org Chart / Position ───────────────────────────────────
  position:       { type: String },           // المسمى الوظيفي
  positionEn:     { type: String },           // Job Title EN
  department:     { type: String },           // القسم
  departmentCode: { type: String },
  grade:          { type: String },           // المستوى الوظيفي
  employeeType:   { type: String, enum:['full_time','part_time','contract','intern','consultant'], default:'full_time' },
  branch:         { type: mongoose.Schema.Types.ObjectId, ref:'Branch' },

  // ─── Reporting Structure (Org Chart) ────────────────────────
  manager:        { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },       // مديره المباشر
  director:       { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },       // المدير العام / الديركتور
  directReports:  [{ type: mongoose.Schema.Types.ObjectId, ref:'Employee' }],    // من يرفع إليه

  // ─── System Link ────────────────────────────────────────────
  user:           { type: mongoose.Schema.Types.ObjectId, ref:'User' },
  customRole:     { type: mongoose.Schema.Types.ObjectId, ref:'Role' },

  // ─── Employment ─────────────────────────────────────────────
  hireDate:       { type: Date },
  probationEnd:   { type: Date },
  contractEnd:    { type: Date },
  contractType:   { type: String, enum:['unlimited','limited','project'], default:'unlimited' },
  status:         { type: String, enum:['active','inactive','on_leave','terminated'], default:'active' },

  // ─── Compensation ───────────────────────────────────────────
  salary:         { type: Number, default:0 },
  housingAllowance:{ type: Number, default:0 },
  transportAllowance:{ type: Number, default:0 },
  otherAllowances: { type: Number, default:0 },
  totalPackage:   { type: Number, default:0 },
  bankName:       { type: String },
  bankIBAN:       { type: String },

  // ─── Approval Limits (for PR workflow) ──────────────────────
  prApprovalLimit:{ type: Number, default:0 },  // حد اعتماد طلبات الشراء بالريال
  canApprovePR:   { type: Boolean, default:false },
  approvalLevel:  { type: String, enum:['none','manager','director','cfo','ceo'], default:'none' },

  notes:          { type: String },
  skills:         [{ type: String }],
  attachments: [{
    name: String, url: String, type: String, uploadedAt: { type: Date, default: Date.now }
  }],
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref:'User' },
}, { timestamps: true });

employeeSchema.index({ company:1, employeeId:1 }, { unique:true, sparse:true });
employeeSchema.index({ company:1, email:1 },      { unique:true, sparse:true });
employeeSchema.index({ company:1, manager:1 });
employeeSchema.index({ company:1, department:1 });
employeeSchema.index({ company:1, status:1 });

employeeSchema.pre('save', function(next) {
  if (!this.employeeId) {
    this.employeeId = 'EMP-' + Date.now().toString().slice(-5);
  }
  this.totalPackage = (this.salary||0)+(this.housingAllowance||0)+(this.transportAllowance||0)+(this.otherAllowances||0);
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
