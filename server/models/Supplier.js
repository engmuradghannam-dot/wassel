const mongoose = require('mongoose');
const supplierSchema = new mongoose.Schema({
  company:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:           { type: String, required: true },
  nameEn:         { type: String },
  code:           { type: String },
  email:          { type: String },
  phone:          { type: String },
  address:        { type: String },
  country:        { type: String },
  taxNumber:      { type: String },
  commercialReg:  { type: String },
  contactPerson:  { type: String },
  paymentTerms:   { type: Number, default: 30 },
  creditLimit:    { type: Number, default: 0 },
  balance:        { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  notes:          { type: String },
  bankName:       { type: String },
  bankIBAN:       { type: String }
}, { timestamps: true });
supplierSchema.index({ company: 1 });
module.exports = mongoose.model('Supplier', supplierSchema);
