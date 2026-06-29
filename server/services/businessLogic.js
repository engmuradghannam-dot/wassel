/**
 * WasselERP Business Logic Service
 * Central place for all cross-model business rules and triggers.
 */

const Inventory    = require('../models/Inventory');
const StockMovement= require('../models/StockMovement');
const SalesOrder   = require('../models/SalesOrder');
const PurchaseOrder= require('../models/PurchaseOrder');

// 1. STOCK IN — when PO received
exports.receiveStock = async ({ company, purchaseOrderId, items, userId }) => {
  const movements = [];
  for (const { inventoryId, name, qty, unitCost } of items) {
    if (!inventoryId || !qty) continue;
    const inv = await Inventory.findOneAndUpdate(
      { _id: inventoryId, company },
      { $inc: { quantity: qty } },
      { new: true }
    );
    movements.push(await StockMovement.create({
      company, type: 'purchase_in',
      inventory: inventoryId, purchaseOrder: purchaseOrderId,
      toWarehouse: inv?.warehouse || null,
      quantity: qty, unitCost: unitCost || 0,
      totalCost: (unitCost||0)*qty,
      quantityBefore: (inv?.quantity||0)-qty, quantityAfter: inv?.quantity||0,
      createdBy: userId,
    }));
  }
  return movements;
};

// 2. STOCK OUT — when Sales Order delivered
exports.shipStock = async ({ company, salesOrderId, items, userId }) => {
  const movements = []; const errors = [];
  for (const { inventoryId, qty } of items) {
    if (!inventoryId || !qty) continue;
    const inv = await Inventory.findOne({ _id: inventoryId, company });
    if (!inv) continue;
    if (inv.quantity < qty) { errors.push(`${inv.name}: مخزون غير كافٍ (${inv.quantity} < ${qty})`); continue; }
    await Inventory.findByIdAndUpdate(inventoryId, { $inc: { quantity: -qty } });
    movements.push(await StockMovement.create({
      company, type: 'sale_out',
      inventory: inventoryId, salesOrder: salesOrderId,
      fromWarehouse: inv.warehouse || null,
      quantity: qty, unitCost: inv.costPrice||0, totalCost: (inv.costPrice||0)*qty,
      quantityBefore: inv.quantity, quantityAfter: inv.quantity-qty,
      createdBy: userId,
    }));
  }
  if (errors.length) throw new Error(errors.join(' | '));
  return movements;
};

// 3. UPDATE payment status on SalesOrder
exports.updateSalesPaymentStatus = async (salesOrderId, paidAmount) => {
  const order = await SalesOrder.findById(salesOrderId);
  if (!order) return;
  const totalPaid = (order.paidAmount||0) + paidAmount;
  const status = totalPaid >= order.total ? 'paid'
    : totalPaid > 0 ? 'partial'
    : (order.dueDate && new Date() > order.dueDate) ? 'overdue' : 'unpaid';
  await SalesOrder.findByIdAndUpdate(salesOrderId, {
    $inc: { paidAmount }, paymentStatus: status,
    remainingAmount: Math.max(0, order.total - totalPaid),
  });
};

// 4. UPDATE payment status on PurchaseOrder
exports.updatePurchasePaymentStatus = async (purchaseOrderId, paidAmount) => {
  const order = await PurchaseOrder.findById(purchaseOrderId);
  if (!order) return;
  const totalPaid = (order.paidAmount||0) + paidAmount;
  const total = order.total || order.totalAmount || 0;
  await PurchaseOrder.findByIdAndUpdate(purchaseOrderId, {
    $inc: { paidAmount },
    paymentStatus: totalPaid >= total ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
  });
};

// 5. Update customer/supplier running balance
exports.updatePartyBalance = async ({ model, id, amount, direction }) => {
  // direction: 'debit' = owes us more, 'credit' = we owe them more
  const Model = require('../models/' + model);
  const inc = direction === 'debit' ? amount : -amount;
  await Model.findByIdAndUpdate(id, { $inc: { balance: inc } });
};
