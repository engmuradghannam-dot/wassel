const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:        { type: String, required: true },
  nameEn:      { type: String },
  code:        { type: String },
  parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // تصنيف فرعي
  description: { type: String },
  color:       { type: String, default: '#1a73e8' },
  icon:        { type: String, default: '📦' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });
categorySchema.index({ company: 1, code: 1 }, { unique: true, sparse: true });
categorySchema.index({ company: 1, parent: 1 });
module.exports = mongoose.model('Category', categorySchema);
