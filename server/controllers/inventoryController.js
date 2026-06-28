const Inventory = require('../models/Inventory');

exports.getItems = async (req, res) => {
  try {
    const { category, warehouse, branch, lowStock } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (warehouse) filter.warehouse = warehouse;
    if (branch) filter.branch = branch;
    if (lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$minQuantity'] };

    const items = await Inventory.find(filter)
      .populate('warehouse', 'name')
      .populate('branch', 'name')
      .sort({ name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('warehouse', 'name')
      .populate('branch', 'name');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    if (!req.body.sku) {
      req.body.sku = 'SKU-' + Date.now();
    }
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { quantity, type, reason } = req.body; // type: 'add' | 'subtract' | 'set'
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (type === 'add') item.quantity += quantity;
    else if (type === 'subtract') item.quantity = Math.max(0, item.quantity - quantity);
    else if (type === 'set') item.quantity = quantity;

    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minQuantity'] },
      isActive: true
    }).populate('warehouse', 'name');
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
