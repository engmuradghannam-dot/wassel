const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/company
// @desc    Get company settings
// @access  Private
router.get('/', protect, companyController.getCompany);

// @route   PUT /api/company
// @desc    Update company settings
// @access  Private (Admin)
router.put(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Company name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('taxNumber').optional().trim(),
    body('commercialRegistration').optional().trim(),
    body('location.lat').optional().isFloat().withMessage('Invalid latitude'),
    body('location.lng').optional().isFloat().withMessage('Invalid longitude')
  ],
  companyController.updateCompany
);

// @route   PUT /api/company/location
// @desc    Update company location
// @access  Private (Admin)
router.put('/location', protect, authorize('admin'), companyController.updateLocation);

// @route   POST /api/company/logo
// @desc    Upload company logo
// @access  Private (Admin)
router.post('/logo', protect, authorize('admin'), upload.single('logo'), companyController.uploadLogo);

module.exports = router;
