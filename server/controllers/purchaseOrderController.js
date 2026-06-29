const PurchaseOrder = require('../models/PurchaseOrder');
const { getCompany }    = require('../middleware/auth');
const { buildFilter }   = require('../middleware/tenant');
const BL = require('../services/businessLogic');

exports.getPurchaseOrders = async (req, res) => {
  try {
    const extra = {};
    if (req.query.status)   extra.status   = req.query.status;
    if (req.query.supplier) extra.supplier = req.query.supplier;
    const orders = await PurchaseOrder.find(buildFilter(req, extra))
      .populate('supplier','name commercialReg vatNumber phone email paymentTerms')
      .populate('branch','name').populate('warehouse','name')
      .populate('createdBy','name').sort({ createdAt:-1 });
    res.json({ success:true, count:orders.length, data:orders });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne(buildFilter(req,{ _id:req.params.id }))
      .populate('supplier','name commercialReg vatNumber phone email address bankName bankIBAN')
      .populate('branch','name').populate('warehouse','name')
      .populate('items.inventory','name sku unit').populate('createdBy','name');
    if (!order) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    res.json({ success:true, data:order });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    const { items=[], ...rest } = req.body;

    let subtotal=0, taxAmount=0;
    const processedItems = items.map(it => {
      const lineTotal = +(it.quantity||it.qty||0) * +(it.unitPrice||0);
      const lineTax   = lineTotal * (+(it.taxRate||15)/100);
      subtotal += lineTotal; taxAmount += lineTax;
      return { ...it, quantity: it.quantity||it.qty, total: lineTotal+lineTax };
    });

    const count = await PurchaseOrder.countDocuments({ company:co }) + 1;
    const order = await PurchaseOrder.create({
      ...rest, company:co,
      items: processedItems, subtotal, taxAmount,
      total: subtotal+taxAmount, totalAmount: subtotal+taxAmount,
      orderNumber: `PO-${new Date().getFullYear()}-${String(count).padStart(5,'0')}`,
      createdBy: req.user._id,
    });

    // Update supplier balance
    if (rest.supplier) {
      await BL.updatePartyBalance({ model:'Supplier', id:rest.supplier, amount:subtotal+taxAmount, direction:'credit' });
    }

    res.status(201).json({ success:true, data:order });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate(
      buildFilter(req,{ _id:req.params.id }), req.body,
      { new:true, runValidators:true }
    );
    if (!order) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    res.json({ success:true, data:order });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

// Receive PO items → update inventory + stock movement
exports.receivePurchaseOrder = async (req, res) => {
  try {
    const co    = getCompany(req);
    const order = await PurchaseOrder.findOne(buildFilter(req,{ _id:req.params.id }));
    if (!order) return res.status(404).json({ success:false, message:'الطلب غير موجود' });

    const { items=[] } = req.body;
    let allReceived = true;

    for (const received of items) {
      const orderItem = order.items.find(i =>
        i.inventory?.toString() === received.inventoryId
      );
      if (!orderItem) continue;
      orderItem.receivedQty = (orderItem.receivedQty||0) + (+received.receivedQty||0);
      if (orderItem.receivedQty < orderItem.quantity) allReceived = false;
    }

    order.status      = allReceived ? 'received' : 'partial';
    order.receivedDate= new Date();
    await order.save();

    // Trigger: stock in for each received item
    await BL.receiveStock({
      company:         co,
      purchaseOrderId: order._id,
      userId:          req.user._id,
      items: items.map(r => ({
        inventoryId: r.inventoryId,
        qty:         +r.receivedQty,
        unitCost:    order.items.find(i=>i.inventory?.toString()===r.inventoryId)?.unitPrice || 0,
      })),
    });

    res.json({ success:true, data:order, message:'تم تسجيل الاستلام وتحديث المخزون' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndDelete(buildFilter(req,{ _id:req.params.id }));
    if (!order) return res.status(404).json({ success:false, message:'الطلب غير موجود' });
    res.json({ success:true, message:'تم الحذف' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};
