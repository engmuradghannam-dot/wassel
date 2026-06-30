/**
 * middleware/fileStorage.js
 * ───────────────────────────────────────────────────────────────────────
 * تخزين ملفات دائم باستخدام MongoDB GridFS — لا يحتاج أي خدمة خارجية
 * أو بيانات اعتماد إضافية، يستخدم نفس MONGODB_URI الموجود فعلاً.
 *
 * لماذا GridFS وليس القرص المحلي (uploads/)؟
 * Render يستخدم نظام ملفات مؤقت (ephemeral) ما لم يُفعَّل قرص دائم
 * صراحةً — أي ملف يُرفع على القرص المحلي يُفقد عند أي إعادة نشر أو
 * إعادة تشغيل تلقائية للخادم. GridFS يخزّن الملف داخل MongoDB نفسه،
 * فيبقى دائماً بقاء البيانات الأخرى تماماً.
 *
 * يقبل: PDF, Word, Excel, الصور, وأي نوع ملف عام — بحد أقصى 15MB.
 * (الحد الأقصى أعلى من نسخة الشعار القديمة 5MB لأن فواتير/عروض الأسعار
 * قد تحتوي صفحات متعددة أو صوراً عالية الدقة).
 */

const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

// تخزين مؤقت في الذاكرة فقط أثناء معالجة الطلب، ثم يُكتب إلى GridFS مباشرة
const memoryStorage = multer.memoryStorage();

const ALLOWED_MIME = [
  // مستندات
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  // صور
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('نوع الملف غير مدعوم. المسموح: PDF, Word, Excel, CSV, صور (JPG/PNG/GIF/WEBP)'), false);
};

const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

/**
 * getBucket — يُرجع GridFSBucket متصل بنفس قاعدة البيانات الحالية.
 * يُستدعى عند الحاجة فقط (lazy) لأن الاتصال قد لا يكون جاهزاً وقت
 * تحميل الملف — نفس درس "lazy init" الذي طبّقناه على Groq سابقاً.
 */
function getBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('قاعدة البيانات غير متصلة بعد — حاول مرة أخرى بعد لحظات');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'wasselFiles' });
}

/**
 * saveFileToGridFS — يكتب ملفاً (من الذاكرة بعد multer) إلى GridFS
 * ويُرجع معرّف الملف + رابط التنزيل النسبي.
 *
 * @param {Object} file       - req.file من multer (memoryStorage)
 * @param {Object} metadata   - بيانات إضافية تُحفظ مع الملف (company, uploadedBy, module, recordId)
 * @returns {Promise<{fileId, filename, url, size, mimeType}>}
 */
function saveFileToGridFS(file, metadata = {}) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getBucket();
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
      const ext = path.extname(file.originalname);
      const storedName = `${uniqueSuffix}${ext}`;

      const uploadStream = bucket.openUploadStream(storedName, {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          ...metadata,
          uploadedAt: new Date(),
        },
      });

      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        resolve({
          fileId: uploadStream.id.toString(),
          filename: file.originalname,
          url: `/api/files/${uploadStream.id.toString()}`,
          size: file.size,
          mimeType: file.mimetype,
        });
      });

      uploadStream.end(file.buffer);
    } catch (err) { reject(err); }
  });
}

module.exports = { upload, getBucket, saveFileToGridFS, ALLOWED_MIME };
