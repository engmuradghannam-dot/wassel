const mongoose = require('mongoose');

/**
 * Leave — طلبات الإجازات مع مسار اعتماد بسيط (مدير مباشر → موارد بشرية)
 * مبني على نفس روح PurchaseRequest (طلب → اعتماد → سجل) لكن مبسّط لأن
 * الإجازات لا تحتاج عادة أكثر من خطوة أو خطوتين اعتماد.
 */
const leaveSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  employee:    { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },

  type: {
    type: String,
    enum: ['annual','sick','unpaid','maternity','paternity','hajj','emergency','bereavement','other'],
    default: 'annual'
  },

  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  days:        { type: Number },          // محسوبة تلقائياً
  reason:      { type: String },

  status: {
    type: String,
    enum: ['pending','approved','rejected','cancelled'],
    default: 'pending'
  },

  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approvedAt:  { type: Date },
  rejectionReason: { type: String },

  attachments: [{ name:String, url:String, uploadedAt:{ type:Date, default:Date.now } }],

  // ── رصيد الإجازات وقت تقديم الطلب (snapshot للتدقيق) ─────────────────
  balanceBefore: { type: Number },
  balanceAfter:  { type: Number },

  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

leaveSchema.index({ company:1, employee:1, status:1 });
leaveSchema.index({ company:1, startDate:1, endDate:1 });

leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    this.days = Math.max(1, Math.ceil((this.endDate - this.startDate) / 86400000) + 1);
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
