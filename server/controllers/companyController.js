const Company = require('../models/Company');
const { validationResult } = require('express-validator');

// @desc    Get company settings
// @route   GET /api/company
// @access  Private
exports.getCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        name: 'شركتي',
        nameEn: 'My Company',
        currency: 'SAR',
        timezone: 'Asia/Riyadh',
        location: { lat: 24.7136, lng: 46.6753, address: '' }
      });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update company settings
// @route   PUT /api/company
// @access  Private (Admin)
exports.updateCompany = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name, nameEn, email, phone, website,
      taxNumber, commercialRegistration, address, location,
      logo, currency, fiscalYearStart, timezone, pdfSettings
    } = req.body;

    let company = await Company.findOne();

    const updateData = {
      name, nameEn, email, phone, website,
      taxNumber, commercialRegistration, address, location,
      logo, currency, fiscalYearStart, timezone, pdfSettings,
      updatedAt: Date.now()
    };

    if (company) {
      company = await Company.findByIdAndUpdate(
        company._id,
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      company = await Company.create(updateData);
    }

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update company location
// @route   PUT /api/company/location
// @access  Private (Admin)
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;

    let company = await Company.findOne();
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    company.location = { lat, lng, address };
    company.updatedAt = Date.now();
    await company.save();

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload company logo
// @route   POST /api/company/logo
// @access  Private (Admin)
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({ name: 'شركتي', logo: logoUrl });
    } else {
      company.logo = logoUrl;
      company.updatedAt = Date.now();
      await company.save();
    }

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
