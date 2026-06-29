const mongoose = require('mongoose');
const purchaseOrderSchema = new mongoose.Schema({
  company:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  orderNumber:  { type: String },
  supplier:     { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  branch:       { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouse:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  status:       { type: String, enum: ['draft','pending','approved','received','partial','cancelled'], default: 'draft' },
  orderDate:    { type: Date, default: Date.now },
  expectedDate: { type: Date },
  receivedDate: { type: Date },
  items: [{
    inventory:   { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    name:        String,
    quantity:    { type: Number, required: true },
    receivedQty: { type: Number, default: 0 },
    unitPrice:   { type: Number, required: true },
    taxRate:     { type: Number, default: 15 },
    total:       Number
  }],
  subtotal:   { type: Number, default: 0 },
  taxAmount:  { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  notes:      { type: String },
  attachments: [{
    name:      { type: String },
    url:       { type: String },
    type:      { type: String, enum:['quotation','tax_invoice','pro_forma','boq','contract','other'], default:'other' },
    uploadedBy:{ type: mongoose.Schema.Types.ObjectId, ref:'User' },
    uploadedAt:{ type: Date, default: Date.now },
  }],
  paymentRequest: {
    requested:    { type: Boolean, default: false },
    requestedAt:  { type: Date },
    requestedBy:  { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    taxInvoiceUrl:{ type: String },
    taxInvoiceNo: { type: String },
    paymentStatus:{ type: String, enum:['not_requested','pending','approved','paid'], default:'not_requested' },
    paidAt:       { type: Date },
  },
  purchaseRequest: { type: mongoose.Schema.Types.ObjectId, ref:'PurchaseRequest' },
  legalCase:       { type: mongoose.Schema.Types.ObjectId, ref:'LegalCase' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
purchaseOrderSchema.index({ company: 1, orderNumber: 1 }, { unique: true, sparse: true });
purchaseOrderSchema.pre('save', function (next) {
  if (!this.orderNumber) this.orderNumber = 'PO-' + Date.now();
  next();
});
module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
