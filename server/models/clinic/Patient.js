const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
  company:            { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  patientId:          { type:String },
  name:               { type:String, required:true },
  nameEn:             { type:String },
  gender:             { type:String, enum:['male','female'], default:'male' },
  dob:                { type:Date },
  nationalId:         { type:String },
  nationality:        { type:String },
  phone:              { type:String },
  phone2:             { type:String },
  email:              { type:String },
  address:            { type:String },
  city:               { type:String },
  bloodType:          { type:String, enum:['A+','A-','B+','B-','AB+','AB-','O+','O-',''] },
  allergies:          { type:String },
  chronicDiseases:    { type:String },
  currentMedications: { type:String },
  emergencyName:      { type:String },
  emergencyPhone:     { type:String },
  emergencyRelation:  { type:String },
  notes:              { type:String },
  isActive:           { type:Boolean, default:true },
  createdBy:          { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await this.constructor.countDocuments({ company: this.company });
    this.patientId = `PAT-${String(count+1).padStart(5,'0')}`;
  }
  next();
});
module.exports = mongoose.model('Patient', patientSchema);
