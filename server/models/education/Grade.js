const mongoose = require('mongoose');
const gradeSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  student:     { type: mongoose.Schema.Types.ObjectId, ref:'Student', required:true },
  subject:     { type: String, required:true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
  grade:       { type: Number, min:0, max:100 },
  gradeType:   { type: String, enum:['exam','quiz','assignment','midterm','final','project'], default:'exam' },
  semester:    { type: String },
  academicYear:{ type: String },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
module.exports = mongoose.model('Grade', gradeSchema);
