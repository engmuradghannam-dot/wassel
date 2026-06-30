const Payment = require('../models/Payment');
const { getCompany } = require('../middleware/auth');

const Company = require('../models/Company');

const PLAN_PRICES = {
  starter:      { monthly: 99,  annual: 990  },
  professional: { monthly: 299, annual: 2990 },
  enterprise:   { monthly: 799, annual: 7990 }
};

const PLAN_LIMITS = {
  starter:      { maxUsers: 15,   maxEmployees: 200,  maxBranches: 3  },
  professional: { maxUsers: 50,   maxEmployees: 1000, maxBranches: 10 },
  enterprise:   { maxUsers: 9999, maxEmployees: 9999, maxBranches: 999 }
};

// ─── Get pricing plans ────────────────────────────────────
exports.getPlans = async (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'trial', name: 'تجريبي', nameEn: 'Trial',
        price: { monthly: 0, annual: 0 }, currency: 'SAR',
        duration: 30, durationUnit: 'day',
        limits: { maxUsers: 5, maxEmployees: 50, maxBranches: 1 },
        features: ['5 مستخدمين', '50 موظف', 'فرع واحد', 'جميع الوحدات الأساسية'],
        badge: null
      },
      {
        id: 'starter', name: 'أساسي', nameEn: 'Starter',
        price: PLAN_PRICES.starter, currency: 'SAR',
        limits: PLAN_LIMITS.starter,
        features: ['15 مستخدم', '200 موظف', '3 فروع', 'دعم فني', 'تقارير متقدمة'],
        badge: null
      },
      {
        id: 'professional', name: 'احترافي', nameEn: 'Professional',
        price: PLAN_PRICES.professional, currency: 'SAR',
        limits: PLAN_LIMITS.professional,
        features: ['50 مستخدم', '1000 موظف', '10 فروع', 'أولوية الدعم', 'API مخصص', 'تقارير مالية كاملة'],
        badge: 'الأكثر شعبية'
      },
      {
        id: 'enterprise', name: 'مؤسسي', nameEn: 'Enterprise',
        price: PLAN_PRICES.enterprise, currency: 'SAR',
        limits: PLAN_LIMITS.enterprise,
        features: ['مستخدمون غير محدودين', 'موظفون غير محدودين', 'فروع غير محدودة', 'مدير حساب مخصص', 'SLA مضمون', 'تخصيص كامل'],
        badge: 'للمؤسسات'
      }
    ]
  });
};

// ─── Initiate payment ─────────────────────────────────────
exports.initiatePayment = async (req, res) => {
  try {
    const { plan, billing = 'annual', method = 'card', gateway = 'moyasar' } = req.body;

    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ success: false, message: 'خطة غير صالحة' });
    }

    const isAnnual    = billing === 'annual';
    const amount      = isAnnual ? PLAN_PRICES[plan].annual : PLAN_PRICES[plan].monthly;
    const taxAmount   = parseFloat((amount * 0.15).toFixed(2));
    const totalAmount = parseFloat((amount + taxAmount).toFixed(2));
    const durationMonths = isAnnual ? 12 : 1;

    const periodStart = new Date();
    const periodEnd   = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

    const payment = await Payment.create({
      company:        getCompany(req),
      amount, taxAmount, totalAmount, currency: 'SAR',
      plan, durationMonths, periodStart, periodEnd,
      method, gateway, status: 'pending',
      paidBy: req.user.id
    });

    // ── Moyasar integration (placeholder — add your keys) ──
    let gatewayUrl = null;
    if (gateway === 'moyasar') {
      // When you add MOYASAR_API_KEY to .env, uncomment:
      // const moyasar = require('moyasar');
      // const response = await moyasar.Payment.create({ amount: totalAmount * 100, currency: 'SAR', ... });
      // gatewayUrl = response.source.transaction_url;
      gatewayUrl = `/payment/checkout/${payment._id}`; // internal checkout page
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء طلب الدفع',
      data: {
        paymentId:    payment._id,
        invoiceNumber:payment.invoiceNumber,
        amount, taxAmount, totalAmount,
        currency: 'SAR',
        plan, billing, durationMonths,
        periodStart, periodEnd,
        gatewayUrl,
        status: 'pending'
      }
    });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// ─── Gateway callback (Moyasar/Stripe webhook) ─────────────
exports.paymentCallback = async (req, res) => {
  try {
    const { paymentId, status, gatewayRef, gatewayData } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'الدفعة غير موجودة' });

    if (status === 'paid' || status === 'initiated') {
      payment.status     = 'paid';
      payment.gatewayRef = gatewayRef;
      payment.gatewayData= gatewayData;
      await payment.save();

      // Activate company plan
      await Company.findByIdAndUpdate(payment.company, {
        plan:           payment.plan,
        planExpiresAt:  payment.periodEnd,
        isActive:       true,
        isSuspended:    false,
        ...PLAN_LIMITS[payment.plan]
      });

      return res.json({ success: true, message: 'تم تفعيل الاشتراك بنجاح', data: payment });
    }

    if (status === 'failed' || status === 'canceled') {
      payment.status = status === 'failed' ? 'failed' : 'cancelled';
      await payment.save();
      return res.json({ success: false, message: 'فشلت عملية الدفع' });
    }

    res.json({ success: true, message: 'تم استلام التحديث' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Manual activate (superadmin) ────────────────────────────
exports.manualActivate = async (req, res) => {
  try {
    const { companyId, plan, durationMonths = 12, amount = 0 } = req.body;
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ success: false, message: 'الشركة غير موجودة' });

    const periodStart = new Date();
    const periodEnd   = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

    const payment = await Payment.create({
      company: companyId,
      amount, taxAmount: 0, totalAmount: amount,
      plan, durationMonths, periodStart, periodEnd,
      method: 'bank_transfer', gateway: 'manual',
      status: 'paid', processedBy: req.user.id
    });

    await Company.findByIdAndUpdate(companyId, {
      plan, planExpiresAt: periodEnd,
      isActive: true, isSuspended: false,
      ...PLAN_LIMITS[plan]
    });

    res.json({ success: true, message: `تم تفعيل خطة ${plan} للشركة ${company.name}`, data: payment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// ─── Get my payments ──────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ company: getCompany(req) })
      .populate('paidBy','name').sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── All payments (superadmin) ────────────────────────────────
exports.getAllPayments = async (req, res) => {
  try {
    const { status, plan, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (plan)   filter.plan   = plan;
    if (from || to) { filter.createdAt = {}; if (from) filter.createdAt.$gte = new Date(from); if (to) filter.createdAt.$lte = new Date(to); }

    const [payments, stats] = await Promise.all([
      Payment.find(filter).populate('company','name').populate('paidBy','name').sort({ createdAt: -1 }).limit(100),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({ success: true, count: payments.length, stats: stats[0] || {}, data: payments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Refund ───────────────────────────────────────────────────
exports.refundPayment = async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'الدفعة غير موجودة' });
    if (payment.status !== 'paid') return res.status(400).json({ success: false, message: 'لا يمكن استرداد هذه الدفعة' });

    payment.status       = 'refunded';
    payment.refundedAt   = new Date();
    payment.refundAmount = payment.totalAmount;
    payment.refundReason = reason;
    await payment.save();

    // Revert company to trial
    await Company.findByIdAndUpdate(payment.company, {
      plan: 'trial', planExpiresAt: new Date(Date.now() + 30 * 86400000),
      maxUsers: 5, maxEmployees: 50, maxBranches: 1
    });

    res.json({ success: true, message: 'تم استرداد المبلغ وإلغاء الاشتراك', data: payment });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
