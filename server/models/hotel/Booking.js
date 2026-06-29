const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  company:     { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  bookingNo:   { type:String, unique:true, sparse:true },
  room:        { type:mongoose.Schema.Types.ObjectId, ref:'Room', required:true },
  guest: {
    name:      { type:String, required:true },
    phone:     { type:String },
    email:     { type:String },
    idNumber:  { type:String },  // هوية / جواز
    nationality:{ type:String },
  },
  checkIn:     { type:Date, required:true },
  checkOut:    { type:Date, required:true },
  nights:      { type:Number },
  adults:      { type:Number, default:1 },
  children:    { type:Number, default:0 },
  pricePerNight:{ type:Number },
  totalAmount: { type:Number },
  discount:    { type:Number, default:0 },
  taxAmount:   { type:Number, default:0 },
  netAmount:   { type:Number },
  paidAmount:  { type:Number, default:0 },
  paymentMethod:{ type:String, enum:['cash','card','transfer','online'], default:'cash' },
  status:      { type:String, enum:['pending','confirmed','checked_in','checked_out','cancelled','no_show'], default:'pending' },
  source:      { type:String, enum:['walk_in','phone','online','agency'], default:'walk_in' },
  notes:       { type:String },
  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });

bookingSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    this.nights = Math.ceil((this.checkOut - this.checkIn) / 86400000);
    this.totalAmount = this.nights * (this.pricePerNight || 0);
    this.taxAmount   = this.totalAmount * 0.15;
    this.netAmount   = this.totalAmount - (this.discount||0) + this.taxAmount;
  }
  if (!this.bookingNo) this.bookingNo = 'BK-' + Date.now().toString().slice(-6);
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
