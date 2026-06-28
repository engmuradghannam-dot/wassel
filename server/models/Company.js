const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String },
  email: { type: String },
  phone: { type: String },
  website: { type: String },
  taxNumber: { type: String },
  commercialRegistration: { type: String },
  address: { type: String },
  location: {
    lat: { type: Number, default: 24.7136 },
    lng: { type: Number, default: 46.6753 },
    address: { type: String, default: '' }
  },
  logo: { type: String },
  currency: { type: String, default: 'SAR' },
  fiscalYearStart: { type: Date },
  timezone: { type: String, default: 'Asia/Riyadh' },
  pdfSettings: {
    pageSize: { type: String, default: 'A4' },
    marginTop: { type: Number, default: 20 },
    marginBottom: { type: Number, default: 20 },
    marginLeft: { type: Number, default: 15 },
    marginRight: { type: Number, default: 15 },
    headerText: { type: String, default: '' },
    footerText: { type: String, default: '' },
    showLogo: { type: Boolean, default: true },
    showStamp: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);
