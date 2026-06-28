const Warehouse = require('../models/Warehouse');
const { buildFilter } = require('../middleware/tenant');

exports.getWarehouses = async (req, res) => {
  try {
    const wh = await Warehouse.find(buildFilter(req))
      .populate('branch','name').populate('manager','name email');
    res.json({ success: true, count: wh.length, data: wh });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getWarehouse = async (req, res) => {
  try {
    const wh = await Warehouse.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('branch','name').populate('manager','name email');
    if (!wh) return res.status(404).json({ success: false, message: 'المستودع غير موجود' });
    res.json({ success: true, data: wh });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createWarehouse = async (req, res) => {
  try {
    const wh = await Warehouse.create({ ...req.body, company: req.company });
    res.status(201).json({ success: true, data: wh });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateWarehouse = async (req, res) => {
  try {
    const wh = await Warehouse.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true });
    if (!wh) return res.status(404).json({ success: false, message: 'المستودع غير موجود' });
    res.json({ success: true, data: wh });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteWarehouse = async (req, res) => {
  try {
    const wh = await Warehouse.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!wh) return res.status(404).json({ success: false, message: 'المستودع غير موجود' });
    res.json({ success: true, message: 'تم حذف المستودع' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
