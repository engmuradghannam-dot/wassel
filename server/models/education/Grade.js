const mongoose = require('mongoose');
const gradeSchema = new mongoose.Schema({
  company:    { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true },
  student:    { type:mongoose.Schema.Types.ObjectId, ref:'Student', required:true },
  subject:    { type:String, required:true },
  teacher:    { type:String },
  semester:   { type:String },       // الفصل الدراسي
  academicYear:{ type:String },
  grades: {
    quizzes:  { type:Number },
    midterm:  { type:Number },
    final:    { type:Number },
    homework: { type:Number },
    total:    { type:Number },
  },
  grade:      { type:String },       // A, B, C, D, F
  gpa:        { type:Number },
  status:     { type:String, enum:['pass','fail','incomplete','withdrawn'], default:'pass' },
  notes:      { type:String },
}, { timestamps:true });
module.exports = mongoose.model('Grade', gradeSchema);
