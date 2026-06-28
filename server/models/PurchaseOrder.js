const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'received', 'partial', 'cancelled'],
    default: 'draft'
  },
  orderDate: { type: Date, default: Date.now },
  expectedDate: { type: Date },
  receivedDate: { type: Date },
  items: [{
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    name: String,
    quantity: { type: Number, required: true },
    receivedQty: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true },
    taxRate: { type: Number, default: 15 },
    total: { type: Number }
  }],
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

purchaseOrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = 'PO-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
