const mongoose = require('mongoose');
const salonApptSchema = new mongoose.Schema({
  company:   { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  apptNo:    { type:String },
  customer: {
    name:    { type:String, required:true },
    phone:   { type:String, required:true },
    email:   { type:String },
  },
  stylist:   { type:String },          // الموظف المنفّذ
  date:      { type:Date, required:true },
  time:      { type:String, required:true },
  duration:  { type:Number, default:60 },
  services:  [{ name:String, price:Number, duration:Number }],
  totalPrice:{ type:Number, default:0 },
  discount:  { type:Number, default:0 },
  paidAmount:{ type:Number, default:0 },
  status:    { type:String, enum:['booked','confirmed','in_progress','completed','cancelled','no_show'], default:'booked' },
  notes:     { type:String },
  createdBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
salonApptSchema.pre('save', function(n) {
  if (!this.apptNo) this.apptNo = 'SA-' + Date.now().toString().slice(-5);
  this.totalPrice = (this.services||[]).reduce((s,sv)=>s+(sv.price||0),0);
  n();
});
module.exports = mongoose.model('SalonAppointment', salonApptSchema);
