const express = require('express');
const router  = express.Router();
const companyController = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/company — get company settings
router.get('/', protect, companyController.getCompany);

// PUT /api/company — update company settings (admin or superadmin)
router.put('/', protect, authorize('admin', 'superadmin'), companyController.updateCompany);

// PUT /api/company/location — update location
router.put('/location', protect, authorize('admin', 'superadmin'), companyController.updateLocation);

// POST /api/company/logo — upload logo
router.post('/logo', protect, authorize('admin', 'superadmin'), upload.single('logo'), companyController.uploadLogo);

// GET /api/company/all — all companies (superadmin only)
router.get('/all', protect, authorize('superadmin'), companyController.getAllCompanies);

module.exports = router;
