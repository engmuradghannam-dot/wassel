const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String },
  code: { type: String, unique: true, sparse: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  address: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isActive: { type: Boolean, default: true },
  capacity: { type: Number },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
