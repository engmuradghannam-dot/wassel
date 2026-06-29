const mongoose = require('mongoose');
const tableSchema = new mongoose.Schema({
  company:   { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  number:    { type:String, required:true },
  capacity:  { type:Number, default:4 },
  location:  { type:String },        // قسم الطاولات: inside, terrace, vip...
  status:    { type:String, enum:['available','occupied','reserved','cleaning'], default:'available' },
  currentOrder:{ type:mongoose.Schema.Types.ObjectId, ref:'RestaurantOrder' },
  qrCode:    { type:String },
  isActive:  { type:Boolean, default:true },
}, { timestamps:true });
tableSchema.index({ company:1, number:1 }, { unique:true, sparse:true });
module.exports = mongoose.model('RestaurantTable', tableSchema);
