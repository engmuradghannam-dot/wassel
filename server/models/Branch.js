const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String },
  code: { type: String, unique: true, sparse: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  isMain: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
