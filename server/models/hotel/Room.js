const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
  company:       { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  number:        { type:String, required:true, trim:true },
  type:          { type:String, enum:['single','double','suite','family','deluxe','studio','apartment'], default:'double' },
  floor:         { type:Number, default:1 },
  capacity:      { type:Number, default:2 },
  pricePerNight: { type:Number, default:0 },
  status:        { type:String, enum:['available','occupied','maintenance','cleaning'], default:'available' },
  amenities:     { type:String },
  description:   { type:String },
  images:        [String],
  isActive:      { type:Boolean, default:true },
  createdBy:     { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
roomSchema.index({ company:1, number:1 }, { unique:true, sparse:true });
module.exports = mongoose.model('Room', roomSchema);
