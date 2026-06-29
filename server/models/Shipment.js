const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  
  // ─── Reference ────────────────────────────────────────────────
  shipmentNumber: { type: String },
  type: {
    type: String,
    enum: ['import','export','domestic','transit','cross_border'],
    required: true
  },
  direction: { type: String, enum: ['inbound','outbound'], required: true },
  
  // ─── Links ────────────────────────────────────────────────────
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  salesOrder:    { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  
  // ─── Status ───────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['draft','booked','picked_up','in_transit','customs','out_for_delivery','delivered','returned','lost'],
    default: 'draft'
  },
  
  // ─── Parties ──────────────────────────────────────────────────
  shipper: {
    name:     { type: String },
    address:  { type: String },
    city:     { type: String },
    country:  { type: String },
    phone:    { type: String },
    taxId:    { type: String }
  },
  consignee: {
    name:     { type: String },
    address:  { type: String },
    city:     { type: String },
    country:  { type: String },
    phone:    { type: String },
    taxId:    { type: String }
  },
  notifyParty: {
    name:     { type: String },
    address:  { type: String },
    phone:    { type: String }
  },
  
  // ─── Origin / Destination ─────────────────────────────────────
  originCountry:      { type: String },
  originPort:         { type: String },
  originAddress:      { type: String },
  destinationCountry: { type: String },
  destinationPort:    { type: String },
  destinationAddress: { type: String },
  
  // ─── Transport Mode ───────────────────────────────────────────
  mode: {
    type: String,
    enum: ['air','sea','land','rail','multimodal','courier'],
    required: true
  },
  carrier:       { type: String },
  vessel:        { type: String },  // اسم السفينة / الطائرة / الشاحنة
  flightNumber:  { type: String },
  voyageNumber:  { type: String },
  
  // ─── Documents ────────────────────────────────────────────────
  billOfLading:    { type: String },  // بوليصة الشحن
  airWaybill:      { type: String },  // بوليصة الشحن الجوي
  packingList:     { type: String },  // قائمة التعبئة
  certificateOrigin: { type: String }, // شهادة المنشأ
  commercialInvoice: { type: String },
  
  // ─── Packages ─────────────────────────────────────────────────
  packages: [{
    description:  { type: String },
    quantity:     { type: Number },
    unit:         { type: String, enum: ['box','pallet','container','bag','drum','roll','piece'] },
    weight:       { type: Number },    // كغ
    length:       { type: Number },    // سم
    width:        { type: Number },
    height:       { type: Number },
    volume:       { type: Number },    // م³
    hsCode:       { type: String },    // رمز النظام المنسق
    value:        { type: Number },
    currency:     { type: String, default: 'USD' }
  }],
  
  // ─── Weight & Dimensions ──────────────────────────────────────
  totalWeight:   { type: Number },    // كغ
  chargeableWeight: { type: Number }, // وزن قابل للشحن
  totalVolume:   { type: Number },    // م³
  totalPackages: { type: Number },
  
  // ─── Container (Sea) ──────────────────────────────────────────
  containerType: { type: String, enum: ['20GP','40GP','40HC','20RF','45HC','LCL'] },
  containerNumber: { type: String },
  sealNumber:    { type: String },
  
  // ─── Incoterms ────────────────────────────────────────────────
  incoterms: {
    type: String,
    enum: ['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'],
    default: 'FOB'
  },
  
  // ─── Dates ────────────────────────────────────────────────────
  bookingDate:   { type: Date },
  pickupDate:    { type: Date },
  etd:           { type: Date },   // Estimated Time of Departure
  eta:           { type: Date },   // Estimated Time of Arrival
  atd:           { type: Date },   // Actual Time of Departure
  ata:           { type: Date },   // Actual Time of Arrival
  deliveryDate:  { type: Date },
  
  // ─── Tracking ─────────────────────────────────────────────────
  trackingNumber: { type: String },
  trackingUrl:    { type: String },
  events: [{
    date:     { type: Date },
    location: { type: String },
    status:   { type: String },
    description: { type: String }
  }],
  
  // ─── Costs ────────────────────────────────────────────────────
  freightCost:   { type: Number, default: 0 },
  insuranceCost: { type: Number, default: 0 },
  handlingCost:  { type: Number, default: 0 },
  customsCost:   { type: Number, default: 0 },
  otherCosts:    { type: Number, default: 0 },
  totalCost:     { type: Number, default: 0 },
  currency:      { type: String, default: 'SAR' },
  
  // ─── Insurance ────────────────────────────────────────────────
  insured:       { type: Boolean, default: false },
  insuranceValue:{ type: Number },
  insurancePolicyNo: { type: String },
  insurer:       { type: String },
  
  notes:         { type: String },
  warehouse:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

shipmentSchema.index({ company: 1, shipmentNumber: 1 }, { unique: true, sparse: true });
shipmentSchema.index({ company: 1, status: 1 });
shipmentSchema.index({ trackingNumber: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
