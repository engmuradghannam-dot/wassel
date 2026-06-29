const express = require('express');
const { protect } = require('../middleware/auth');
const { getCompany } = require('../middleware/auth');

/**
 * Creates a generic CRUD router for any sector model
 */
const makeSectorRouter = (Model, autoCode = null) => {
  const router = express.Router();

  // GET all
  router.get('/', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      const filter = { company: co };
      if (req.query.search) {
        const q = new RegExp(req.query.search, 'i');
        const searchFields = req.query.searchFields?.split(',') || ['name'];
        filter.$or = searchFields.map(f => ({ [f]: q }));
      }
      Object.entries(req.query).forEach(([k,v]) => {
        if (!['search','searchFields','limit','skip','sort'].includes(k)) {
          if (v === 'true') filter[k] = true;
          else if (v === 'false') filter[k] = false;
          else filter[k] = v;
        }
      });
      const limit = parseInt(req.query.limit) || 500;
      const skip  = parseInt(req.query.skip)  || 0;
      const sort  = req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 };
      const [docs, count] = await Promise.all([
        Model.find(filter).limit(limit).skip(skip).sort(sort),
        Model.countDocuments(filter)
      ]);
      res.json({ success:true, count, data:docs });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  // GET one
  router.get('/:id', protect, async (req, res) => {
    try {
      const doc = await Model.findOne({ _id:req.params.id, company:getCompany(req) });
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, data:doc });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  // POST create
  router.post('/', protect, async (req, res) => {
    try {
      const co = getCompany(req);
      if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
      let data = { ...req.body, company:co, createdBy:req.user._id };
      if (autoCode) {
        const count = await Model.countDocuments({ company:co });
        data[autoCode.field] = req.body[autoCode.field]?.trim() || `${autoCode.prefix}${String(count+1).padStart(4,'0')}`;
      }
      const doc = await Model.create(data);
      res.status(201).json({ success:true, data:doc });
    } catch (err) { res.status(400).json({ success:false, message:err.message }); }
  });

  // PUT update
  router.put('/:id', protect, async (req, res) => {
    try {
      const doc = await Model.findOneAndUpdate(
        { _id:req.params.id, company:getCompany(req) },
        req.body, { new:true, runValidators:true }
      );
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true, data:doc });
    } catch (err) { res.status(400).json({ success:false, message:err.message }); }
  });

  // DELETE
  router.delete('/:id', protect, async (req, res) => {
    try {
      const doc = await Model.findOneAndDelete({ _id:req.params.id, company:getCompany(req) });
      if (!doc) return res.status(404).json({ success:false, message:'السجل غير موجود' });
      res.json({ success:true });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
  });

  return router;
};

module.exports = { makeSectorRouter };
