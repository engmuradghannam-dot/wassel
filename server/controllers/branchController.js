const Branch = require('../models/Branch');

const getCompany = (req) => (req.user?.company?.toString() || req.company || '');
const { buildFilter, checkPlanLimit } = require('../middleware/tenant');

exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find(buildFilter(req))
      .populate('manager', 'name email').sort({ name: 1 });
    res.json({ success: true, count: branches.length, data: branches });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('manager', 'name email');
    if (!branch) return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    res.json({ success: true, data: branch });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create({ ...req.body, company: getCompany(req) });
    res.status(201).json({ success: true, data: branch });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    res.json({ success: true, data: branch });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!branch) return res.status(404).json({ success: false, message: 'الفرع غير موجود' });
    res.json({ success: true, message: 'تم حذف الفرع' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
