const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameAr: { type: String },
  description: { type: String },
  permissions: [{
    module: String,
    actions: [{ type: String, enum: ['read', 'create', 'update', 'delete'] }]
  }],
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
