const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  company:     { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  studentNo:   { type:String },
  name:        { type:String, required:true },
  nameEn:      { type:String },
  gender:      { type:String, enum:['male','female'] },
  dateOfBirth: { type:Date },
  nationalId:  { type:String },
  phone:       { type:String },
  email:       { type:String },
  address:     { type:String },
  nationality: { type:String },
  // Academic
  grade:       { type:String },     // الصف / المستوى
  section:     { type:String },     // الفصل
  academicYear:{ type:String },     // السنة الدراسية
  enrollDate:  { type:Date },
  status:      { type:String, enum:['enrolled','graduated','transferred','suspended','withdrawn'], default:'enrolled' },
  // Guardian
  guardian: {
    name:      { type:String },
    phone:     { type:String },
    relation:  { type:String },
    email:     { type:String },
  },
  // Financial
  fees:        { type:Number, default:0 },
  discount:    { type:Number, default:0 },
  paidAmount:  { type:Number, default:0 },
  // University-specific
  faculty:     { type:String },     // الكلية
  major:       { type:String },     // التخصص
  gpa:         { type:Number },
  creditHours: { type:Number },
  notes:       { type:String },
  isActive:    { type:Boolean, default:true },
  createdBy:   { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
studentSchema.pre('save', function(n) {
  if (!this.studentNo) this.studentNo = 'ST-' + Date.now().toString().slice(-5);
  n();
});
studentSchema.index({ company:1, studentNo:1 }, { unique:true, sparse:true });
module.exports = mongoose.model('Student', studentSchema);
