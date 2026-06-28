const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: false, default: null }, // optional for OAuth users
  googleId:   { type: String, default: null },
  role:       { type: String, enum: ['superadmin', 'admin', 'manager', 'user'], default: 'user' },
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  avatar:     { type: String },
  isOnline:   { type: Boolean, default: false },
  lastSeen:   { type: Date, default: Date.now },
  isActive:   { type: Boolean, default: true }
}, { timestamps: true });

// Indexes (email already unique in schema, no need to redeclare)
userSchema.index({ company: 1, role: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
