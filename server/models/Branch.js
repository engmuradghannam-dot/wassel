const mongoose = require('mongoose');
const branchSchema = new mongoose.Schema({
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:     { type: String, required: true },
  nameEn:   { type: String },
  code:     { type: String },
  address:  { type: String },
  phone:    { type: String },
  email:    { type: String },
  manager:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isMain:   { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  location: { lat: Number, lng: Number, address: String }
}, { timestamps: true });
branchSchema.index({ company: 1, code: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Branch', branchSchema);
