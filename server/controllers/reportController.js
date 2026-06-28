const Inventory     = require('../models/Inventory');
const Supplier      = require('../models/Supplier');
const Employee      = require('../models/Employee');
const PurchaseOrder = require('../models/PurchaseOrder');
const { buildFilter } = require('../middleware/tenant');

exports.getDashboard = async (req, res) => {
  try {
    const f = buildFilter(req);
    const [totalItems, lowStockItems, totalSuppliers, totalEmployees, pendingOrders, inventoryAgg, recentOrders] = await Promise.all([
      Inventory.countDocuments({ ...f, isActive: true }),
      Inventory.countDocuments({ ...f, isActive: true, $expr: { $lte: ['$quantity','$minQuantity'] } }),
      Supplier.countDocuments({ ...f, isActive: true }),
      Employee.countDocuments({ ...f, status: 'active' }),
      PurchaseOrder.countDocuments({ ...f, status: { $in: ['draft','pending','ordered'] } }),
      Inventory.aggregate([{ $match: { ...f, isActive: true } }, { $group: { _id: null, total: { $sum: { $multiply: ['$quantity','$costPrice'] } } } }]),
      PurchaseOrder.find(f).sort({ createdAt: -1 }).limit(5).populate('supplier','name')
    ]);
    res.json({ success: true, data: { totalItems, lowStockItems, totalSuppliers, totalEmployees, pendingOrders, inventoryValue: inventoryAgg[0]?.total || 0, recentOrders } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const f = buildFilter(req, { isActive: true });
    if (req.query.warehouse) f.warehouse = req.query.warehouse;
    if (req.query.branch)    f.branch    = req.query.branch;
    const [items, summary, byCategory] = await Promise.all([
      Inventory.find(f).populate('warehouse','name').populate('branch','name').sort({ name: 1 }),
      Inventory.aggregate([{ $match: f }, { $group: { _id: null, totalItems: { $sum: 1 }, totalQuantity: { $sum: '$quantity' }, totalCostValue: { $sum: { $multiply: ['$quantity','$costPrice'] } }, totalSaleValue: { $sum: { $multiply: ['$quantity','$salePrice'] } }, lowStockCount: { $sum: { $cond: [{ $lte: ['$quantity','$minQuantity'] }, 1, 0] } } } }]),
      Inventory.aggregate([{ $match: f }, { $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$quantity','$costPrice'] } } } }, { $sort: { totalValue: -1 } }])
    ]);
    res.json({ success: true, data: { items, summary: summary[0] || {}, byCategory } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getPurchaseReport = async (req, res) => {
  try {
    const f = buildFilter(req);
    if (req.query.status)   f.status   = req.query.status;
    if (req.query.supplier) f.supplier = req.query.supplier;
    if (req.query.from || req.query.to) {
      f.orderDate = {};
      if (req.query.from) f.orderDate.$gte = new Date(req.query.from);
      if (req.query.to)   f.orderDate.$lte = new Date(req.query.to);
    }
    const [orders, summary] = await Promise.all([
      PurchaseOrder.find(f).populate('supplier','name').sort({ orderDate: -1 }),
      PurchaseOrder.aggregate([{ $match: f }, { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }])
    ]);
    res.json({ success: true, data: { orders, summary } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
