const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  deliveryNumber: { type: String },
  
  type: { type: String, enum: ['outbound','return','exchange'], default: 'outbound' },
  status: {
    type: String,
    enum: ['pending','assigned','picked','out_for_delivery','delivered','failed','returned'],
    default: 'pending'
  },
  
  // ─── References ───────────────────────────────────────────────
  salesOrder:  { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  shipment:    { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  
  // ─── Customer ─────────────────────────────────────────────────
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  
  deliveryAddress: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    address: { type: String, required: true },
    city:    { type: String },
    district:{ type: String },
    country: { type: String, default: 'SA' },
    lat:     { type: Number },
    lng:     { type: Number },
    notes:   { type: String }
  },
  
  // ─── Items ────────────────────────────────────────────────────
  items: [{
    inventory:  { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    description:{ type: String },
    quantity:   { type: Number },
    delivered:  { type: Number, default: 0 }
  }],
  
  // ─── Driver / Courier ─────────────────────────────────────────
  driver:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  vehicle:     { type: String },
  courier:     { type: String },   // شركة الشحن الخارجية
  trackingNo:  { type: String },
  
  // ─── Schedule ─────────────────────────────────────────────────
  scheduledDate:  { type: Date },
  scheduledSlot:  { type: String }, // e.g. '09:00-12:00'
  dispatchedAt:   { type: Date },
  deliveredAt:    { type: Date },
  
  // ─── Proof of Delivery ────────────────────────────────────────
  pod: {
    signature:  { type: String },  // base64 image
    photo:      { type: String },
    receivedBy: { type: String },
    notes:      { type: String },
    timestamp:  { type: Date }
  },
  
  // ─── Failed Delivery ──────────────────────────────────────────
  failureReason: { type: String },
  attempts:      { type: Number, default: 0 },
  
  // ─── COD ──────────────────────────────────────────────────────
  cod:           { type: Boolean, default: false },  // الدفع عند الاستلام
  codAmount:     { type: Number, default: 0 },
  codCollected:  { type: Boolean, default: false },
  
  notes:         { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

deliverySchema.index({ company: 1, status: 1 });
deliverySchema.index({ company: 1, scheduledDate: 1 });
deliverySchema.index({ trackingNo: 1 });
module.exports = mongoose.model('Delivery', deliverySchema);
