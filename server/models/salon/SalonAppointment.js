const mongoose = require('mongoose');
const salonAppSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  appointmentNo:{ type: String },
  customer: {
    name:      { type: String, required:true },
    phone:     { type: String, required:true },
    email:     { type: String }
  },
  staff:       { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
  services: [{
    name:      { type: String, required:true },
    duration:  { type: Number, default:30 },
    price:     { type: Number, required:true }
  }],
  appointmentDate:{ type: Date, required:true },
  totalDuration:{ type: Number, default:30 },
  subtotal:    { type: Number, default:0 },
  discount:    { type: Number, default:0 },
  taxAmount:   { type: Number, default:0 },
  total:       { type: Number, default:0 },
  status:      { type: String, enum:['scheduled','confirmed','in_progress','completed','cancelled','no_show'], default:'scheduled' },
  paymentStatus:{ type: String, enum:['unpaid','paid'], default:'unpaid' },
  paymentMethod:{ type: String, enum:['cash','card','transfer'], default:'cash' },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
module.exports = mongoose.model('SalonAppointment', salonAppSchema);
