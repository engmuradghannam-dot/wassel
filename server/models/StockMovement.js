const mongoose = require('mongoose');

// سجل حركة المخزون — مثل SAP Material Document
const stockMovementSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  movementNumber: { type: String },
  
  type: {
    type: String,
    enum: [
      'receipt',         // استلام من مورد
      'issue',           // صرف للإنتاج أو بيع
      'transfer',        // نقل بين مستودعات
      'adjustment',      // تعديل جرد
      'return_to_supplier', // إرجاع لمورد
      'return_from_customer', // إرجاع من عميل
      'production_in',   // دخول من الإنتاج
      'production_out',  // صرف للإنتاج
      'opening_balance', // رصيد افتتاحي
      'write_off'        // شطب
    ],
    required: true
  },
  
  // ─── Reference ────────────────────────────────────────────────
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  salesOrder:    { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  shipment:      { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  
  // ─── Item ─────────────────────────────────────────────────────
  inventory:     { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  
  // ─── Warehouses ───────────────────────────────────────────────
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouse:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  
  // ─── Quantity ─────────────────────────────────────────────────
  quantity:      { type: Number, required: true },
  unit:          { type: String },
  unitCost:      { type: Number, default: 0 },
  totalCost:     { type: Number, default: 0 },
  
  // ─── Stock Levels After Movement ──────────────────────────────
  quantityBefore:{ type: Number },
  quantityAfter: { type: Number },
  
  // ─── Batch / Lot / Serial ─────────────────────────────────────
  batchNumber:   { type: String },
  lotNumber:     { type: String },
  serialNumbers: [{ type: String }],
  expiryDate:    { type: Date },
  
  movementDate:  { type: Date, default: Date.now },
  notes:         { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

stockMovementSchema.index({ company: 1, inventory: 1, movementDate: -1 });
stockMovementSchema.index({ company: 1, type: 1 });
module.exports = mongoose.model('StockMovement', stockMovementSchema);
