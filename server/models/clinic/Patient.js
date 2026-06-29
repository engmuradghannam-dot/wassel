const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
  company:      { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  patientNo:    { type:String },
  name:         { type:String, required:true },
  nameEn:       { type:String },
  gender:       { type:String, enum:['male','female'], required:true },
  dateOfBirth:  { type:Date },
  age:          { type:Number },
  nationalId:   { type:String },
  phone:        { type:String },
  phone2:       { type:String },
  email:        { type:String },
  address:      { type:String },
  city:         { type:String },
  bloodType:    { type:String, enum:['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'] },
  // Medical history
  allergies:    { type:String },
  chronicDiseases:{ type:String },
  medications:  { type:String },
  surgeries:    { type:String },
  familyHistory:{ type:String },
  insurance: {
    provider:   { type:String },
    policyNo:   { type:String },
    expiry:     { type:Date },
    coverage:   { type:String },
  },
  emergencyContact: {
    name:       { type:String },
    phone:      { type:String },
    relation:   { type:String },
  },
  notes:        { type:String },
  isActive:     { type:Boolean, default:true },
  registeredBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
patientSchema.index({ company:1, nationalId:1 }, { sparse:true });
patientSchema.pre('save', function(n) {
  if (!this.patientNo) this.patientNo = 'PT-' + Date.now().toString().slice(-5);
  if (this.dateOfBirth && !this.age) {
    this.age = Math.floor((Date.now()-this.dateOfBirth)/(365.25*86400000));
  }
  n();
});
module.exports = mongoose.model('Patient', patientSchema);
