const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  name:       { type: String, required: true },
  year:       { type: Number, required: true },
  type:       { type: String, enum: ['annual','quarterly','project'], default: 'annual' },
  status:     { type: String, enum: ['draft','approved','active','closed'], default: 'draft' },
  
  lines: [{
    account:       { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    department:    { type: String },
    jan: { type: Number, default: 0 },
    feb: { type: Number, default: 0 },
    mar: { type: Number, default: 0 },
    apr: { type: Number, default: 0 },
    may: { type: Number, default: 0 },
    jun: { type: Number, default: 0 },
    jul: { type: Number, default: 0 },
    aug: { type: Number, default: 0 },
    sep: { type: Number, default: 0 },
    oct: { type: Number, default: 0 },
    nov: { type: Number, default: 0 },
    dec: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },   // الفعلي
    variance: { type: Number, default: 0 }  // الانحراف
  }],
  
  totalBudget: { type: Number, default: 0 },
  totalActual: { type: Number, default: 0 },
  
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

budgetSchema.index({ company: 1, year: 1, type: 1 });
module.exports = mongoose.model('Budget', budgetSchema);
