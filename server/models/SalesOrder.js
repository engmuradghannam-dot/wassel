const mongoose = require('mongoose');

// ─── Sales Order / Invoice — فاتورة المبيعات ───────────────────────────
const salesOrderSchema = new mongoose.Schema({
  company:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  branch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouse:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

  // ─── Numbering ────────────────────────────────────────────────
  orderNumber:   { type: String },
  invoiceNumber: { type: String },  // رقم الفاتورة الرسمي
  
  // ─── Type ─────────────────────────────────────────────────────
  type: {
    type: String,
    enum: ['quotation','order','invoice','return','credit_note'],
    default: 'quotation'
  },
  
  // ─── Status ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft','sent','confirmed','processing','shipped','delivered','cancelled','returned'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid','partial','paid','overdue'],
    default: 'unpaid'
  },
  
  // ─── Parties ──────────────────────────────────────────────────
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  salesRep:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  
  // ─── Dates ────────────────────────────────────────────────────
  orderDate:     { type: Date, default: Date.now },
  deliveryDate:  { type: Date },
  dueDate:       { type: Date },
  validUntil:    { type: Date },  // للعروض
  
  // ─── Items ────────────────────────────────────────────────────
  items: [{
    inventory:     { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    description:   { type: String },
    quantity:      { type: Number, required: true },
    unit:          { type: String, default: 'pcs' },
    unitPrice:     { type: Number, required: true },
    discount:      { type: Number, default: 0 },  // %
    taxRate:       { type: Number, default: 15 },  // VAT %
    total:         { type: Number, default: 0 }
  }],
  
  // ─── Totals ───────────────────────────────────────────────────
  subtotal:      { type: Number, default: 0 },
  discountAmount:{ type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  taxAmount:     { type: Number, default: 0 },  // ضريبة القيمة المضافة
  total:         { type: Number, default: 0 },
  paidAmount:    { type: Number, default: 0 },
  remainingAmount:{ type: Number, default: 0 },
  
  // ─── Currency ─────────────────────────────────────────────────
  currency:      { type: String, default: 'SAR' },
  exchangeRate:  { type: Number, default: 1 },
  
  // ─── Shipping ─────────────────────────────────────────────────
  shippingAddress: {
    name:    { type: String },
    phone:   { type: String },
    address: { type: String },
    city:    { type: String },
    country: { type: String }
  },
  shippingCost:  { type: Number, default: 0 },
  shippingMethod:{ type: String },
  
  // ─── Payment ──────────────────────────────────────────────────
  paymentTerms:  { type: Number, default: 30 },
  paymentMethod: { type: String, enum: ['cash','bank_transfer','credit','cheque','online'], default: 'bank_transfer' },
  
  // ─── ZATCA / e-Invoice ────────────────────────────────────────
  zatcaStatus:   { type: String, enum: ['pending','submitted','accepted','rejected'], default: 'pending' },
  zatcaUUID:     { type: String },
  zatcaHash:     { type: String },
  qrCode:        { type: String },
  
  // ─── References ───────────────────────────────────────────────
  purchaseOrderRef: { type: String },  // رقم أمر الشراء من العميل
  contractRef:      { type: String },
  notes:            { type: String },
  internalNotes:    { type: String },
  
  // ─── Accounting ───────────────────────────────────────────────
  journalEntry:  { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:    { type: Date }
}, { timestamps: true });

salesOrderSchema.index({ company: 1, orderNumber: 1 }, { unique: true, sparse: true });
salesOrderSchema.index({ company: 1, customer: 1, status: 1 });
salesOrderSchema.index({ company: 1, paymentStatus: 1, dueDate: 1 });

module.exports = mongoose.model('SalesOrder', salesOrderSchema);
