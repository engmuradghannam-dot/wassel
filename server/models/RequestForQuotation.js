const mongoose = require('mongoose');

// طلب عرض الأسعار
const rfqSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  rfqNumber:  { type: String },
  title:      { type: String, required: true },
  
  status: {
    type: String,
    enum: ['draft','sent','received','evaluated','awarded','cancelled'],
    default: 'draft'
  },
  
  // ─── Items Needed ─────────────────────────────────────────────
  items: [{
    inventory:   { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    description: { type: String },
    quantity:    { type: Number, required: true },
    unit:        { type: String },
    specifications: { type: String },
    targetPrice:    { type: Number }
  }],
  
  // ─── Invited Suppliers ────────────────────────────────────────
  invitedSuppliers: [{
    supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    sentAt:      { type: Date },
    responseDeadline: { type: Date },
    status:      { type: String, enum: ['invited','responded','declined','awarded'], default: 'invited' }
  }],
  
  // ─── Quotes Received ──────────────────────────────────────────
  quotes: [{
    supplier:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    receivedAt:  { type: Date },
    validUntil:  { type: Date },
    currency:    { type: String, default: 'SAR' },
    items: [{
      inventoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      unitPrice:    { type: Number },
      leadTimeDays: { type: Number },
      notes:        { type: String }
    }],
    totalAmount: { type: Number },
    deliveryDays:{ type: Number },
    paymentTerms:{ type: Number },
    notes:       { type: String },
    score:       { type: Number },  // تقييم العرض
    isAwarded:   { type: Boolean, default: false }
  }],
  
  // ─── Decision ─────────────────────────────────────────────────
  awardedSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  awardedQuoteIdx: { type: Number },
  awardReason:     { type: String },
  resultingPO:     { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  
  openingDate:   { type: Date },
  closingDate:   { type: Date, required: true },
  deliveryDate:  { type: Date },
  
  notes:         { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evaluatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

rfqSchema.index({ company: 1, status: 1 });
rfqSchema.index({ company: 1, rfqNumber: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('RequestForQuotation', rfqSchema);
