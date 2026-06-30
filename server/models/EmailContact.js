const mongoose = require('mongoose');

// عناوين بريد خارجية يحفظها المستخدم (دفتر عناوين شخصي)
const emailContactSchema = new mongoose.Schema({
  owner:   { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true, index:true },
  name:    { type: String, required:true },
  email:   { type: String, required:true },
  company: { type: String },
  notes:   { type: String },
}, { timestamps:true });

emailContactSchema.index({ owner:1, email:1 }, { unique:true });

module.exports = mongoose.model('EmailContact', emailContactSchema);
