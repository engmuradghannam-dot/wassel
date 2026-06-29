const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({
  name:      { type:String, required:true },
  quantity:  { type:Number, required:true, default:1 },
  price:     { type:Number, required:true },
  notes:     { type:String },
  status:    { type:String, enum:['pending','preparing','ready','served'], default:'pending' },
});

const restaurantOrderSchema = new mongoose.Schema({
  company:   { type:mongoose.Schema.Types.ObjectId, ref:'Company', required:true, index:true },
  orderNo:   { type:String },
  table:     { type:mongoose.Schema.Types.ObjectId, ref:'RestaurantTable' },
  type:      { type:String, enum:['dine_in','takeaway','delivery'], default:'dine_in' },
  items:     [orderItemSchema],
  subtotal:  { type:Number, default:0 },
  tax:       { type:Number, default:0 },
  discount:  { type:Number, default:0 },
  total:     { type:Number, default:0 },
  status:    { type:String, enum:['open','in_progress','ready','paid','cancelled'], default:'open' },
  paymentMethod:{ type:String, enum:['cash','card','online'], default:'cash' },
  waiter:    { type:String },
  notes:     { type:String },
  customer: {
    name:    { type:String },
    phone:   { type:String },
    address: { type:String },
  },
  paidAt:    { type:Date },
  createdBy: { type:mongoose.Schema.Types.ObjectId, ref:'User' }
}, { timestamps:true });

restaurantOrderSchema.pre('save', function(n) {
  if (!this.orderNo) this.orderNo = 'ORD-' + Date.now().toString().slice(-5);
  this.subtotal = this.items.reduce((s,i)=>s+(i.price*i.quantity),0);
  this.tax      = this.subtotal * 0.15;
  this.total    = this.subtotal + this.tax - (this.discount||0);
  n();
});
module.exports = mongoose.model('RestaurantOrder', restaurantOrderSchema);
