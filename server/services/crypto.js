const crypto = require('crypto');

/**
 * services/crypto.js — تشفير/فك تشفير أسرار حساسة تُخزَّن في قاعدة البيانات
 * (مثل مفتاح Claude API الخاص بكل مستخدم).
 * ─────────────────────────────────────────────────────────────────────
 * لماذا لا نخزّنه كنص عادي؟
 * مفتاح API الخاص بالمستخدم هو بيانات حساسة بنفس درجة كلمة المرور —
 * تسريب قاعدة البيانات (نسخة احتياطية مسربة، وصول غير مصرح به) لا يجب
 * أن يكشف مفاتيح API لأي مستخدم. نستخدم AES-256-GCM (تشفير متماثل مع
 * توثيق سلامة البيانات) بمفتاح مشتق من ENCRYPTION_KEY في متغيرات البيئة.
 *
 * ENCRYPTION_KEY غير مضبوطة؟ نتراجع تلقائياً لاشتقاق من JWT_SECRET حتى لا
 * ينهار أي شيء — لكن يُفضّل ضبط ENCRYPTION_KEY صراحة على Render لاحقاً.
 */
const RAW_KEY = process.env.ENCRYPTION_KEY
  || process.env.JWT_SECRET
  || 'wassel-erp-secret-key-min-32-chars';

// نشتق مفتاح 32 بايت ثابت الطول من أي نص عبر SHA-256، بغض النظر عن طول
// المصدر — AES-256 يتطلب مفتاحاً بالضبط 32 بايت.
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

function encrypt(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12); // GCM القياسي: 12 بايت
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // نخزّن iv + authTag + النص المشفّر معاً كسلسلة واحدة base64 مفصولة بـ ':'
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(payload) {
  if (!payload) return null;
  try {
    const [ivB64, tagB64, dataB64] = payload.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null; // بيانات تالفة أو مفتاح تشفير تغيّر — نتعامل معها كأنها غير موجودة
  }
}

// آخر 4 خانات فقط للعرض في الواجهة — يؤكد للمستخدم أن المفتاح محفوظ
// بدون كشف المفتاح كاملاً في أي استجابة API على الإطلاق
function maskKey(plainText) {
  if (!plainText || plainText.length < 8) return '••••••••';
  return `${plainText.slice(0, 7)}••••${plainText.slice(-4)}`;
}

module.exports = { encrypt, decrypt, maskKey };
