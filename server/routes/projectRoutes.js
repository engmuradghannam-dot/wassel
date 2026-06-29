const express  = require('express');
const router   = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Project  = require('../models/Project');
const { buildFilter } = require('../middleware/tenant');

router.get('/', protect, async (req, res) => {
  try {
    const filter = buildFilter(req, {});
    if (req.query.status) filter.status = req.query.status;
    const projects = await Project.find(filter)
      .populate('manager','name').populate('customer','name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/', protect, authorize('admin','manager','superadmin'), async (req, res) => {
  try {
    const count = await Project.countDocuments({ company: req.user.company }) + 1;
    const project = await Project.create({
      ...req.body,
      company: req.user.company,
      code: `PRJ-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: project });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const p = await Project.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('manager','name email').populate('team.employee','name')
      .populate('customer','name');
    if (!p) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const p = await Project.findOneAndUpdate(buildFilter(req, { _id: req.params.id }), req.body, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'المشروع غير موجود' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

// Update task status
router.put('/:id/tasks/:taskId', protect, async (req, res) => {
  try {
    const p = await Project.findOneAndUpdate(
      { ...buildFilter(req, { _id: req.params.id }), 'tasks._id': req.params.taskId },
      { $set: { 'tasks.$': { ...req.body, _id: req.params.taskId } } },
      { new: true }
    );
    res.json({ success: true, data: p });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

module.exports = router;
