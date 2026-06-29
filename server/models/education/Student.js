const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  company:          { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  studentId:        { type:String },
  name:             { type:String, required:true },
  nameEn:           { type:String },
  gender:           { type:String, enum:['male','female'], default:'male' },
  dob:              { type:Date },
  nationalId:       { type:String },
  nationality:      { type:String },
  phone:            { type:String },
  email:            { type:String },
  address:          { type:String },
  level:            { type:String },
  classroom:        { type:String },
  section:          { type:String },
  enrollDate:       { type:Date },
  tuitionFee:       { type:Number, default:0 },
  guardianName:     { type:String },
  guardianPhone:    { type:String },
  guardianRelation: { type:String },
  status:           { type:String, enum:['active','inactive','graduated','suspended','transferred'], default:'active' },
  notes:            { type:String },
  createdBy:        { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const count = await this.constructor.countDocuments({ company: this.company });
    this.studentId = `STU-${String(count+1).padStart(5,'0')}`;
  }
  next();
});
module.exports = mongoose.model('Student', studentSchema);
