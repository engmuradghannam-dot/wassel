const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  appointmentNo:{ type: String },
  patient:     { type: mongoose.Schema.Types.ObjectId, ref:'Patient', required:true },
  doctor:      { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
  specialty:   { type: String },
  appointmentDate:{ type: Date, required:true },
  duration:    { type: Number, default:30 },   // minutes
  type:        { type: String, enum:['new','follow_up','emergency','consultation','procedure'], default:'new' },
  status:      { type: String, enum:['scheduled','confirmed','arrived','in_progress','completed','cancelled','no_show'], default:'scheduled' },
  chiefComplaint:{ type: String },
  diagnosis:   { type: String },
  prescription:[{
    medication:{ type: String },
    dose:      { type: String },
    frequency: { type: String },
    duration:  { type: String },
    notes:     { type: String }
  }],
  vitals: {
    weight:   Number, height:Number, bmi:Number,
    bloodPressure:String, pulse:Number, temperature:Number, oxygenSat:Number
  },
  fee:         { type: Number, default:0 },
  discount:    { type: Number, default:0 },
  taxAmount:   { type: Number, default:0 },
  netAmount:   { type: Number, default:0 },
  paymentStatus:{ type: String, enum:['unpaid','partial','paid','insurance'], default:'unpaid' },
  nextVisit:   { type: Date },
  notes:       { type: String },
  attachments: [{ name:String, url:String }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
module.exports = mongoose.model('Appointment', appointmentSchema);
