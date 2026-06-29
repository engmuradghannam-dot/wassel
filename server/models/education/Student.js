const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  studentNumber:{ type: String },
  name:        { type: String, required:true },
  nameEn:      { type: String },
  gender:      { type: String, enum:['male','female'] },
  dob:         { type: Date },
  nationalId:  { type: String },
  phone:       { type: String },
  email:       { type: String },
  address:     { type: String },
  nationality: { type: String, default:'SA' },
  photo:       { type: String },
  // School specific
  grade:       { type: String },      // الصف / المرحلة
  classroom:   { type: String },      // الفصل
  section:     { type: String },
  admissionDate:{ type: Date },
  // University specific
  faculty:     { type: String },      // الكلية
  department:  { type: String },      // القسم
  major:       { type: String },      // التخصص
  level:       { type: Number },      // المستوى / الفصل الدراسي
  gpa:         { type: Number, default:0 },
  // Guardian
  guardian: {
    name:      { type: String },
    phone:     { type: String, required:true },
    relation:  { type: String },
    email:     { type: String },
    nationalId:{ type: String }
  },
  // Financial
  fees:        { type: Number, default:0 },
  discount:    { type: Number, default:0 },
  paidAmount:  { type: Number, default:0 },
  balance:     { type: Number, default:0 },
  status:      { type: String, enum:['active','inactive','graduated','withdrawn','transferred'], default:'active' },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
studentSchema.index({ company:1, studentNumber:1 }, { unique:true, sparse:true });
module.exports = mongoose.model('Student', studentSchema);
