const Supplier = require('../models/Supplier');
const { buildFilter } = require('../middleware/tenant');

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find(buildFilter(req)).sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne(buildFilter(req, { _id: req.params.id }));
    if (!supplier) return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, company: req.company });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!supplier) return res.status(404).json({ success: false, message: 'المورد غير موجود' });
    res.json({ success: true, message: 'تم حذف المورد' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
