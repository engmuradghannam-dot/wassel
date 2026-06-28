const PurchaseOrder = require('../models/PurchaseOrder');
const Inventory = require('../models/Inventory');

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { status, supplier } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (supplier) filter.supplier = supplier;

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name email phone')
      .populate('branch', 'name')
      .populate('warehouse', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name email phone address')
      .populate('branch', 'name')
      .populate('warehouse', 'name')
      .populate('items.inventory', 'name sku unit')
      .populate('createdBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { items, ...rest } = req.body;
    let subtotal = 0;
    let taxAmount = 0;

    const processedItems = items.map(item => {
      const total = item.quantity * item.unitPrice;
      const tax = (total * (item.taxRate || 15)) / 100;
      subtotal += total;
      taxAmount += tax;
      return { ...item, total };
    });

    const order = await PurchaseOrder.create({
      ...rest,
      items: processedItems,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.receivePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { items } = req.body; // { inventoryId, receivedQty }
    let allReceived = true;

    for (const receivedItem of items) {
      const orderItem = order.items.find(i => i.inventory?.toString() === receivedItem.inventoryId);
      if (orderItem) {
        orderItem.receivedQty = (orderItem.receivedQty || 0) + receivedItem.receivedQty;
        if (orderItem.receivedQty < orderItem.quantity) allReceived = false;

        // Update inventory quantity
        if (receivedItem.inventoryId) {
          await Inventory.findByIdAndUpdate(receivedItem.inventoryId, {
            $inc: { quantity: receivedItem.receivedQty }
          });
        }
      }
    }

    order.status = allReceived ? 'received' : 'partial';
    order.receivedDate = new Date();
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['draft', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete non-draft orders' });
    }
    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
