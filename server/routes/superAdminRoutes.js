const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const sa = require('../controllers/superAdminController');

const superAdminOnly = [protect, authorize('superadmin')];

// Platform stats
router.get('/stats',                    ...superAdminOnly, sa.getPlatformStats);

// Companies CRUD
router.route('/companies')
  .get( ...superAdminOnly, sa.getCompanies)
  .post(...superAdminOnly, sa.createCompany);

router.route('/companies/:id')
  .get(   ...superAdminOnly, sa.getCompany)
  .put(   ...superAdminOnly, sa.updateCompany)
  .delete(...superAdminOnly, sa.deleteCompany);

// Plan management
router.put('/companies/:id/plan',    ...superAdminOnly, sa.changePlan);
router.put('/companies/:id/suspend', ...superAdminOnly, sa.toggleSuspend);

module.exports = router;
