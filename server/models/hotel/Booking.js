const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  bookingNumber:{ type: String },
  room:        { type: mongoose.Schema.Types.ObjectId, ref:'Room', required:true },
  guest: {
    name:      { type: String, required:true },
    email:     { type: String },
    phone:     { type: String, required:true },
    nationalId:{ type: String },
    nationality:{ type: String, default:'SA' },
    passportNo:{ type: String },
  },
  checkIn:     { type: Date, required:true },
  checkOut:    { type: Date, required:true },
  adults:      { type: Number, default:1 },
  children:    { type: Number, default:0 },
  totalNights: { type: Number },
  pricePerNight:{ type: Number },
  totalAmount: { type: Number },
  discount:    { type: Number, default:0 },
  taxAmount:   { type: Number, default:0 },
  netAmount:   { type: Number },
  status:      { type: String, enum:['pending','confirmed','checked_in','checked_out','cancelled','no_show'], default:'pending' },
  paymentStatus:{ type: String, enum:['unpaid','partial','paid'], default:'unpaid' },
  source:      { type: String, enum:['direct','booking.com','airbnb','phone','walk_in','agency'], default:'direct' },
  notes:       { type: String },
  extras:      [{ name:String, amount:Number }],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
bookingSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut && this.pricePerNight) {
    const nights = Math.ceil((this.checkOut - this.checkIn) / (1000*60*60*24));
    this.totalNights = nights;
    this.totalAmount = nights * this.pricePerNight;
    this.taxAmount   = this.totalAmount * 0.15;
    this.netAmount   = this.totalAmount + this.taxAmount - (this.discount||0);
  }
  next();
});
module.exports = mongoose.model('Booking', bookingSchema);
