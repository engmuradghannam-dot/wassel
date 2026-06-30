/**
 * mailService — إرسال بريد فعلي لعناوين خارجية حقيقية عبر SMTP
 *
 * ⚠️ يتطلب تفعيله إضافة متغيرات البيئة التالية في Render:
 *   SMTP_HOST       (مثال: smtp.gmail.com)
 *   SMTP_PORT       (مثال: 587)
 *   SMTP_USER       (بريد Gmail الحقيقي المخصص للنظام)
 *   SMTP_PASS       (App Password وليس كلمة مرور الحساب العادية)
 *
 * بدون هذه المتغيرات، الإرسال الخارجي يُتجاهل بهدوء (الرسالة الداخلية
 * تبقى محفوظة في صندوق المرسل، لكن لن تصل فعلياً لأي بريد خارج النظام).
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // غير مُفعَّل — لا بيانات اعتماد
  }
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendExternalEmail({ to=[], cc=[], subject, html, fromName, attachments=[] }) {
  const t = getTransporter();
  if (!t) {
    throw new Error('الإرسال الخارجي غير مُفعَّل — لم يتم ضبط بيانات اعتماد SMTP بعد');
  }
  if (!to.length) return null;

  return t.sendMail({
    from: `"${fromName} (عبر Wassel ERP)" <${process.env.SMTP_USER}>`,
    to: to.join(','),
    cc: cc.join(',') || undefined,
    subject,
    html,
    attachments: attachments.map(a => ({ filename: a.name, path: a.url })),
  });
}

module.exports = { sendExternalEmail, getTransporter };
