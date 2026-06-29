const mongoose = require('mongoose');
const tableSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  number:      { type: String, required:true },
  capacity:    { type: Number, default:4 },
  section:     { type: String },
  status:      { type: String, enum:['available','occupied','reserved','cleaning'], default:'available' },
  qrCode:      { type: String },
  notes:       { type: String },
  isActive:    { type: Boolean, default:true }
}, { timestamps:true });
tableSchema.index({ company:1, number:1 }, { unique:true });
module.exports = mongoose.model('Table', tableSchema);
