import api from '../services/api';

/**
 * openAuthenticatedFile — يفتح/يحمّل ملفًا محميًا (PDF، مرفق، تقرير) في تبويب جديد.
 * ─────────────────────────────────────────────────────────────────────
 * لماذا هذا الملف موجود:
 * كل مسارات تحميل الملفات في الباك اند (PDF أوامر الشراء، تصدير التقارير،
 * تنزيل المرفقات عبر /api/files/:id) محمية بـ `protect` وتتطلب رأس
 * Authorization: Bearer <token>. رابط <a href="..."> عادي هو مجرد تنقل
 * متصفح عادي — لا يرسل هذا الرأس أبدًا، فيرجع السيرفر 401 دائمًا مهما
 * كان المستخدم مسجّل دخول. الحل: تحميل الملف عبر axios (الذي يرفق
 * التوكن تلقائيًا بفضل الـ interceptor في services/api.js) كـ Blob،
 * ثم فتحه من الذاكرة في تبويب جديد.
 */
export async function openAuthenticatedFile(url, { filename, download = false } = {}) {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);

  if (download) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }

  // يحرر الذاكرة بعد فترة كافية لفتح/تحميل الملف
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
}
