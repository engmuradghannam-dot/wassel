const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  number:      { type: String, required:true },
  type:        { type: String, enum:['single','double','suite','family','deluxe','presidential'], default:'single' },
  floor:       { type: Number },
  capacity:    { type: Number, default: 2 },
  pricePerNight:{ type: Number, required:true },
  currency:    { type: String, default:'SAR' },
  amenities:   [{ type: String }],
  images:      [{ type: String }],
  status:      { type: String, enum:['available','occupied','maintenance','cleaning'], default:'available' },
  notes:       { type: String },
  isActive:    { type: Boolean, default:true }
}, { timestamps:true });
roomSchema.index({ company:1, number:1 }, { unique:true });
module.exports = mongoose.model('Room', roomSchema);
