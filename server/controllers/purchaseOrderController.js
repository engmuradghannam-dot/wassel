const PurchaseOrder = require('../models/PurchaseOrder');
const { getCompany } = require('../middleware/auth');

const Inventory     = require('../models/Inventory');
const { buildFilter } = require('../middleware/tenant');

exports.getPurchaseOrders = async (req, res) => {
  try {
    const extra = {};
    if (req.query.status)   extra.status   = req.query.status;
    if (req.query.supplier) extra.supplier = req.query.supplier;
    const orders = await PurchaseOrder.find(buildFilter(req, extra))
      .populate('supplier','name email phone')
      .populate('branch','name').populate('warehouse','name').populate('createdBy','name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne(buildFilter(req, { _id: req.params.id }))
      .populate('supplier','name email phone address')
      .populate('branch','name').populate('warehouse','name')
      .populate('items.inventory','name sku unit').populate('createdBy','name');
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    let subtotal = 0, taxAmount = 0;
    const processedItems = items.map(item => {
      const total = item.quantity * item.unitPrice;
      const tax   = (total * (item.taxRate || 15)) / 100;
      subtotal += total; taxAmount += tax;
      return { ...item, total };
    });
    const order = await PurchaseOrder.create({
      ...rest, company: getCompany(req),
      items: processedItems, subtotal, taxAmount,
      total: subtotal + taxAmount, createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate(
      buildFilter(req, { _id: req.params.id }), req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.receivePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne(buildFilter(req, { _id: req.params.id }));
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    const { items } = req.body;
    let allReceived = true;
    for (const receivedItem of items) {
      const orderItem = order.items.find(i => i.inventory?.toString() === receivedItem.inventoryId);
      if (orderItem) {
        orderItem.receivedQty = (orderItem.receivedQty || 0) + receivedItem.receivedQty;
        if (orderItem.receivedQty < orderItem.quantity) allReceived = false;
        if (receivedItem.inventoryId) {
          await Inventory.findOneAndUpdate(
            buildFilter(req, { _id: receivedItem.inventoryId }),
            { $inc: { quantity: receivedItem.receivedQty } }
          );
        }
      }
    }
    order.status = allReceived ? 'received' : 'partial';
    order.receivedDate = new Date();
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne(buildFilter(req, { _id: req.params.id }));
    if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    if (!['draft','cancelled'].includes(order.status))
      return res.status(400).json({ success: false, message: 'لا يمكن حذف طلب غير مسودة' });
    await order.deleteOne();
    res.json({ success: true, message: 'تم حذف الطلب' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
