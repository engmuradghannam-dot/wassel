const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  patientNumber:{ type: String },
  name:        { type: String, required:true },
  nameEn:      { type: String },
  gender:      { type: String, enum:['male','female'], required:true },
  dob:         { type: Date },
  age:         { type: Number },
  nationalId:  { type: String },
  phone:       { type: String, required:true },
  phone2:      { type: String },
  email:       { type: String },
  address:     { type: String },
  city:        { type: String },
  nationality: { type: String, default:'SA' },
  bloodType:   { type: String, enum:['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'], default:'unknown' },
  allergies:   [{ type: String }],
  chronicDiseases:[{ type: String }],
  insurance: {
    company:   { type: String },
    policyNo:  { type: String },
    network:   { type: String },
    expiryDate:{ type: Date },
    coverage:  { type: Number, default:0 }
  },
  emergencyContact: { name:String, phone:String, relation:String },
  notes:       { type: String },
  isActive:    { type: Boolean, default:true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
patientSchema.index({ company:1, patientNumber:1 }, { unique:true, sparse:true });
patientSchema.index({ company:1, nationalId:1 }, { sparse:true });
module.exports = mongoose.model('Patient', patientSchema);
