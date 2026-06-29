const mongoose = require('mongoose');
const membershipSchema = new mongoose.Schema({
  company:        { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  memberNumber:   { type:String },
  memberName:     { type:String, required:true },
  memberPhone:    { type:String },
  memberEmail:    { type:String },
  memberNationalId:{ type:String },
  memberGender:   { type:String, enum:['male','female'], default:'male' },
  membershipType: { type:String, enum:['daily','monthly','quarterly','semi_annual','annual','class_pack'], default:'monthly' },
  startDate:      { type:Date },
  endDate:        { type:Date },
  fee:            { type:Number, default:0 },
  paidAmount:     { type:Number, default:0 },
  status:         { type:String, enum:['active','expired','frozen','cancelled'], default:'active' },
  notes:          { type:String },
  createdBy:      { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
membershipSchema.pre('save', async function(next) {
  if (!this.memberNumber) {
    const count = await this.constructor.countDocuments({ company: this.company });
    this.memberNumber = `MEM-${String(count+1).padStart(5,'0')}`;
  }
  next();
});
module.exports = mongoose.model('Membership', membershipSchema);
