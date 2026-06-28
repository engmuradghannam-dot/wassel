const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  company:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  // ─── Amount ─────────────────────────────────────────────
  amount:        { type: Number, required: true },
  currency:      { type: String, default: 'SAR' },
  taxAmount:     { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },

  // ─── Plan ───────────────────────────────────────────────
  plan:          { type: String, enum: ['trial','starter','professional','enterprise'], required: true },
  durationMonths:{ type: Number, default: 12 },
  periodStart:   { type: Date },
  periodEnd:     { type: Date },

  // ─── Payment Method ─────────────────────────────────────
  method:        { type: String, enum: ['card','bank_transfer','stc_pay','apple_pay','mada','cash'], required: true },

  // ─── Gateway (Moyasar / Stripe / HyperPay) ──────────────
  gateway:       { type: String, enum: ['moyasar','stripe','hyperpay','manual'], default: 'moyasar' },
  gatewayRef:    { type: String },          // payment ID from gateway
  gatewayData:   { type: mongoose.Schema.Types.Mixed }, // raw gateway response

  // ─── Status ─────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending','processing','paid','failed','refunded','cancelled'],
    default: 'pending'
  },

  // ─── Invoice ────────────────────────────────────────────
  invoiceNumber: { type: String, unique: true, sparse: true },
  invoiceUrl:    { type: String },
  notes:         { type: String },

  // ─── Refund ─────────────────────────────────────────────
  refundedAt:    { type: Date },
  refundAmount:  { type: Number, default: 0 },
  refundReason:  { type: String },

  paidBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // superadmin manual
}, { timestamps: true });

paymentSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const year  = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

paymentSchema.index({ company: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
