const mongoose = require('mongoose');
const leaseSchema = new mongoose.Schema({
  company:    { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true },
  leaseNo:    { type:String },
  property:   { type:mongoose.Schema.Types.ObjectId, ref:'Property', required:true },
  tenant: {
    name:     { type:String, required:true },
    phone:    { type:String },
    email:    { type:String },
    nationalId:{ type:String },
    type:     { type:String, enum:['individual','company'], default:'individual' },
    companyName:{ type:String },
  },
  startDate:  { type:Date, required:true },
  endDate:    { type:Date, required:true },
  rentAmount: { type:Number, required:true },
  period:     { type:String, enum:['monthly','quarterly','semi_annual','annual'], default:'annual' },
  depositAmount:{ type:Number, default:0 },
  totalAmount:{ type:Number },
  status:     { type:String, enum:['active','expired','terminated','pending'], default:'pending' },
  ejariNo:    { type:String },       // رقم إيجاري
  notes:      { type:String },
  createdBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
leaseSchema.pre('save', function(n) {
  if (!this.leaseNo) this.leaseNo = 'LS-' + Date.now().toString().slice(-5);
  n();
});
module.exports = mongoose.model('Lease', leaseSchema);
