const mongoose = require('mongoose');
const departmentSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:        { type: String, required: true },
  nameEn:      { type: String },
  code:        { type: String },
  manager:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },     // رئيس القسم
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },  // قسم فرعي
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  budget:      { type: Number, default: 0 },     // الميزانية السنوية للقسم
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
departmentSchema.index({ company: 1, code: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Department', departmentSchema);
