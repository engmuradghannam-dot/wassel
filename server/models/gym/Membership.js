const mongoose = require('mongoose');
const membershipSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  memberNumber:{ type: String },
  member: {
    name:      { type: String, required:true },
    phone:     { type: String, required:true },
    email:     { type: String },
    dob:       { type: Date },
    gender:    { type: String, enum:['male','female'] },
    nationalId:{ type: String },
    photo:     { type: String },
    goals:     { type: String }
  },
  plan:        { type: String, required:true },
  planType:    { type: String, enum:['monthly','quarterly','semi_annual','annual'], default:'monthly' },
  startDate:   { type: Date, required:true },
  endDate:     { type: Date, required:true },
  amount:      { type: Number, required:true },
  discount:    { type: Number, default:0 },
  taxAmount:   { type: Number, default:0 },
  netAmount:   { type: Number, default:0 },
  paymentStatus:{ type: String, enum:['unpaid','paid'], default:'unpaid' },
  trainer:     { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
  locker:      { type: String },
  status:      { type: String, enum:['active','expired','frozen','cancelled'], default:'active' },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
module.exports = mongoose.model('GymMembership', membershipSchema);
