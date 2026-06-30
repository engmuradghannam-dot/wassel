import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor - add auth token + fix Content-Type for file uploads
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // ── إصلاح حرج: الـ Content-Type الثابت أعلاه (application/json) لا
    // يُستبدَل تلقائياً عند إرسال FormData (رفع ملفات). تحققتُ من هذا
    // فعلياً عبر اختبار مباشر للسلوك الحقيقي لـ axios، وليس بالاعتماد
    // على افتراض سابق غير مُختبَر. النتيجة: أي رفع ملف كان يصل للسيرفر
    // بترويسة Content-Type: application/json رغم أن الجسم الفعلي
    // multipart/form-data، فيفشل Multer في قراءة الملف بصمت (req.file
    // يبقى undefined). الحل: حذف Content-Type كلياً من الطلب عندما تكون
    // البيانات FormData، ليضبطه المتصفح بنفسه تلقائياً مع قيمة boundary
    // الصحيحة — وهي قيمة لا يمكن ضبطها يدوياً بشكل صحيح أصلاً.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
