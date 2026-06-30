const express     = require('express');
const { protect, getCompany } = require('../middleware/auth');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * makeSectorRouter — factory صانعة لراوتر CRUD مخصص لموديل واحد محدد
 * تُستخدم في server.js لإنشاء مسارات مباشرة مثل /api/rooms /api/bookings
 * (بخلاف /api/sector/:model أدناه وهو راوتر عام موحّد لكل الموديلات معاً)
 *
 * @param {mongoose.Model} Model  - الموديل المستهدف
 * @param {Object} opts
 * @param {String} opts.field     - اسم الحقل المستخدم للترقيم التلقائي (مثلاً 'number')
 * @param {String} opts.prefix    - بادئة الترقيم التلقائي (مثلاً 'RM-')
 * @returns {express.Router}
 * ═══════════════════════════════════════════════════════════════════════════
 */
function makeSectorRouter(Model, opts = {}) {
  const router = express.Router();
  const { field, prefix } = opts;

  // GET all (مع بحث وتصفية اختيارية)
  router.get('/', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

      const filter = { company: co };
      const RESERVED = ['search','limit','skip','sort','page'];
      Object.entries(req.query).forEach(([k,v]) => {
        if (!RESERVED.includes(k)) filter[k] = v === 'true' ? true : v === 'false' ? false : v;
      });
      if (req.query.search && field) {
        filter[field] = new RegExp(req.query.search, 'i');
      }

      const limit = Math.min(parseInt(req.query.limit)||200, 500);
      const skip  = parseInt(req.query.skip)||0;
      const sort  = req.query.sort || '-createdAt';

      const [docs, total] = await Promise.all([
        Model.find(filter).sort(sort).skip(skip).limit(limit),
        Model.countDocuments(filter),
      ]);
      res.json({ success:true, count:docs.length, total, data:docs });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  // GET single
  router.get('/:id', protect, async (req, res) => {
    try {
      const co  = getCompany(req);
      const doc = await Model.findOne({ _id:req.params.id, company:co });
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, data:doc });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  // POST create — مع ترقيم تلقائي عبر field/prefix إن لم يُرسل العميل قيمة
  router.post('/', protect, async (req, res) => {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

    const MAX_RETRIES = 5;
    let lastErr = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const body = { ...req.body, company: co, createdBy: req.user._id };
        if (field && prefix && !body[field]) {
          body[field] = `${prefix}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*100)}`;
        }
        const doc = await Model.create(body);
        return res.status(201).json({ success:true, data:doc });
      } catch (err) {
        lastErr = err;
        // إعادة محاولة فقط عند تصادم الترقيم التلقائي (duplicate key على نفس الحقل)
        if (err.code === 11000 && field && Object.keys(err.keyPattern||{}).includes(field)) continue;
        return res.status(400).json({ success:false, message:err.message, detail:err.message });
      }
    }
    res.status(400).json({ success:false, message:'فشل الإنشاء بعد عدة محاولات: ' + (lastErr?.message||'') });
  });

  // PUT update
  router.put('/:id', protect, async (req, res) => {
    try {
      const co  = getCompany(req);
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
      const co  = getCompany(req);
      const doc = await Model.findOneAndDelete({ _id:req.params.id, company:co });
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, message:'تم الحذف' });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  return router;
}

// ═══════════════════════════════════════════════════════════════════════════
// راوتر عام موحّد — يخدم كل الموديلات القطاعية عبر /api/sector/:model
// (مستقل تماماً عن makeSectorRouter أعلاه؛ يبقى كما كان يعمل سابقاً)
// ═══════════════════════════════════════════════════════════════════════════
const MODEL_REGISTRY = {
  'rooms':               () => require('../models/hotel/Room'),
  'bookings':            () => require('../models/hotel/Booking'),
  'patients':            () => require('../models/clinic/Patient'),
  'appointments':        () => require('../models/clinic/Appointment'),
  'students':            () => require('../models/education/Student'),
  'grades':              () => require('../models/education/Grade'),
  'tables':              () => require('../models/restaurant/Table'),
  'restaurant-orders':   () => require('../models/restaurant/Order'),
  'memberships':         () => require('../models/gym/Membership'),
  'properties':          () => require('../models/real_estate/Property'),
  'leases':              () => require('../models/real_estate/Lease'),
  'salon-appointments':  () => require('../models/salon/SalonAppointment'),
};

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

const POPULATE = {
  'bookings':       'room',
  'appointments':   'patient doctor',
  'grades':         'student',
  'leases':         'property',
  'restaurant-orders':'table',
};

const genericRouter = express.Router();

genericRouter.use('/:model', (req, res, next) => {
  const loader = MODEL_REGISTRY[req.params.model];
  if (!loader) return res.status(404).json({ success:false, message:`Model '${req.params.model}' not found` });
  try { req.Model = loader(); } catch(e) {
    return res.status(500).json({ success:false, message:`Error loading model: ${e.message}` });
  }
  next();
});

genericRouter.get('/:model', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });

    const filter = { company: co };
    const key    = req.params.model;

    if (req.query.search) {
      const q      = new RegExp(req.query.search, 'i');
      const fields = SEARCH_FIELDS[key] || ['name'];
      filter.$or   = fields.map(f => ({ [f]: q }));
    }
    const RESERVED = ['search','limit','skip','sort','page'];
    Object.entries(req.query).forEach(([k,v]) => {
      if (!RESERVED.includes(k)) filter[k] = v === 'true' ? true : v === 'false' ? false : v;
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

genericRouter.get('/:model/:id', protect, async (req, res) => {
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

genericRouter.post('/:model', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    const doc = await req.Model.create({ ...req.body, company:co, createdBy:req.user._id });
    res.status(201).json({ success:true, data:doc });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
});

genericRouter.put('/:model/:id', protect, async (req, res) => {
  try {
    const co  = getCompany(req);
    const doc = await req.Model.findOneAndUpdate(
      { _id:req.params.id, company:co }, req.body, { new:true, runValidators:true }
    );
    if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
    res.json({ success:true, data:doc });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
});

genericRouter.delete('/:model/:id', protect, async (req, res) => {
  try {
    const co  = getCompany(req);
    const doc = await req.Model.findOneAndDelete({ _id:req.params.id, company:co });
    if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
    res.json({ success:true, message:'تم الحذف' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = genericRouter;
module.exports.makeSectorRouter = makeSectorRouter;
