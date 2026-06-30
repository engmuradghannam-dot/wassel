const mongoose = require('mongoose');

/**
 * Email — نظام بريد داخلي كامل (Outlook-like)
 * يدعم: صندوق وارد، مرسل، مسودات، أرشيف، سلة محذوفات، نجمة (مهم)
 * المستلمون يمكن أن يكونوا: مستخدمين داخل النظام (internalTo) أو
 * عناوين بريد خارجية حقيقية (externalTo) عبر SMTP لاحقاً.
 */
const emailSchema = new mongoose.Schema({
  // ── الشركة (للعزل بين الشركات، لكن تسمح بالمراسلة بين شركات مختلفة) ──
  company:     { type: mongoose.Schema.Types.ObjectId, ref:'Company', index:true },

  // ── المرسل ───────────────────────────────────────────────────────────
  from:        { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true, index:true },
  fromEmail:   { type: String, required:true },   // البريد الداخلي للمرسل وقت الإرسال (snapshot)
  fromName:    { type: String },

  // ── المستلمون الداخليون (مستخدمو النظام) ────────────────────────────
  to:          [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }],
  cc:          [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }],
  bcc:         [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }],

  // ── المستلمون الخارجيون (عناوين بريد حقيقية خارج النظام) ─────────────
  externalTo:  [{ type: String }],
  externalCc:  [{ type: String }],

  // ── المحتوى ──────────────────────────────────────────────────────────
  subject:     { type: String, default:'(بدون عنوان)' },
  body:        { type: String, default:'' },        // HTML أو نص عادي
  attachments: [{
    name: String, url: String, size: Number, mimeType: String,
  }],

  // ── سلسلة المحادثة (Thread) ──────────────────────────────────────────
  threadId:    { type: mongoose.Schema.Types.ObjectId }, // يساوي _id أول رسالة بالسلسلة (مفهرس أدناه)
  inReplyTo:   { type: mongoose.Schema.Types.ObjectId, ref:'Email' },
  isForward:   { type: Boolean, default:false },

  // ── حالة الإرسال ─────────────────────────────────────────────────────
  status:      { type: String, enum:['draft','sent','failed'], default:'draft' },
  sentAt:      { type: Date },

  // ── حالة خاصة بكل مستلم (قراءة/حذف/أرشفة لكل مستخدم على حدة) ────────
  // كل مستلم له نسخة منطقية مستقلة من حالة الرسالة في صندوقه
  recipientStates: [{
    user:       { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    folder:     { type: String, enum:['inbox','archive','trash'], default:'inbox' },
    isRead:     { type: Boolean, default:false },
    isStarred:  { type: Boolean, default:false },
    readAt:     { type: Date },
  }],

  // ── حالة المرسل نفسه (صندوق المرسل / المسودات / المحذوفات) ──────────
  senderFolder: { type: String, enum:['sent','draft','trash'], default:'draft' },
  senderStarred:{ type: Boolean, default:false },

  priority:    { type: String, enum:['low','normal','high'], default:'normal' },
  isExternal:  { type: Boolean, default:false }, // true لو فيها مستلم خارجي واحد على الأقل

}, { timestamps:true });

emailSchema.index({ company:1, from:1, senderFolder:1, createdAt:-1 });
emailSchema.index({ 'recipientStates.user':1, 'recipientStates.folder':1, createdAt:-1 });
emailSchema.index({ threadId:1 });
emailSchema.index({ subject:'text', body:'text' });

module.exports = mongoose.model('Email', emailSchema);
