/**
 * middleware/fileStorage.js
 * ───────────────────────────────────────────────────────────────────────
 * تخزين ملفات هجين: Cloudinary أولاً (إن توفرت بياناته)، وإلا تراجع
 * تلقائي إلى MongoDB GridFS — بدون أي تغيير على الكود المستهلك (الـ 5
 * ملفات routes التي تستدعي saveFile تبقى كما هي تماماً).
 *
 * لماذا هجين وليس Cloudinary فقط؟
 * لو نُشر هذا الكود قبل ضبط متغيرات بيئة Cloudinary على Render (أو لو
 * نفدت الحصة المجانية لاحقاً)، GridFS يضمن استمرار رفع/تنزيل الملفات
 * بدون أي تعطل — بنفس مبدأ "lazy init / graceful fallback" المُطبَّق
 * سابقاً على Groq AI في هذا المشروع.
 *
 * أيهما يُستخدم فعلياً؟
 *   متغيرات البيئة الثلاثة كلها موجودة (CLOUDINARY_CLOUD_NAME,
 *   CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) → Cloudinary
 *   أي منها ناقص → GridFS (التخزين الافتراضي السابق، لا يحتاج إعداد)
 *
 * يقبل: PDF, Word, Excel, الصور, وأي نوع ملف عام — بحد أقصى 15MB.
 */

const multer = require('multer');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

// تخزين مؤقت في الذاكرة فقط أثناء معالجة الطلب
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

// ── تحديد ما إذا كان Cloudinary مُفعَّلاً فعلياً (lazy، يُفحص عند الاستخدام لا عند تحميل الملف) ──
function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

let _cloudinary = null;
function getCloudinaryClient() {
  if (_cloudinary) return _cloudinary;
  const { v2 } = require('cloudinary');
  v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  _cloudinary = v2;
  return _cloudinary;
}

/**
 * getBucket — GridFSBucket متصل بنفس قاعدة البيانات الحالية (مسار التراجع).
 */
function getBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('قاعدة البيانات غير متصلة بعد — حاول مرة أخرى بعد لحظات');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'wasselFiles' });
}

/**
 * saveFileToCloudinary — يرفع الملف لـ Cloudinary عبر upload_stream.
 * المستندات غير الصورية (PDF/Word/Excel) تُرفع بـ resource_type:'raw'
 * (وإلا يرفض Cloudinary أي ملف ليس صورة أو فيديو ضمن النوع الافتراضي 'image').
 */
function saveFileToCloudinary(file, metadata = {}) {
  return new Promise((resolve, reject) => {
    try {
      const cloudinary = getCloudinaryClient();
      const isImage = file.mimetype.startsWith('image/');
      const folder = `wassel/${metadata.module || 'general'}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: isImage ? 'image' : 'raw',
          public_id: `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
          // اسم الملف الأصلي يُحفظ كـ context وليس كجزء من public_id حتى
          // لا تنكسر الروابط مع أسماء عربية/رموز خاصة
          context: { original_name: file.originalname, ...metadataAsContext(metadata) },
        },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            fileId: result.public_id,
            filename: file.originalname,
            url: result.secure_url, // رابط Cloudinary مباشر — لا يمر عبر سيرفرنا
            size: file.size,
            mimeType: file.mimetype,
            storage: 'cloudinary',
          });
        }
      );
      uploadStream.end(file.buffer);
    } catch (err) { reject(err); }
  });
}

// Cloudinary's context values must be flat strings
function metadataAsContext(metadata = {}) {
  const out = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v === null || v === undefined) continue;
    out[k] = String(v);
  }
  return out;
}

/**
 * saveFileToGridFS — مسار التراجع الأصلي (كما كان، بدون تغيير في السلوك).
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
          storage: 'gridfs',
        });
      });

      uploadStream.end(file.buffer);
    } catch (err) { reject(err); }
  });
}

/**
 * saveFile — نقطة الدخول الموحّدة. كل الـ routes الحالية تستدعي هذه
 * (أو saveFileToGridFS مباشرة للتوافق العكسي — كلاهما يعمل، لكن saveFile
 * هي التي تختار Cloudinary تلقائياً عند توفره).
 */
async function saveFile(file, metadata = {}) {
  if (isCloudinaryConfigured()) {
    try {
      return await saveFileToCloudinary(file, metadata);
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to GridFS:', err.message);
      return saveFileToGridFS(file, metadata);
    }
  }
  return saveFileToGridFS(file, metadata);
}

/**
 * deleteFile — يحذف ملفاً بغض النظر عن مكان تخزينه الفعلي.
 * fileIdOrPublicId: إما ObjectId نصي (GridFS) أو public_id (Cloudinary).
 * storageHint: اختياري، 'cloudinary' أو 'gridfs' — لو غير معروف نحاول GridFS
 * أولاً (لأن صيغة ObjectId واضحة) ثم Cloudinary.
 */
async function deleteFile(fileIdOrPublicId, storageHint) {
  const looksLikeObjectId = /^[a-f0-9]{24}$/i.test(fileIdOrPublicId);

  if (storageHint === 'cloudinary' || (!storageHint && !looksLikeObjectId)) {
    if (isCloudinaryConfigured()) {
      const cloudinary = getCloudinaryClient();
      try {
        await cloudinary.uploader.destroy(fileIdOrPublicId, { resource_type: 'raw' });
      } catch (e) { /* قد يكون resource_type:image — نحاول النوعين بصمت */ }
      try {
        await cloudinary.uploader.destroy(fileIdOrPublicId, { resource_type: 'image' });
      } catch (e) { /* تجاهل */ }
      return;
    }
  }

  if (looksLikeObjectId) {
    const bucket = getBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileIdOrPublicId)).catch(() => {});
  }
}

module.exports = {
  upload,
  getBucket,
  saveFile,
  saveFileToGridFS,      // يبقى مُصدَّراً صراحة للتوافق العكسي مع أي كود يستدعيه مباشرة
  saveFileToCloudinary,
  deleteFile,
  isCloudinaryConfigured,
  ALLOWED_MIME,
};
