const mongoose = require('mongoose');
const membershipSchema = new mongoose.Schema({
  company:    { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  memberNo:   { type:String },
  name:       { type:String, required:true },
  phone:      { type:String, required:true },
  email:      { type:String },
  gender:     { type:String, enum:['male','female'] },
  dateOfBirth:{ type:Date },
  nationalId: { type:String },
  photo:      { type:String },
  plan:       { type:String, enum:['monthly','quarterly','semi_annual','annual','daily','class_based'], default:'monthly' },
  startDate:  { type:Date, required:true },
  endDate:    { type:Date },
  fees:       { type:Number, default:0 },
  discount:   { type:Number, default:0 },
  paidAmount: { type:Number, default:0 },
  paymentStatus:{ type:String, enum:['paid','pending','partial'], default:'pending' },
  trainer:    { type:String },
  goal:       { type:String },   // weight loss, muscle gain...
  classes:    [{ type:String }], // enrolled classes
  status:     { type:String, enum:['active','expired','frozen','cancelled'], default:'active' },
  notes:      { type:String },
  createdBy:  { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
membershipSchema.pre('save', function(n) {
  if (!this.memberNo) this.memberNo = 'MB-' + Date.now().toString().slice(-5);
  if (this.startDate && !this.endDate && this.plan) {
    const d = new Date(this.startDate);
    const months = {monthly:1,quarterly:3,semi_annual:6,annual:12,daily:0,class_based:0};
    if (months[this.plan]) { d.setMonth(d.getMonth()+months[this.plan]); this.endDate=d; }
  }
  n();
});
module.exports = mongoose.model('Membership', membershipSchema);
