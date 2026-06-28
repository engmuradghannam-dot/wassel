const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['superadmin', 'admin', 'manager', 'user'], default: 'user' },
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  avatar:   { type: String },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index: email per company (superadmin has no company)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ company: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
