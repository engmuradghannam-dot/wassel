const express  = require('express');
const router   = express.Router();
const {
  register, login, getMe, getUsers, createUser, updateUser, deleteUser, updateOnlineStatus
} = require('../controllers/userController');
const { protect, authorize, getCompany } = require('../middleware/auth');

// ── Public ─────────────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);

// ── Protected ──────────────────────────────────────────────────────────────
router.get('/me',            protect, getMe);
router.put('/status/online', protect, updateOnlineStatus);

// ── Chat contacts — all users across companies (for cross-company chat) ────
router.get('/chat-contacts', protect, async (req, res) => {
  try {
    const User    = require('../models/User');
    const co      = getCompany(req);
    const search  = req.query.search;
    
    // Build query: exclude current user
    const query = { _id: { $ne: req.user._id }, isActive: true };
    if (search) {
      const q = new RegExp(search, 'i');
      query.$or = [{ name:q }, { email:q }];
    }
    
    const users = await User.find(query)
      .select('name email avatar isOnline lastSeen company role')
      .populate('company', 'name industry')
      .limit(100)
      .sort({ isOnline:-1, name:1 });
    
    res.json({ success:true, count:users.length, data:users });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── Company user management ────────────────────────────────────────────────
// owner/admin can manage users in their OWN company
// superadmin can manage everyone
router.get('/',    protect, getUsers);
router.post('/',   protect, createUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('owner','admin','superadmin'), deleteUser);

// ── POST /api/users/setup-company — for Google OAuth new users ──────────────
router.post('/setup-company', protect, async (req, res) => {
  try {
    const { getCompany } = require('../middleware/auth');
    const Company  = require('../models/Company');
    const co = getCompany(req);

    // If user already has a company, reject
    if (co) return res.status(400).json({ success:false, message:'هذا الحساب مرتبط بشركة مسبقاً' });

    const {
      companyName, companyNameEn, industry, plan, phone,
      city, country, commercialReg, vatNumber
    } = req.body;

    if (!companyName || !industry) {
      return res.status(400).json({ success:false, message:'اسم الشركة والقطاع مطلوبان' });
    }

    // Create company
    const company = await Company.create({
      name:         companyName,
      nameEn:       companyNameEn || companyName,
      industry,
      plan:         plan || 'trial',
      phone,
      city,
      country:      country || 'SA',
      commercialReg,
      vatNumber,
      isActive:     true,
      maxUsers:     plan==='professional'?100:plan==='starter'?25:10,
      planExpiresAt:new Date(Date.now() + 30*24*3600*1000),
    });

    // Link user to company as owner
    const user = await User.findByIdAndUpdate(req.user._id, {
      company: company._id,
      role:    'owner',
    }, { new:true }).populate('company','name nameEn industry plan');

    const token = require('jsonwebtoken').sign(
      { id:user._id },
      process.env.JWT_SECRET || 'wassel-erp-secret-key-min-32-chars',
      { expiresIn: '30d' }
    );

    // ── Auto-seed sector-suggested employees + login accounts ────────────
    let seedResult = null;
    try {
      const { seedSectorEmployees } = require('../services/seedSectorEmployees');
      seedResult = await seedSectorEmployees({
        companyId:   company._id,
        companyName: company.name,
        industry:    company.industry,
        ownerUserId: user._id,
      });
    } catch (seedErr) {
      console.error('Auto-seed employees failed (non-critical):', seedErr.message);
    }

    res.json({
      success:true, token, data:{ user },
      seededEmployees: seedResult ? seedResult.employees.length : 0,
      seededAccounts:  seedResult ? seedResult.accounts.length  : 0,
    });
  } catch(e) { res.status(400).json({ success:false, message:e.message }); }
});

module.exports = router;
