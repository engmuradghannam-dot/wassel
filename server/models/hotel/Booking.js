const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  company:        { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  bookingNumber:  { type:String },
  guestName:      { type:String, required:true },
  guestPhone:     { type:String },
  guestNationalId:{ type:String },
  guestEmail:     { type:String },
  roomId:         { type:mongoose.Schema.Types.ObjectId, ref:'Room' },
  roomNumber:     { type:String },
  checkIn:        { type:Date },
  checkOut:       { type:Date },
  nights:         { type:Number, default:1 },
  adults:         { type:Number, default:2 },
  children:       { type:Number, default:0 },
  totalAmount:    { type:Number, default:0 },
  paidAmount:     { type:Number, default:0 },
  discount:       { type:Number, default:0 },
  status:         { type:String, enum:['confirmed','pending','checkedin','checkedout','cancelled','noshow'], default:'confirmed' },
  paymentStatus:  { type:String, enum:['unpaid','partial','paid'], default:'unpaid' },
  notes:          { type:String },
  createdBy:      { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
bookingSchema.pre('save', async function(next) {
  if (!this.bookingNumber) {
    const count = await this.constructor.countDocuments({ company: this.company });
    this.bookingNumber = `BKG-${String(count+1).padStart(5,'0')}`;
  }
  next();
});
module.exports = mongoose.model('Booking', bookingSchema);
