const mongoose = require('mongoose');
const inventorySchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:        { type: String, required: true },
  nameEn:      { type: String },
  sku:         { type: String },
  barcode:     { type: String },
  category:    { type: String },  // قديم: نص حر — يبقى للتوافق العكسي
  categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // جديد: مرجع فعلي
  unit:        { type: String, default: 'pcs' },
  costPrice:   { type: Number, default: 0 },
  salePrice:   { type: Number, default: 0 },
  quantity:    { type: Number, default: 0 },
  minQuantity: { type: Number, default: 0 },
  warehouse:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  description: { type: String },
  image:       { type: String },
  isActive:    { type: Boolean, default: true },
  taxRate:     { type: Number, default: 15 }
}, { timestamps: true });
inventorySchema.index({ company: 1, sku: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Inventory', inventorySchema);
