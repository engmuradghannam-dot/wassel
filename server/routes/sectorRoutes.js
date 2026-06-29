const express = require('express');
const { protect } = require('../middleware/auth');
const { getCompany } = require('../middleware/auth');

/**
 * Generic CRUD router factory for sector models
 */
const makeSectorRouter = (Model, options = {}) => {
  const router = express.Router();
  const { autoCode, populate = '', searchFields = ['name'] } = options;

  // GET all
  router.get('/', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
      const filter = { company: co };
      if (req.query.search) {
        const q = new RegExp(req.query.search, 'i');
        filter.$or = searchFields.map(f => ({ [f]: q }));
      }
      // Extra filters from query params
      const reserved = ['search','limit','skip','sort'];
      Object.entries(req.query).forEach(([k,v]) => {
        if (!reserved.includes(k)) {
          filter[k] = v === 'true' ? true : v === 'false' ? false : v;
        }
      });
      const limit = Math.min(parseInt(req.query.limit)||500, 1000);
      const skip  = parseInt(req.query.skip)||0;
      const sortQ = req.query.sort ? JSON.parse(req.query.sort) : { createdAt:-1 };
      let q = Model.find(filter).sort(sortQ).limit(limit).skip(skip);
      if (populate) q = q.populate(populate);
      const [docs, count] = await Promise.all([q, Model.countDocuments(filter)]);
      res.json({ success:true, count, data:docs });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  // GET one
  router.get('/:id', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      let q = Model.findOne({ _id:req.params.id, company:co });
      if (populate) q = q.populate(populate);
      const doc = await q;
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, data:doc });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  // POST create
  router.post('/', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
      const doc = await Model.create({ ...req.body, company:co, createdBy:req.user._id });
      res.status(201).json({ success:true, data:doc });
    } catch (err) { res.status(400).json({ success:false, message:err.message }); }
  });

  // PUT update
  router.put('/:id', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      const doc = await Model.findOneAndUpdate(
        { _id:req.params.id, company:co }, req.body, { new:true, runValidators:true }
      );
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, data:doc });
    } catch (err) { res.status(400).json({ success:false, message:err.message }); }
  });

  // DELETE
  router.delete('/:id', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      const doc = await Model.findOneAndDelete({ _id:req.params.id, company:co });
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, message:'تم الحذف' });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  return router;
};

// ── Register all sector routes ────────────────────────────────────────────────
const router = express.Router();

// Hotel
const Room       = require('../models/hotel/Room');
const Booking    = require('../models/hotel/Booking');
router.use('/rooms',    makeSectorRouter(Room,    { searchFields:['number','type'] }));
router.use('/bookings', makeSectorRouter(Booking, { searchFields:['guestName','roomNumber','guestPhone'] }));

// Clinic / Health
const Patient     = require('../models/clinic/Patient');
const Appointment = require('../models/clinic/Appointment');
router.use('/patients',     makeSectorRouter(Patient,     { searchFields:['name','nationalId','phone'] }));
router.use('/appointments', makeSectorRouter(Appointment, { searchFields:['patientName','doctorName'] }));

// Education
const Student = require('../models/education/Student');
router.use('/students', makeSectorRouter(Student, { searchFields:['name','studentId','classroom'] }));

// Gym
const Membership = require('../models/gym/Membership');
router.use('/memberships', makeSectorRouter(Membership, { searchFields:['memberName','memberPhone'] }));

// Restaurant tables
const Table = require('../models/restaurant/Table');
router.use('/tables', makeSectorRouter(Table, { searchFields:['number'] }));

// Real Estate
// router.use('/properties', makeSectorRouter(Property, ...));

module.exports = router;
