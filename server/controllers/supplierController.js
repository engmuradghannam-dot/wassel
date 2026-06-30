const Supplier    = require('../models/Supplier');
const { getCompany } = require('../middleware/auth');

exports.getSuppliers = async (req, res) => {
  try {
    const co = getCompany(req);
    if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة' });
    
    const filter = { company: co };
    if (req.query.search) {
      const q = new RegExp(req.query.search, 'i');
      filter.$or = [{ name:q },{ nameEn:q },{ email:q },{ phone:q },{ code:q }];
    }
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    
    const suppliers = await Supplier.find(filter).sort({ createdAt:-1 });
    res.json({ success:true, count:suppliers.length, data:suppliers });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.getSupplier = async (req, res) => {
  try {
    const co = getCompany(req);
    const supplier = await Supplier.findOne({ _id:req.params.id, company:co });
    if (!supplier) return res.status(404).json({ success:false, message:'المورد غير موجود' });
    res.json({ success:true, data:supplier });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};

exports.createSupplier = async (req, res) => {
  const co = getCompany(req);
  if (!co) return res.status(400).json({ success:false, message:'الحساب غير مرتبط بشركة. يرجى التحقق من تسجيل الدخول' });

  const body = { ...req.body };
  if (!body.rating || body.rating < 1) delete body.rating;

  const MAX_RETRIES = 5;
  let lastErr = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const code = body.code?.trim() ||
        `SUP-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random()*100)}`;

      const supplier = await Supplier.create({
        ...body,
        company:   co,
        code,
        createdBy: req.user._id
      });
      return res.status(201).json({ success:true, data:supplier });
    } catch (err) {
      lastErr = err;
      if (err.code === 11000 && Object.keys(err.keyPattern||{}).includes('code')) {
        continue;
      }
      console.error('createSupplier error:', err.message, '| body:', JSON.stringify(body));
      return res.status(400).json({ success:false, message:err.message, detail:err.message, code:err.code||null });
    }
  }
  res.status(400).json({ success:false, message:'فشل إنشاء المورد بعد عدة محاولات: '+(lastErr?.message||''), detail:lastErr?.message });
};

exports.updateSupplier = async (req, res) => {
  try {
    const co = getCompany(req);
    const updateBody = { ...req.body };
    if (!updateBody.rating || updateBody.rating < 1) delete updateBody.rating;
    
    const supplier = await Supplier.findOneAndUpdate(
      { _id:req.params.id, company:co },
      updateBody,
      { new:true, runValidators:true }
    );
    if (!supplier) return res.status(404).json({ success:false, message:'المورد غير موجود' });
    res.json({ success:true, data:supplier });
  } catch (err) { res.status(400).json({ success:false, message:err.message }); }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const co = getCompany(req);
    const supplier = await Supplier.findOneAndDelete({ _id:req.params.id, company:co });
    if (!supplier) return res.status(404).json({ success:false, message:'المورد غير موجود' });
    res.json({ success:true, message:'تم حذف المورد' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
};
