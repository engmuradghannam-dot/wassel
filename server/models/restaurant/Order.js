const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  orderNumber: { type: String },
  table:       { type: mongoose.Schema.Types.ObjectId, ref:'Table' },
  type:        { type: String, enum:['dine_in','takeaway','delivery'], default:'dine_in' },
  items: [{
    name:      { type: String, required:true },
    nameEn:    { type: String },
    quantity:  { type: Number, default:1 },
    unitPrice: { type: Number, required:true },
    notes:     { type: String },
    status:    { type: String, enum:['pending','preparing','ready','served'], default:'pending' }
  }],
  subtotal:    { type: Number, default:0 },
  discount:    { type: Number, default:0 },
  taxAmount:   { type: Number, default:0 },
  total:       { type: Number, default:0 },
  status:      { type: String, enum:['open','preparing','ready','served','paid','cancelled'], default:'open' },
  paymentMethod:{ type: String, enum:['cash','card','transfer','app'], default:'cash' },
  paymentStatus:{ type: String, enum:['unpaid','paid'], default:'unpaid' },
  waiter:      { type: mongoose.Schema.Types.ObjectId, ref:'Employee' },
  customerName:{ type: String },
  customerPhone:{ type: String },
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });
module.exports = mongoose.model('RestaurantOrder', orderSchema);
