const mongoose = require('mongoose');
const apptSchema = new mongoose.Schema({
  company:    { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  apptNo:     { type:String },
  patient:    { type:mongoose.Schema.Types.ObjectId, ref:'Patient', required:true },
  doctor:     { type:mongoose.Schema.Types.ObjectId, ref:'User' },     // Employee/User
  doctorName: { type:String },
  date:       { type:Date, required:true },
  time:       { type:String, required:true },  // "09:30"
  duration:   { type:Number, default:30 },     // minutes
  type:       { type:String, enum:['new','follow_up','emergency','checkup','surgery'], default:'new' },
  specialty:  { type:String },                 // أمراض قلب / جراحة ...
  status:     { type:String, enum:['scheduled','confirmed','in_progress','completed','cancelled','no_show'], default:'scheduled' },
  // Visit notes
  complaint:  { type:String },   // الشكوى
  diagnosis:  { type:String },   // التشخيص
  prescription:{ type:String },  // الوصفة الطبية
  nextVisit:  { type:Date },
  // Financial
  fees:       { type:Number, default:0 },
  insuranceCovered:{ type:Number, default:0 },
  paidAmount: { type:Number, default:0 },
  paymentStatus:{ type:String, enum:['pending','paid','partial','insurance'], default:'pending' },
  notes:      { type:String },
  createdBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
apptSchema.pre('save', function(n) {
  if (!this.apptNo) this.apptNo = 'AP-' + Date.now().toString().slice(-5);
  n();
});
module.exports = mongoose.model('Appointment', apptSchema);
