const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // ─── Identity ───────────────────────────────────────────
  name:                   { type: String, required: true },
  nameEn:                 { type: String },
  slug:                   { type: String, unique: true, lowercase: true, trim: true },

  // ─── Contact ────────────────────────────────────────────
  email:                  { type: String },
  phone:                  { type: String },
  website:                { type: String },

  // ─── Legal (Saudi) ──────────────────────────────────────
  taxNumber:              { type: String },
  commercialRegistration: { type: String },
  crIssueDate:            { type: Date },
  crExpiryDate:           { type: Date },
  crAuthority:            { type: String },

  // ─── Address ────────────────────────────────────────────
  address:                { type: String },
  city:                   { type: String },
  country:                { type: String, default: 'المملكة العربية السعودية' },
  zipCode:                { type: String },
  location: {
    lat:     { type: Number },
    lng:     { type: Number },
    address: { type: String }
  },

  // ─── Branding ───────────────────────────────────────────
  logo:                   { type: String },
  currency:               { type: String, default: 'SAR' },
  timezone:               { type: String, default: 'Asia/Riyadh' },
  fiscalYearStart:        { type: Date },
  language:               { type: String, default: 'ar' },

  // ─── PDF Settings ───────────────────────────────────────
  pdfSettings: {
    pageSize:    { type: String, default: 'A4' },
    marginTop:   { type: Number, default: 20 },
    marginBottom:{ type: Number, default: 20 },
    marginLeft:  { type: Number, default: 15 },
    marginRight: { type: Number, default: 15 },
    headerText:  { type: String, default: '' },
    footerText:  { type: String, default: '' },
    showLogo:    { type: Boolean, default: true },
    showStamp:   { type: Boolean, default: false }
  },

  // ─── Subscription / Plan ────────────────────────────────
  plan: {
    type: String,
    enum: ['trial', 'starter', 'professional', 'enterprise'],
    default: 'trial'
  },
  planExpiresAt:  { type: Date },
  maxUsers:       { type: Number, default: 5 },     // per plan
  maxEmployees:   { type: Number, default: 50 },
  maxBranches:    { type: Number, default: 1 },

  // ─── Status ─────────────────────────────────────────────
  isActive:       { type: Boolean, default: true },
  isSuspended:    { type: Boolean, default: false },
  suspendReason:  { type: String },

  // ─── Owner ──────────────────────────────────────────────
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true });

// Auto-generate slug from name
companySchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
      .substring(0, 50) + '-' + Date.now().toString().slice(-4);
  }
  next();
});

companySchema.index({ isActive: 1, plan: 1 });

module.exports = mongoose.model('Company', companySchema);
