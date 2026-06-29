const Inventory = require('../models/Inventory');

const getCompany = (req) => (req.user?.company?.toString() || req.company || '');
const { buildFilter } = require('../middleware/tenant');

exports.getItems = async (req, res) => {
  try {
    const { category, warehouse, branch, lowStock } = req.query;
    const extra = {};
    if (category)         extra.category   = category;
    if (warehouse)        extra.warehouse  = warehouse;
    if (branch)           extra.branch     = branch;
    if (lowStock === 'true') extra.$expr   = { $lte: ['$quantity','$minQuantity'] };
    const items = await Inventory.find(buildFilter(req, extra))
      .populate('warehouse','name').populate('branch','name').sort({ name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getItem = async (req, res) => {
  try {
    const item = await Inventory.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('warehouse','name').populate('branch','name');
    if (!item) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createItem = async (req, res) => {
  try {
    if (!req.body.sku) req.body.sku = 'SKU-' + Date.now();
    const item = await Inventory.create({ ...req.body, company: getCompany(req) });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findOneAndDelete(buildFilter(req, { _id: req.params.id }));
    if (!item) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    res.json({ success: true, message: 'تم حذف المنتج' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.adjustStock = async (req, res) => {
  try {
    const { quantity, type } = req.body;
    const item = await Inventory.findOne(buildFilter(req, { _id: req.params.id }));
    if (!item) return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    if (type === 'add')      item.quantity += quantity;
    else if (type === 'subtract') item.quantity = Math.max(0, item.quantity - quantity);
    else if (type === 'set')      item.quantity = quantity;
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find(
      buildFilter(req, { $expr: { $lte: ['$quantity','$minQuantity'] }, isActive: true }))
      .populate('warehouse','name');
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
