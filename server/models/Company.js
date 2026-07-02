const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // ─── Identity ─────────────────────────────────────────────────
  name:        { type: String, required: true, trim: true },
  nameEn:      { type: String, trim: true },
  logo:        { type: String, default: '' },
  stamp:       { type: String, default: '' },

  // ─── INDUSTRY (core field — drives UI + modules + DB) ─────────
  industry:    {
    type: String,
    required: true, default: 'trading_general',
    enum: [
      // Trade
      'trading_general','retail','wholesale','ecommerce',
      // Hospitality
      'restaurant','cafe','catering','hotel','furnished_apartments',
      // Health
      'hospital','polyclinic','clinic','dental','pharmacy',
      'medical_lab','radiology','physiotherapy','optometry','veterinary',
      // Education
      'university','school','kindergarten','training_center',
      'language_institute','driving_school','quran_institute',
      // Beauty & Wellness
      'salon_ladies','salon_gents','spa','gym','medical_spa',
      // Construction
      'construction_general','mep','interior_design',
      // Real Estate
      'real_estate','property_management','real_estate_broker',
      // Logistics
      'freight','delivery','warehouse_storage','transportation',
      // Manufacturing
      'manufacturing','food_production',
      // Professional Services
      'consulting','law_firm','accounting_firm','it_company',
      'engineering','hr_company','security_company','cleaning','maintenance','advertising',
      // Finance
      'exchange','insurance','investment',
      // Automotive
      'car_dealership','car_workshop',
      // Agriculture
      'agriculture',
      // Events & Entertainment
      'events','media','sport_club','amusement',
      // NGO
      'ngo','waqf',
      // Other
      'telecom','oil_gas','other'
    ]
  },
  subIndustry: { type: String, trim: true },

  // ─── Plan & Subscription ──────────────────────────────────────
  plan:            { type: String, enum: ['trial','starter','professional','enterprise'], default: 'trial' },
  planExpiresAt:   { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) },
  maxUsers:        { type: Number, default: 10 },
  maxBranches:     { type: Number, default: 3 },
  maxEmployees:    { type: Number, default: 50 },

  // ─── Financial Settings ───────────────────────────────────────
  currency:         { type: String, default: 'SAR' },
  currencySymbol:   { type: String, default: 'ر.س' },
  timezone:         { type: String, default: 'Asia/Riyadh' },
  country:          { type: String, default: 'SA' },
  city:             { type: String, default: 'الرياض' },
  language:         { type: String, default: 'ar' },
  fiscalYearStart:  { type: Number, default: 1, min: 1, max: 12 },
  vatRate:          { type: Number, default: 15 },
  roundingMethod:   { type: String, enum: ['none','round','floor','ceil'], default: 'round' },
  decimalPlaces:    { type: Number, default: 2 },

  // ─── Legal / Commercial Registry ─────────────────────────────
  commercialReg:    { type: String, trim: true },
  vatNumber:        { type: String, trim: true },
  zatcaStatus:      { type: String, enum: ['not_registered','phase1','phase2'], default: 'not_registered' },
  zatcaSecretKey:   { type: String },
  zatcaUUID:        { type: String },

  // ─── Industry-specific Licenses ───────────────────────────────
  licenseNumber:        { type: String },   // general
  healthLicense:        { type: String },   // health & medical
  mohApproval:          { type: String },   // ministry of health
  pharmacyLicense:      { type: String },   // pharmacy
  contractorLicense:    { type: String },   // construction
  classificationGrade:  { type: String },   // contractor grade
  industrialLicense:    { type: String },   // manufacturing
  transportLicense:     { type: String },   // logistics
  sacoLicense:          { type: String },   // freight/customs
  reraLicense:          { type: String },   // real estate
  tourismLicense:       { type: String },   // hotel/tourism
  gcaLicense:           { type: String },   // events/GCA
  gcamLicense:          { type: String },   // media
  citcLicense:          { type: String },   // telecom/IT
  socpaLicense:         { type: String },   // accounting firm
  barAssocLicense:      { type: String },   // law firm
  saceLicense:          { type: String },   // engineering
  tvtcLicense:          { type: String },   // training center
  moeLicense:           { type: String },   // education
  samaLicense:          { type: String },   // finance/banking
  mvdaLicense:          { type: String },   // automotive

  // ─── Industry-specific Properties ────────────────────────────
  starRating:       { type: Number, min:1, max:7 },   // hotel
  roomCount:        { type: Number },                  // hotel/apartments
  bedCount:         { type: Number },                  // hospital
  doctorCount:      { type: Number },                  // health
  seatingCapacity:  { type: Number },                  // restaurant
  capacity:         { type: Number },                  // gym/events
  studentCount:     { type: Number },                  // education
  gender:           { type: String, enum: ['male','female','mixed'] }, // salon/school
  specialty:        { type: String },                  // clinic
  educationType:    { type: String },                  // school level
  productionCapacity:{ type: Number },                 // manufacturing
  fleetSize:        { type: Number },                  // logistics

  // ─── Contact ──────────────────────────────────────────────────
  phone:     { type: String },
  phone2:    { type: String },
  email:     { type: String },
  website:   { type: String },
  address:   { type: String },
  district:  { type: String },
  zipCode:   { type: String },
  poBox:     { type: String },
  location:  { lat: Number, lng: Number, address: String },

  // ─── Banking ──────────────────────────────────────────────────
  bankName:  { type: String },
  bankIBAN:  { type: String },
  bankSwift: { type: String },

  // ─── PDF / Document Settings ──────────────────────────────────
  pdfSettings: {
    pageSize:   { type: String, default: 'A4' },
    headerText: { type: String },
    footerText: { type: String },
    showLogo:   { type: Boolean, default: true },
    showStamp:  { type: Boolean, default: false },
    showAddress:{ type: Boolean, default: true },
    showVAT:    { type: Boolean, default: true },
    watermark:  { type: String },
    margins: {
      top:    { type: Number, default: 20 },
      bottom: { type: Number, default: 20 },
      left:   { type: Number, default: 15 },
      right:  { type: Number, default: 15 }
    }
  },

  // ─── Onboarding ───────────────────────────────────────────────
  onboarding: {
    completed:   { type: Boolean, default: false },
    step:        { type: Number, default: 0 },
    completedAt: { type: Date }
  },

  // ─── Status ───────────────────────────────────────────────────
  isActive:    { type: Boolean, default: true },
  // هل تم توليد بيانات تجريبية تلقائياً لهذه الشركة؟ (موظفين، فروع،
  // مستودعات، مخزون، مشاريع، عملاء/موردين، أوامر شراء، عروض أسعار) —
  // يمنع التكرار ويضمن أنه يحدث مرة واحدة فقط لكل شركة
  dataSeeded:  { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspendReason: { type: String },

  // ─── المستندات الرسمية (سجل تجاري، شهادة ضريبية، رخصة...) ────────
  documents: [{
    fileId:     { type: String },   // معرّف GridFS
    name:       { type: String },   // اسم الملف الأصلي
    url:        { type: String },
    docType:    { type: String, enum: ['commercial_reg','vat_certificate','license','bank_letter','other'], default: 'other' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  }],

  // ─── Relations ────────────────────────────────────────────────
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true, toJSON: { virtuals: true } });

// Indexes
companySchema.index({ industry: 1 });
companySchema.index({ vatNumber: 1 }, { sparse: true });
companySchema.index({ commercialReg: 1 }, { sparse: true });
companySchema.index({ isActive: 1 });

// Virtual: get industry config
companySchema.virtual('industryConfig').get(function() {
  try {
    const { INDUSTRIES } = require('../config/industries');
    return INDUSTRIES[this.industry] || INDUSTRIES['trading_general'];
  } catch { return null; }
});

module.exports = mongoose.model('Company', companySchema);
