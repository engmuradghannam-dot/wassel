const express     = require('express');
const { protect } = require('../middleware/auth');
const { getCompany } = require('../middleware/auth');

/**
 * Generic CRUD router factory — used for all sector-specific models
 * POST   /api/sector/:model       → create
 * GET    /api/sector/:model       → list (filtered by company)
 * GET    /api/sector/:model/:id   → single
 * PUT    /api/sector/:model/:id   → update
 * DELETE /api/sector/:model/:id   → delete
 */

// Model registry — maps API name → Mongoose model
const MODEL_REGISTRY = {
  // Hotel / Hospitality
  'rooms':               () => require('../models/hotel/Room'),
  'bookings':            () => require('../models/hotel/Booking'),
  // Clinic / Hospital
  'patients':            () => require('../models/clinic/Patient'),
  'appointments':        () => require('../models/clinic/Appointment'),
  // Education
  'students':            () => require('../models/education/Student'),
  'grades':              () => require('../models/education/Grade'),
  // Restaurant
  'tables':              () => require('../models/restaurant/Table'),
  'restaurant-orders':   () => require('../models/restaurant/Order'),
  // Gym
  'memberships':         () => require('../models/gym/Membership'),
  // Real Estate
  'properties':          () => require('../models/real_estate/Property'),
  'leases':              () => require('../models/real_estate/Lease'),
  // Salon
  'salon-appointments':  () => require('../models/salon/SalonAppointment'),
};

// Search fields per model
const SEARCH_FIELDS = {
  'rooms':              ['number','type','description'],
  'bookings':           ['guest.name','guest.phone','bookingNo'],
  'patients':           ['name','nationalId','phone','patientNo'],
  'appointments':       ['apptNo','complaint','diagnosis','doctorName'],
  'students':           ['name','studentNo','grade','faculty'],
  'grades':             ['subject','grade'],
  'tables':             ['number','location'],
  'restaurant-orders':  ['orderNo','customer.name','customer.phone'],
  'memberships':        ['name','phone','memberNo'],
  'properties':         ['name','propNo','address','district'],
  'leases':             ['leaseNo','tenant.name','tenant.phone'],
  'salon-appointments': ['customer.name','customer.phone','apptNo'],
};

// Auto-populate per model
const POPULATE = {
  'bookings':       'room',
  'appointments':   'patient doctor',
  'grades':         'student',
  'leases':         'property',
  'restaurant-orders':'table',
};

const router = express.Router();

// Middleware: resolve model from params
router.use('/:model', (req, res, next) => {
  const loader = MODEL_REGISTRY[req.params.model];
  if (!loader) {
    return res.status(404).json({ success:false, message:`Model '${req.params.model}' not found` });
  }
  try { req.Model = loader(); } catch(e) {
    return res.status(500).json({ success:false, message:`Error loading model: ${e.message}` });
  }
  next();
});

// GET all
router.get('/:model', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

    const filter = { company: co };
    const key    = req.params.model;

    // Search
    if (req.query.search) {
      const q      = new RegExp(req.query.search, 'i');
      const fields = SEARCH_FIELDS[key] || ['name'];
      filter.$or   = fields.map(f => ({ [f]: q }));
    }
    // Extra filters
    const RESERVED = ['search','limit','skip','sort','page'];
    Object.entries(req.query).forEach(([k,v]) => {
      if (!RESERVED.includes(k)) {
        filter[k] = v === 'true' ? true : v === 'false' ? false : v;
      }
    });

    const limit = Math.min(parseInt(req.query.limit)||200, 500);
    const skip  = parseInt(req.query.skip)||0;
    const sort  = req.query.sort || '-createdAt';
    const pop   = POPULATE[key] || '';

    let q2 = req.Model.find(filter).sort(sort).skip(skip).limit(limit);
    if (pop) q2 = q2.populate(pop);
    const [docs, total] = await Promise.all([q2, req.Model.countDocuments(filter)]);

    res.json({ success:true, count:docs.length, total, data:docs });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET single
router.get('/:model/:id', protect, async (req, res) => {
  try {
    const co  = getCompany(req);
    const pop = POPULATE[req.params.model] || '';
    let q     = req.Model.findOne({ _id:req.params.id, company:co });
    if (pop) q = q.populate(pop);
    const doc = await q;
    if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
    res.json({ success:true, data:doc });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST create
router.post('/:model', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    const doc = await req.Model.create({ ...req.body, company:co, createdBy:req.user._id });
    res.status(201).json({ success:true, data:doc });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
});

// PUT update
router.put('/:model/:id', protect, async (req, res) => {
  try {
    const co  = getCompany(req);
    const doc = await req.Model.findOneAndUpdate(
      { _id:req.params.id, company:co },
      req.body,
      { new:true, runValidators:true }
    );
    if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
    res.json({ success:true, data:doc });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
});

// DELETE
router.delete('/:model/:id', protect, async (req, res) => {
  try {
    const co  = getCompany(req);
    const doc = await req.Model.findOneAndDelete({ _id:req.params.id, company:co });
    if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
    res.json({ success:true, message:'تم الحذف' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
