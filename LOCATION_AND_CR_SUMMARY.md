# ✅ تم إضافة تحديد موقع الشركة ورقم السجل التجاري

## 📁 الملفات المحدثة/الجديدة:

### Backend (Server):
1. **server/models/Company.js** - نموذج الشركة (محدث)
   - إضافة حقل `commercialRegistration` (رقم السجل التجاري)
   - إضافة حقل `location` يحتوي على: `lat`, `lng`, `address`

2. **server/controllers/companyController.js** - متحكم الشركة (محدث)
   - `getCompany` - جلب إعدادات الشركة
   - `updateCompany` - تحديث شامل
   - `updateLocation` - تحديث الموقع فقط
   - `uploadLogo` - رفع الشعار

3. **server/routes/companyRoutes.js** - مسارات الشركة (جديد)
   - GET /api/company
   - PUT /api/company
   - PUT /api/company/location
   - POST /api/company/logo

4. **server/middleware/upload.js** - middleware رفع الملفات (جديد)
   - دعم JPEG, PNG, GIF, WebP
   - حد أقصى 5MB

5. **server/server.js** - ملف السيرفر الرئيسي (محدث)

### Frontend (Client):
6. **client/src/components/LocationPicker.jsx** - مكون اختيار الموقع (جديد)
   - خريطة Google Maps تفاعلية
   - بحث عن العنوان مع autocomplete
   - تحديد الموقع بالنقر على الخريطة
   - سحب العلامة (Marker)
   - زر "موقعي الحالي" (GPS)
   - Reverse Geocoding (تحويل الإحداثيات لعنوان)
   - عرض معاينة الخريطة الثابتة

7. **client/src/pages/CompanySettings/CompanySettings.jsx** - صفحة إعدادات الشركة (جديدة)
   - تبويب "عام":
     - رفع شعار الشركة
     - معلومات الشركة (الاسم، البريد، الهاتف، الموقع)
     - معلومات قانونية (الرقم الضريبي + رقم السجل التجاري)
     - اختيار العملة
   - تبويب "إعدادات PDF":
     - حجم الصفحة
     - الهوامش
     - إظهار الشعار/الختم
   - قسم الموقع:
     - حقل العنوان النصي
     - زر "تحديد على الخريطة"
     - عرض الموقع المؤكد مع الإحداثيات
     - معاينة خريطة ثابتة

8. **client/src/i18n/ar.json** - الترجمات العربية (محدثة)
9. **client/src/i18n/en.json** - الترجمات الإنجليزية (محدثة)

## 🗺️ ميزات تحديد الموقع:
- ✅ خريطة Google Maps تفاعلية
- ✅ بحث ذكي مع اقتراحات العناوين (Autocomplete)
- ✅ تحديد الموقع بالنقر على الخريطة
- ✅ سحب العلامة (Draggable Marker)
- ✅ زر "موقعي الحالي" باستخدام GPS
- ✅ تحويل الإحداثيات لعنوان نصي (Reverse Geocoding)
- ✅ عرض معاينة الخريطة الثابتة (Static Map)
- ✅ حفظ الإحداثيات (lat, lng) + العنوان النصي

## 📝 ميزات رقم السجل التجاري:
- ✅ حقل مخصص في إعدادات الشركة
- ✅ حفظ في قاعدة البيانات
- ✅ ظهور في جميع المستندات والتقارير
- ✅ يمكن استخدامه في الفواتير والعقود

## 🔧 الإعدادات المطلوبة:
أضف مفتاح Google Maps API في ملف `.env`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 📦 تثبيت الحزم المطلوبة:
```bash
cd server
npm install multer

cd ../client
npm install @mui/icons-material
```

## 🚀 طريقة الاستخدام:
1. افتح صفحة "إعدادات الشركة" ← /company-settings
2. أدخل رقم السجل التجاري في قسم "المعلومات القانونية"
3. اضغط "تحديد على الخريطة" لاختيار موقع الشركة
4. ابحث عن العنوان أو انقر على الخريطة
5. اضغط "تأكيد" لحفظ الموقع
6. اضغط "حفظ" لحفظ جميع الإعدادات
