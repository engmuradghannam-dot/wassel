# Google Authentication Setup Guide

## ⚠️ خطأ: "فشل تسجيل الدخول عبر Google"

## الحل:

### 1. إنشاء مشروع في Google Cloud Console
1. اذهب إلى: https://console.cloud.google.com/
2. أنشئ مشروع جديد أو استخدم المشروع الحالي
3. فعّل Google+ API

### 2. إنشاء OAuth 2.0 Credentials
1. اذهب إلى: APIs & Services > Credentials
2. اضغط "Create Credentials" > "OAuth 2.0 Client ID"
3. اختر "Web application"
4. أضف Authorized redirect URIs:
   - http://localhost:3000/auth/google/callback
   - http://localhost:5000/api/auth/google/callback
5. انسخ Client ID و Client Secret

### 3. إضافة المتغيرات في .env
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### 4. تفعيل Google Sign-In في Firebase (إذا كنت تستخدم Firebase)
1. اذهب إلى: https://console.firebase.google.com
2. اختر مشروعك
3. اذهب إلى Authentication > Sign-in method
4. فعّل "Google"
5. أضف نطاقاتك المعتمدة (Authorized domains)
