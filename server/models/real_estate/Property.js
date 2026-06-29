const mongoose = require('mongoose');
const propertySchema = new mongoose.Schema({
  company:   { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  propNo:    { type:String },
  name:      { type:String, required:true },
  type:      { type:String, enum:['apartment','villa','office','shop','warehouse','land','building','floor','studio','suite'], default:'apartment' },
  status:    { type:String, enum:['available','rented','sold','maintenance','reserved'], default:'available' },
  address:   { type:String },
  district:  { type:String },
  city:      { type:String, default:'الرياض' },
  area:      { type:Number },         // مساحة م²
  floor:     { type:Number },
  rooms:     { type:Number },
  bathrooms: { type:Number },
  parkingSpots:{ type:Number, default:0 },
  rentPrice: { type:Number },         // سعر الإيجار شهري
  salePrice: { type:Number },         // سعر البيع
  features:  { type:String },         // مواصفات
  images:    [String],
  deedNo:    { type:String },         // رقم الصك
  isActive:  { type:Boolean, default:true },
  createdBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
propertySchema.pre('save', function(n) {
  if (!this.propNo) this.propNo = 'PR-' + Date.now().toString().slice(-5);
  n();
});
module.exports = mongoose.model('Property', propertySchema);
