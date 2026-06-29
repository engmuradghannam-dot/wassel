const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
  company:      { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  patientName:  { type:String, required:true },
  patientPhone: { type:String },
  patientId:    { type:mongoose.Schema.Types.ObjectId, ref:'Patient' },
  doctorName:   { type:String },
  doctorId:     { type:mongoose.Schema.Types.ObjectId, ref:'Employee' },
  date:         { type:Date, required:true },
  time:         { type:String },
  duration:     { type:Number, default:30 },
  type:         { type:String, default:'checkup' },
  status:       { type:String, enum:['scheduled','confirmed','in_progress','completed','cancelled','no_show'], default:'scheduled' },
  fee:          { type:Number, default:0 },
  diagnosis:    { type:String },
  prescription: { type:String },
  notes:        { type:String },
  createdBy:    { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
appointmentSchema.index({ company:1, date:1 });
module.exports = mongoose.model('Appointment', appointmentSchema);
