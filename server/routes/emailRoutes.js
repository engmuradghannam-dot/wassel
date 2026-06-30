const express  = require('express');
const router   = express.Router();
const { protect, getCompany } = require('../middleware/auth');
const Email    = require('../models/Email');
const EmailContact = require('../models/EmailContact');
const User     = require('../models/User');

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/mail/contacts — دفتر العناوين: كل موظفي الشركة + جهات خارجية محفوظة
// ═══════════════════════════════════════════════════════════════════════════
router.get('/contacts', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    const [internalUsers, externalContacts] = await Promise.all([
      User.find({ company: co, isActive: true, _id: { $ne: req.user._id } })
        .select('name email avatar isOnline').sort({ name: 1 }),
      EmailContact.find({ owner: req.user._id }).sort({ name: 1 }),
    ]);
    res.json({
      success: true,
      data: {
        internal: internalUsers.map(u => ({ _id:u._id, name:u.name, email:u.email, avatar:u.avatar, isOnline:u.isOnline, type:'internal' })),
        external: externalContacts.map(c => ({ _id:c._id, name:c.name, email:c.email, company:c.company, type:'external' })),
      }
    });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// إضافة جهة اتصال خارجية لدفتر العناوين
router.post('/contacts', protect, async (req, res) => {
  try {
    const { name, email, company, notes } = req.body;
    if (!name || !email) return res.status(400).json({ success:false, message:'الاسم والبريد مطلوبان' });
    const contact = await EmailContact.findOneAndUpdate(
      { owner: req.user._id, email: email.toLowerCase().trim() },
      { name, email: email.toLowerCase().trim(), company, notes },
      { upsert:true, new:true }
    );
    res.status(201).json({ success:true, data:contact });
  } catch (e) { res.status(400).json({ success:false, message:e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/mail/:folder — صندوق الوارد / المرسل / المسودات / المؤرشف / المحذوفات
// folder: inbox | sent | drafts | starred | archive | trash
// ═══════════════════════════════════════════════════════════════════════════
router.get('/folder/:folder', protect, async (req, res) => {
  try {
    const { folder } = req.params;
    const { search, page=1, limit=30 } = req.query;
    const skip = (page-1) * limit;
    const userId = req.user._id;

    let filter = {};
    let isRecipientView = false;

    if (folder === 'sent') {
      filter = { from: userId, senderFolder: 'sent' };
    } else if (folder === 'drafts') {
      filter = { from: userId, senderFolder: 'draft' };
    } else if (folder === 'trash') {
      // رسائل أرسلتها وحذفتها، أو رسائل استلمتها وحذفتها
      filter = {
        $or: [
          { from: userId, senderFolder: 'trash' },
          { recipientStates: { $elemMatch: { user: userId, folder: 'trash' } } }
        ]
      };
    } else if (folder === 'starred') {
      filter = {
        status: 'sent',
        $or: [
          { from: userId, senderStarred: true },
          { recipientStates: { $elemMatch: { user: userId, isStarred: true } } }
        ]
      };
    } else if (folder === 'archive') {
      filter = { recipientStates: { $elemMatch: { user: userId, folder: 'archive' } } };
      isRecipientView = true;
    } else {
      // inbox (default)
      filter = { recipientStates: { $elemMatch: { user: userId, folder: 'inbox' } }, status: 'sent' };
      isRecipientView = true;
    }

    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [
        { subject: new RegExp(search, 'i') },
        { body: new RegExp(search, 'i') },
        { fromName: new RegExp(search, 'i') },
      ]});
    }

    const [emails, total] = await Promise.all([
      Email.find(filter)
        .populate('from', 'name email avatar')
        .populate('to', 'name email avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(+limit),
      Email.countDocuments(filter),
    ]);

    // إرفاق حالة القراءة/النجمة الخاصة بهذا المستخدم لكل رسالة
    const enriched = emails.map(e => {
      const obj = e.toObject();
      const myState = e.recipientStates?.find(s => s.user?.toString() === userId.toString());
      obj.isRead    = folder === 'sent' || folder === 'drafts' ? true : (myState?.isRead || false);
      obj.isStarred = e.from?._id?.toString() === userId.toString() ? e.senderStarred : (myState?.isStarred || false);
      delete obj.recipientStates; // لا داعي لإرسال حالات بقية المستلمين
      return obj;
    });

    res.json({ success:true, count:enriched.length, total, data:enriched });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// عدد الرسائل غير المقروءة (لشارة الإشعار في القائمة الجانبية)
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Email.countDocuments({
      status: 'sent',
      recipientStates: { $elemMatch: { user: req.user._id, folder: 'inbox', isRead: false } }
    });
    res.json({ success:true, count });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/mail/:id — فتح رسالة واحدة (مع كامل السلسلة/Thread)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const email = await Email.findById(req.params.id)
      .populate('from', 'name email avatar')
      .populate('to', 'name email avatar')
      .populate('cc', 'name email avatar');
    if (!email) return res.status(404).json({ success:false, message:'الرسالة غير موجودة' });

    const isOwner = email.from._id.toString() === userId.toString();
    const isRecipient = email.recipientStates?.some(s => s.user?.toString() === userId.toString());
    if (!isOwner && !isRecipient) return res.status(403).json({ success:false, message:'لا تملك صلاحية عرض هذه الرسالة' });

    // تحديد كمقروءة عند الفتح (لو كنت المستلم)
    if (isRecipient && !isOwner) {
      await Email.updateOne(
        { _id:email._id, 'recipientStates.user':userId },
        { $set:{ 'recipientStates.$.isRead':true, 'recipientStates.$.readAt':new Date() } }
      );
    }

    // جلب باقي رسائل نفس السلسلة (Thread)
    const threadId = email.threadId || email._id;
    const thread = await Email.find({ threadId, status:'sent' })
      .populate('from','name email avatar')
      .sort({ createdAt:1 });

    res.json({ success:true, data: email, thread });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/mail — إرسال رسالة جديدة (أو حفظ كمسودة)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/', protect, async (req, res) => {
  try {
    const co = getCompany(req);
    const {
      to=[], cc=[], bcc=[], externalTo=[], externalCc=[],
      subject, body, attachments=[], asDraft=false,
      inReplyTo, isForward=false, priority='normal', draftId
    } = req.body;

    if (!asDraft && to.length===0 && externalTo.length===0) {
      return res.status(400).json({ success:false, message:'يجب تحديد مستلم واحد على الأقل' });
    }

    const recipientStates = to.map(uid => ({ user: uid, folder:'inbox', isRead:false, isStarred:false }));

    const payload = {
      company: co,
      from: req.user._id, fromEmail: req.user.email, fromName: req.user.name,
      to, cc, bcc, externalTo, externalCc,
      subject: subject || '(بدون عنوان)', body: body || '',
      attachments, priority,
      inReplyTo: inReplyTo || undefined,
      isForward,
      isExternal: externalTo.length > 0 || externalCc.length > 0,
      status: asDraft ? 'draft' : 'sent',
      senderFolder: asDraft ? 'draft' : 'sent',
      sentAt: asDraft ? undefined : new Date(),
      recipientStates: asDraft ? [] : recipientStates,
    };

    // ربط السلسلة (Thread): لو رد على رسالة، نفس threadId؛ غير ذلك رسالة جديدة تبدأ سلسلة جديدة
    if (inReplyTo) {
      const original = await Email.findById(inReplyTo);
      payload.threadId = original?.threadId || original?._id;
    }

    let email;
    if (draftId) {
      // تحديث مسودة موجودة (سواء بقيت مسودة أو أُرسلت الآن)
      email = await Email.findOneAndUpdate(
        { _id: draftId, from: req.user._id },
        payload, { new: true }
      );
      if (!email) return res.status(404).json({ success:false, message:'المسودة غير موجودة' });
    } else {
      email = await Email.create(payload);
      if (!inReplyTo) {
        email.threadId = email._id;
        await email.save();
      }
    }

    // ── إرسال فعلي خارجي عبر SMTP (إن كان مُفعّلاً) ──────────────────────
    if (!asDraft && payload.isExternal) {
      try {
        const { sendExternalEmail } = require('../services/mailService');
        await sendExternalEmail({
          to: externalTo, cc: externalCc,
          subject: payload.subject, html: payload.body,
          fromName: payload.fromName, attachments,
        });
      } catch (smtpErr) {
        console.warn('External SMTP send failed (internal copy still saved):', smtpErr.message);
        // لا نفشل الطلب — الرسالة الداخلية محفوظة بنجاح حتى لو فشل الإرسال الخارجي
      }
    }

    res.status(201).json({ success:true, data: email, message: asDraft ? 'تم حفظ المسودة' : 'تم إرسال الرسالة' });
  } catch (e) { res.status(400).json({ success:false, message:e.message, detail:e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/mail/:id/star — تبديل حالة النجمة (مهم)
// ═══════════════════════════════════════════════════════════════════════════
router.put('/:id/star', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success:false, message:'غير موجودة' });

    if (email.from.toString() === userId.toString()) {
      email.senderStarred = !email.senderStarred;
      await email.save();
      return res.json({ success:true, isStarred: email.senderStarred });
    }
    const idx = email.recipientStates.findIndex(s => s.user.toString() === userId.toString());
    if (idx === -1) return res.status(403).json({ success:false, message:'غير مصرح' });
    email.recipientStates[idx].isStarred = !email.recipientStates[idx].isStarred;
    await email.save();
    res.json({ success:true, isStarred: email.recipientStates[idx].isStarred });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/mail/:id/move — نقل بين المجلدات (أرشفة / حذف / استرجاع)
// body: { folder: 'inbox'|'archive'|'trash' }
// ═══════════════════════════════════════════════════════════════════════════
router.put('/:id/move', protect, async (req, res) => {
  try {
    const { folder } = req.body;
    const userId = req.user._id;
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success:false, message:'غير موجودة' });

    if (email.from.toString() === userId.toString() && email.senderFolder !== 'draft') {
      email.senderFolder = folder === 'trash' ? 'trash' : 'sent';
      await email.save();
      return res.json({ success:true, data:email });
    }

    const idx = email.recipientStates.findIndex(s => s.user.toString() === userId.toString());
    if (idx === -1) return res.status(403).json({ success:false, message:'غير مصرح' });
    email.recipientStates[idx].folder = folder;
    await email.save();
    res.json({ success:true, data:email });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

// حذف نهائي (من سلة المحذوفات فقط)
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const email = await Email.findById(req.params.id);
    if (!email) return res.status(404).json({ success:false, message:'غير موجودة' });

    const isOwner = email.from.toString() === userId.toString();
    const myStateIdx = email.recipientStates.findIndex(s => s.user.toString() === userId.toString());

    if (isOwner && myStateIdx === -1) {
      // لا أحد غيري يملك نسخة من الرسالة → احذفها نهائياً
      await Email.findByIdAndDelete(email._id);
    } else if (isOwner) {
      email.senderFolder = undefined; // إزالة نسخة المرسل فقط
      await email.save();
    } else if (myStateIdx !== -1) {
      email.recipientStates.splice(myStateIdx, 1);
      await email.save();
    }
    res.json({ success:true, message:'تم الحذف نهائياً' });
  } catch (e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
