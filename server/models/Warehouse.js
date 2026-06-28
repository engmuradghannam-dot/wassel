const mongoose = require('mongoose');
const warehouseSchema = new mongoose.Schema({
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:     { type: String, required: true },
  nameEn:   { type: String },
  code:     { type: String },
  branch:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  address:  { type: String },
  manager:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isActive: { type: Boolean, default: true },
  capacity: { type: Number },
  notes:    { type: String }
}, { timestamps: true });
warehouseSchema.index({ company: 1, code: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Warehouse', warehouseSchema);
