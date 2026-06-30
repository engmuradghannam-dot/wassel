const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ─── Core Identity ────────────────────────────────────────────
  name:       { type: String, required: true, trim: true },
  nameEn:     { type: String, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String },
  mustChangePassword: { type: Boolean, default: false },
  googleId:   { type: String },
  avatar:     { type: String, default: '' },
  phone:      { type: String },

  // ─── Company & Role ───────────────────────────────────────────
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  branch:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

  // ─── System Role (coarse-grained) ─────────────────────────────
  role: {
    type: String,
    enum: ['superadmin','owner','admin','manager','user','employee','readonly'],
    default: 'user'
  },

  // ─── Custom Role (fine-grained) ───────────────────────────────
  customRole:  { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },

  // ─── Direct Permission Overrides ─────────────────────────────
  // These add/remove permissions beyond what the customRole grants
  permissionOverrides: [{
    module:   { type: String },
    actions:  [{ type: String }],
    deny:     { type: Boolean, default: false } // true = explicitly deny
  }],

  // ─── Legacy permissions array ─────────────────────────────────
  permissions: { type: [String], default: [] },

  // ─── Profile ──────────────────────────────────────────────────
  language:   { type: String, default: 'ar' },
  timezone:   { type: String, default: 'Asia/Riyadh' },
  theme:      { type: String, enum: ['light','dark','auto'], default: 'light' },
  bio:        { type: String },
  department: { type: String },
  position:   { type: String },
  employeeId: { type: String },

  // ─── Access Control ───────────────────────────────────────────
  isActive:       { type: Boolean, default: true },
  isEmailVerified:{ type: Boolean, default: false },
  isTwoFactor:    { type: Boolean, default: false },
  accessibleBranches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],

  // ─── Session ──────────────────────────────────────────────────
  isOnline:   { type: Boolean, default: false },
  lastSeen:   { type: Date, default: Date.now },
  lastLogin:  { type: Date },
  loginCount: { type: Number, default: 0 },

  // ─── Security ─────────────────────────────────────────────────
  passwordChangedAt:   { type: Date },
  passwordResetToken:  { type: String },
  passwordResetExpiry: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil:         { type: Date },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true } });

// Indexes
userSchema.index({ company: 1, role: 1 });
userSchema.index({ company: 1, isActive: 1 });
userSchema.index({ isOnline: 1 });

// Virtual: check if user has permission
userSchema.methods.hasPermission = function(module, action) {
  if (this.role === 'superadmin' || this.role === 'admin') return true;

  // Check direct overrides first
  const override = this.permissionOverrides?.find(p => p.module === module);
  if (override) {
    if (override.deny) return false;
    return override.actions?.includes(action);
  }
  return false;
};

// Virtual: full name
userSchema.virtual('fullName').get(function() {
  return this.nameEn ? `${this.name} (${this.nameEn})` : this.name;
});

module.exports = mongoose.model('User', userSchema);
