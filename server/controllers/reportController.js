const Inventory = require('../models/Inventory');
const PurchaseOrder = require('../models/PurchaseOrder');
const Employee = require('../models/Employee');
const Supplier = require('../models/Supplier');

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalItems,
      lowStockItems,
      totalSuppliers,
      totalEmployees,
      pendingOrders,
      recentOrders
    ] = await Promise.all([
      Inventory.countDocuments({ isActive: true }),
      Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$minQuantity'] }, isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Employee.countDocuments({ status: 'active' }),
      PurchaseOrder.countDocuments({ status: { $in: ['pending', 'approved'] } }),
      PurchaseOrder.find().sort({ createdAt: -1 }).limit(5)
        .populate('supplier', 'name')
    ]);

    const inventoryValue = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } }
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        totalSuppliers,
        totalEmployees,
        pendingOrders,
        inventoryValue: inventoryValue[0]?.total || 0,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const byCategory = await Inventory.aggregate([
      { $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalQty: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } }
      }},
      { $sort: { totalValue: -1 } }
    ]);

    res.json({ success: true, data: { byCategory } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const summary = await PurchaseOrder.aggregate([
      { $match: filter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$total' }
      }}
    ]);

    const bySupplier = await PurchaseOrder.aggregate([
      { $match: { ...filter, status: { $in: ['approved', 'received', 'partial'] } } },
      { $group: { _id: '$supplier', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({ success: true, data: { summary, bySupplier } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
