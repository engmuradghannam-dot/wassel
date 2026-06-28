const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String },
  sku: { type: String, unique: true, sparse: true },
  barcode: { type: String },
  category: { type: String },
  unit: { type: String, default: 'pcs' },
  costPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 0 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  description: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  taxRate: { type: Number, default: 15 }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
