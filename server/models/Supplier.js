const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },

  // ─── Identity ──────────────────────────────────────────────────
  code:        { type:String, trim:true },
  name:        { type:String, required:true, trim:true },
  nameEn:      { type:String, trim:true },
  type:        { type:String, enum:['company','individual','government'], default:'company' },
  
  // ─── Legal (Saudi) ─────────────────────────────────────────────
  commercialReg:  { type:String, trim:true },   // رقم السجل التجاري الموحد 10 أرقام
  vatNumber:      { type:String, trim:true },   // الرقم الضريبي 15 رقم
  nationalId:     { type:String, trim:true },   // للأفراد: رقم الهوية / الإقامة
  industry:       { type:String, trim:true },   // قطاع المورد
  
  // ─── Contact ───────────────────────────────────────────────────
  contactPerson:  { type:String, trim:true },
  contactTitle:   { type:String, trim:true },
  email:          { type:String, trim:true, lowercase:true },
  phone:          { type:String, trim:true },
  phone2:         { type:String, trim:true },
  fax:            { type:String, trim:true },
  website:        { type:String, trim:true },
  
  // ─── Address ───────────────────────────────────────────────────
  address:     { type:String, trim:true },
  district:    { type:String, trim:true },
  city:        { type:String, trim:true, default:'الرياض' },
  country:     { type:String, trim:true, default:'SA' },
  zipCode:     { type:String, trim:true },
  poBox:       { type:String, trim:true },
  
  // ─── Financial ─────────────────────────────────────────────────
  currency:      { type:String, default:'SAR' },
  paymentTerms:  { type:Number, default:30 },           // days
  creditLimit:   { type:Number, default:0 },
  balance:       { type:Number, default:0 },           // إجمالي ما علينا للمورد
  paidAmount:    { type:Number, default:0 },           // إجمالي ما دفعناه
  totalPurchases:{ type:Number, default:0 },          // إجمالي مشترياتنا منه            // outstanding balance
  discountPct:   { type:Number, default:0 },            // default discount %
  
  // ─── Bank Information ──────────────────────────────────────────
  bankName:    { type:String, trim:true },
  bankBranch:  { type:String, trim:true },
  bankAccount: { type:String, trim:true },
  bankIBAN:    { type:String, trim:true },
  bankSwift:   { type:String, trim:true },
  
  // ─── Classification ────────────────────────────────────────────
  category:    { type:String, trim:true },
  tags:        [{ type:String }],
  rating:      { type:Number, min:0, max:5, default:0 },
  
  // ─── Status ────────────────────────────────────────────────────
  isActive:    { type:Boolean, default:true },
  isApproved:  { type:Boolean, default:false },
  notes:       { type:String, trim:true },
  
  // ─── Documents ─────────────────────────────────────────────────
  documents: [{
    name:     String,
    url:      String,
    type:     String,
    uploadedAt: { type:Date, default:Date.now }
  }],

  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });

supplierSchema.index({ company:1, name:1 });
supplierSchema.index({ company:1, code:1 }, { unique:true, sparse:true });
supplierSchema.index({ company:1, commercialReg:1 }, { sparse:true });
supplierSchema.index({ company:1, isActive:1 });

module.exports = mongoose.model('Supplier', supplierSchema);
