const mongoose = require('mongoose');
const leaseSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  leaseNumber: { type: String },
  property:    { type: mongoose.Schema.Types.ObjectId, ref:'Property', required:true },
  tenant: {
    name:      { type: String, required:true },
    phone:     { type: String, required:true },
    email:     { type: String },
    nationalId:{ type: String },
    nationality:{ type: String, default:'SA' },
    iqamaNo:   { type: String }
  },
  startDate:   { type: Date, required:true },
  endDate:     { type: Date, required:true },
  monthlyRent: { type: Number, required:true },
  deposit:     { type: Number, default:0 },
  totalValue:  { type: Number },
  paymentSchedule:{ type: String, enum:['monthly','quarterly','semi_annual','annual'], default:'annual' },
  status:      { type: String, enum:['active','expired','terminated','pending'], default:'active' },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
module.exports = mongoose.model('Lease', leaseSchema);
