const Supplier = require('../models/Supplier');

const getCompany = (req) => req.user?.company?.toString() || req.company;

exports.getSuppliers = async (req, res) => {
  try {
    const co = getCompany(req);
    const filter = { company: co };
    if (req.query.search) {
      const q = new RegExp(req.query.search,'i');
      filter.$or = [{ name:q },{ nameEn:q },{ email:q },{ phone:q },{ code:q }];
    }
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const suppliers = await Supplier.find(filter).sort({ name:1 });
    res.json({ success:true, count:suppliers.length, data:suppliers });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id:req.params.id, company:getCompany(req) });
    if (!supplier) return res.status(404).json({ success:false, message:'المورد غير موجود' });
    res.json({ success:true, data:supplier });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.createSupplier = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    
    // Auto-generate supplier code
    const count = await Supplier.countDocuments({ company:co });
    const code  = req.body.code || `SUP-${String(count+1).padStart(4,'0')}`;
    
    const supplier = await Supplier.create({
      ...req.body,
      company: co,
      code,
      createdBy: req.user._id
    });
    res.status(201).json({ success:true, data:supplier });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id:req.params.id, company:getCompany(req) },
      req.body,
      { new:true, runValidators:true }
    );
    if (!supplier) return res.status(404).json({ success:false, message:'المورد غير موجود' });
    res.json({ success:true, data:supplier });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id:req.params.id, company:getCompany(req) });
    if (!supplier) return res.status(404).json({ success:false, message:'المورد غير موجود' });
    res.json({ success:true, message:'تم حذف المورد' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};
