const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Employee = require('../models/Employee');
const PurchaseOrder = require('../models/PurchaseOrder');

// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalItems,
      lowStockItems,
      totalSuppliers,
      totalEmployees,
      pendingOrders,
      inventoryAgg,
      recentOrders
    ] = await Promise.all([
      Inventory.countDocuments({ isActive: true }),
      Inventory.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$minQuantity'] } }),
      Supplier.countDocuments({ isActive: true }),
      Employee.countDocuments({ status: 'active' }),
      PurchaseOrder.countDocuments({ status: { $in: ['draft', 'pending', 'ordered'] } }),
      Inventory.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } }
      ]),
      PurchaseOrder.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('supplier', 'name')
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        lowStockItems,
        totalSuppliers,
        totalEmployees,
        pendingOrders,
        inventoryValue: inventoryAgg[0]?.total || 0,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   GET /api/reports/inventory
// @access  Private
exports.getInventoryReport = async (req, res) => {
  try {
    const { warehouse, branch, from, to } = req.query;
    const filter = { isActive: true };
    if (warehouse) filter.warehouse = warehouse;
    if (branch) filter.branch = branch;

    const items = await Inventory.find(filter)
      .populate('warehouse', 'name')
      .populate('branch', 'name')
      .sort({ name: 1 });

    const summary = await Inventory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalSaleValue: { $sum: { $multiply: ['$quantity', '$salePrice'] } },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$quantity', '$minQuantity'] }, 1, 0] }
          }
        }
      }
    ]);

    const byCategory = await Inventory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        items,
        summary: summary[0] || {},
        byCategory
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   GET /api/reports/purchases
// @access  Private
exports.getPurchaseReport = async (req, res) => {
  try {
    const { from, to, status, supplier } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;
    if (from || to) {
      filter.orderDate = {};
      if (from) filter.orderDate.$gte = new Date(from);
      if (to) filter.orderDate.$lte = new Date(to);
    }

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name')
      .sort({ orderDate: -1 });

    const summary = await PurchaseOrder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    const bySupplier = await PurchaseOrder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$supplier',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: { orders, summary, bySupplier }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
