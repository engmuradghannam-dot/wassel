/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sector-based Organizational Structure — مبني على دراسات HR واقعية
 * ═══════════════════════════════════════════════════════════════════════════
 * المصدر المنهجي: هيكلة كل قطاع تتبع نموذج SHRM التقليدي للشركات الصغيرة
 * والمتوسطة (SME org design): إدارة عليا → رؤساء أقسام وظيفية → تنفيذيون.
 *
 * كل قطاع يحصل على:
 *  - positions[]: المسمى (عربي/إنجليزي)، القسم، المستوى الهرمي (1=الأعلى)،
 *    حد اعتماد طلبات الشراء (PR)، نطاق راتب تقريبي شهري بالريال السعودي،
 *    وما إذا كان هذا المنصب يُمنح حساب دخول للنظام افتراضياً.
 *  - reportsTo: index المنصب الذي يرفع له تقريره داخل نفس المصفوفة
 *    (null = الأعلى/المدير العام، يرفع لصاحب الشركة مباشرة)
 *
 * هذه مناصب مقترحة (template) — المستخدم الحقيقي يُعدّلها لاحقاً بحرية.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ── دوال مساعدة لتوليد رواتب نسبية بالريال السعودي حسب المستوى الهرمي ──────
const SALARY_BY_LEVEL = {
  1: [12000, 22000],   // مدير عام / مدير تنفيذي
  2: [8000, 14000],    // مدير قسم / نائب مدير
  3: [5500, 9000],     // رئيس قسم / مشرف أول
  4: [4000, 6500],     // أخصائي / موظف أول
  5: [3200, 5000],     // موظف تنفيذي
};

const APPROVAL_BY_LEVEL = {
  1: 100000, // مدير عام: اعتماد غير محدود تقريباً
  2: 30000,
  3: 10000,
  4: 3000,
  5: 0,      // لا يملك صلاحية اعتماد PR، فقط تقديم طلب
};

// ─────────────────────────────────────────────────────────────────────────
// المجموعة المشتركة (Shared Back-Office) — تُضاف لكل قطاع تقريباً
// محاسبة، موارد بشرية، مشتريات عامة، عمليات
// ─────────────────────────────────────────────────────────────────────────
const SHARED_BACKOFFICE = [
  { posAr:'المدير العام',          posEn:'General Manager',        dept:'الإدارة العليا',     level:1, reportsTo:null, hasLogin:true },
  { posAr:'مدير الموارد البشرية',  posEn:'HR Manager',             dept:'الموارد البشرية',    level:2, reportsTo:0,    hasLogin:true },
  { posAr:'مدير الحسابات والمالية',posEn:'Finance Manager',        dept:'المالية',            level:2, reportsTo:0,    hasLogin:true },
  { posAr:'محاسب',                 posEn:'Accountant',             dept:'المالية',            level:4, reportsTo:2,    hasLogin:true },
  { posAr:'مسؤول مشتريات',         posEn:'Purchasing Officer',     dept:'المشتريات',          level:3, reportsTo:0,    hasLogin:true },
  { posAr:'أخصائي موارد بشرية',    posEn:'HR Specialist',          dept:'الموارد البشرية',    level:4, reportsTo:1,    hasLogin:true },
];

// ═══════════════════════════════════════════════════════════════════════════
// خريطة المناصب لكل 69 قطاعاً — مبنية على البنية التشغيلية الفعلية لكل نشاط
// ═══════════════════════════════════════════════════════════════════════════
const SECTOR_POSITIONS = {

  // ── التجارة ────────────────────────────────────────────────────────────
  trading_general: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المبيعات',        posEn:'Sales Manager',        dept:'المبيعات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مندوب مبيعات',         posEn:'Sales Representative', dept:'المبيعات', level:5, reportsTo:6, hasLogin:true },
    { posAr:'أمين مستودع',          posEn:'Warehouse Keeper',     dept:'المستودعات', level:4, reportsTo:0, hasLogin:true },
  ],
  retail: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المتجر',          posEn:'Store Manager',        dept:'المبيعات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'كاشير',                posEn:'Cashier',              dept:'المبيعات', level:5, reportsTo:6, hasLogin:true },
    { posAr:'بائع',                 posEn:'Sales Associate',      dept:'المبيعات', level:5, reportsTo:6, hasLogin:true },
  ],
  wholesale: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المبيعات بالجملة',posEn:'Wholesale Sales Mgr',  dept:'المبيعات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'منسق لوجستي',          posEn:'Logistics Coordinator',dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
    { posAr:'أمين مستودع',          posEn:'Warehouse Keeper',     dept:'المستودعات', level:4, reportsTo:0, hasLogin:true },
  ],
  ecommerce: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المتجر الإلكتروني',posEn:'E-Commerce Manager',  dept:'التسويق الرقمي', level:2, reportsTo:0, hasLogin:true },
    { posAr:'أخصائي تسويق رقمي',    posEn:'Digital Marketing Specialist', dept:'التسويق', level:4, reportsTo:6, hasLogin:true },
    { posAr:'منسق طلبات وشحن',      posEn:'Fulfillment Coordinator', dept:'العمليات', level:4, reportsTo:0, hasLogin:true },
  ],

  // ── الضيافة والغذاء ────────────────────────────────────────────────────
  restaurant: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المطعم',          posEn:'Restaurant Manager',   dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'شيف تنفيذي',           posEn:'Executive Chef',       dept:'المطبخ',   level:2, reportsTo:0, hasLogin:true },
    { posAr:'طباخ',                 posEn:'Cook',                 dept:'المطبخ',   level:5, reportsTo:7, hasLogin:false },
    { posAr:'نادل / كابتن صالة',    posEn:'Waiter / Captain',     dept:'الصالة',   level:5, reportsTo:6, hasLogin:true },
    { posAr:'كاشير',                posEn:'Cashier',              dept:'الصالة',   level:5, reportsTo:6, hasLogin:true },
  ],
  cafe: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الفرع',           posEn:'Branch Manager',       dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'باريستا أول',          posEn:'Head Barista',         dept:'التحضير',  level:4, reportsTo:6, hasLogin:true },
    { posAr:'باريستا',              posEn:'Barista',              dept:'التحضير',  level:5, reportsTo:7, hasLogin:false },
  ],
  catering: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير تشغيل الفعاليات', posEn:'Catering Ops Manager', dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'شيف تنفيذي',           posEn:'Executive Chef',       dept:'المطبخ',   level:2, reportsTo:0, hasLogin:true },
    { posAr:'منسق فعاليات',         posEn:'Event Coordinator',    dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
  ],
  hotel: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الفندق',          posEn:'Hotel Manager',        dept:'الإدارة',   level:1, reportsTo:null, hasLogin:true },
    { posAr:'مدير الاستقبال',       posEn:'Front Office Manager', dept:'الاستقبال', level:2, reportsTo:6, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال', level:5, reportsTo:7, hasLogin:true },
    { posAr:'مشرف التدبير المنزلي', posEn:'Housekeeping Supervisor', dept:'التدبير المنزلي', level:3, reportsTo:6, hasLogin:true },
  ],
  furnished_apartments: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الشقق المفروشة',  posEn:'Property Manager',     dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'موظف استقبال وحجوزات', posEn:'Reservations Agent',   dept:'الحجوزات', level:4, reportsTo:6, hasLogin:true },
  ],

  // ── الصحة والطب ────────────────────────────────────────────────────────
  hospital: [
    { posAr:'المدير الطبي',         posEn:'Medical Director',     dept:'الإدارة الطبية', level:1, reportsTo:null, hasLogin:true },
    { posAr:'المدير الإداري',       posEn:'Administrative Director', dept:'الإدارة', level:1, reportsTo:null, hasLogin:true },
    { posAr:'مدير التمريض',         posEn:'Nursing Director',     dept:'التمريض',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدير الموارد البشرية', posEn:'HR Manager',           dept:'الموارد البشرية', level:2, reportsTo:1, hasLogin:true },
    { posAr:'مدير الحسابات والمالية',posEn:'Finance Manager',     dept:'المالية',  level:2, reportsTo:1, hasLogin:true },
    { posAr:'مسؤول مشتريات طبية',   posEn:'Medical Procurement Officer', dept:'المشتريات', level:3, reportsTo:1, hasLogin:true },
    { posAr:'استشاري',              posEn:'Consultant Physician', dept:'الطبي',    level:2, reportsTo:0, hasLogin:true },
    { posAr:'طبيب عام',             posEn:'General Practitioner', dept:'الطبي',    level:3, reportsTo:6, hasLogin:true },
    { posAr:'رئيسة تمريض',          posEn:'Head Nurse',           dept:'التمريض',  level:3, reportsTo:2, hasLogin:true },
    { posAr:'ممرض/ممرضة',           posEn:'Nurse',                dept:'التمريض',  level:5, reportsTo:8, hasLogin:true },
    { posAr:'فني مختبر',            posEn:'Lab Technician',       dept:'المختبر',  level:4, reportsTo:0, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:1, hasLogin:true },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:4, hasLogin:true },
  ],
  polyclinic: [
    { posAr:'المدير الطبي',         posEn:'Medical Director',     dept:'الإدارة الطبية', level:1, reportsTo:null, hasLogin:true },
    { posAr:'مدير العمليات',        posEn:'Operations Manager',   dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'طبيب عام',             posEn:'General Practitioner', dept:'الطبي',    level:3, reportsTo:0, hasLogin:true },
    { posAr:'طبيب أسنان',           posEn:'Dentist',              dept:'الطبي',    level:3, reportsTo:0, hasLogin:true },
    { posAr:'ممرض/ممرضة',           posEn:'Nurse',                dept:'التمريض',  level:5, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:1, hasLogin:true },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:1, hasLogin:true },
  ],
  clinic: [
    { posAr:'مدير العيادة',         posEn:'Clinic Manager',       dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'طبيب أخصائي',          posEn:'Specialist Physician', dept:'الطبي',    level:2, reportsTo:0, hasLogin:true },
    { posAr:'ممرض/ممرضة',           posEn:'Nurse',                dept:'التمريض',  level:4, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:0, hasLogin:true },
  ],
  dental: [
    { posAr:'مدير العيادة',         posEn:'Clinic Manager',       dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'طبيب أسنان أول',       posEn:'Senior Dentist',       dept:'الطبي',    level:2, reportsTo:0, hasLogin:true },
    { posAr:'طبيب أسنان',           posEn:'Dentist',              dept:'الطبي',    level:3, reportsTo:1, hasLogin:true },
    { posAr:'مساعد طبيب أسنان',     posEn:'Dental Assistant',     dept:'الطبي',    level:5, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],
  pharmacy: [
    { posAr:'مدير الصيدلية',        posEn:'Pharmacy Manager',     dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'صيدلي مسؤول',          posEn:'Responsible Pharmacist', dept:'الصيدلة', level:2, reportsTo:0, hasLogin:true },
    { posAr:'صيدلي',                posEn:'Pharmacist',           dept:'الصيدلة',  level:4, reportsTo:1, hasLogin:true },
    { posAr:'فني صيدلة',            posEn:'Pharmacy Technician',  dept:'الصيدلة',  level:5, reportsTo:1, hasLogin:true },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:0, hasLogin:true },
  ],
  medical_lab: [
    { posAr:'مدير المختبر',         posEn:'Lab Director',         dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'استشاري باثولوجي',     posEn:'Consultant Pathologist', dept:'الفني',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'فني مختبر أول',        posEn:'Senior Lab Technician',dept:'الفني',    level:3, reportsTo:1, hasLogin:true },
    { posAr:'فني مختبر',            posEn:'Lab Technician',       dept:'الفني',    level:5, reportsTo:2, hasLogin:true },
    { posAr:'موظف استقبال عينات',   posEn:'Sample Reception Clerk', dept:'الاستقبال', level:5, reportsTo:0, hasLogin:true },
  ],
  radiology: [
    { posAr:'مدير مركز الأشعة',     posEn:'Radiology Center Manager', dept:'الإدارة', level:1, reportsTo:null, hasLogin:true },
    { posAr:'استشاري أشعة',         posEn:'Consultant Radiologist',dept:'الطبي',   level:2, reportsTo:0, hasLogin:true },
    { posAr:'فني أشعة',             posEn:'Radiology Technician', dept:'الفني',    level:4, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],
  physiotherapy: [
    { posAr:'مدير المركز',          posEn:'Center Manager',       dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'أخصائي علاج طبيعي أول',posEn:'Senior Physiotherapist',dept:'العلاج', level:2, reportsTo:0, hasLogin:true },
    { posAr:'أخصائي علاج طبيعي',    posEn:'Physiotherapist',      dept:'العلاج',   level:4, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],
  optometry: [
    { posAr:'مدير المحل',           posEn:'Store Manager',        dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'أخصائي بصريات',        posEn:'Optometrist',          dept:'الفني',    level:3, reportsTo:0, hasLogin:true },
    { posAr:'بائع',                 posEn:'Sales Associate',      dept:'المبيعات', level:5, reportsTo:0, hasLogin:true },
  ],
  veterinary: [
    { posAr:'مدير العيادة البيطرية',posEn:'Veterinary Clinic Manager', dept:'الإدارة', level:1, reportsTo:null, hasLogin:true },
    { posAr:'طبيب بيطري',           posEn:'Veterinarian',         dept:'الطبي',    level:2, reportsTo:0, hasLogin:true },
    { posAr:'مساعد بيطري',          posEn:'Vet Assistant',        dept:'الطبي',    level:5, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],

  // ── التعليم ─────────────────────────────────────────────────────────────
  university: [
    { posAr:'رئيس الجامعة',         posEn:'University President', dept:'الإدارة العليا', level:1, reportsTo:null, hasLogin:true },
    { posAr:'عميد الكلية',          posEn:'Dean',                 dept:'الشؤون الأكاديمية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدير الموارد البشرية', posEn:'HR Manager',           dept:'الموارد البشرية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدير الحسابات والمالية',posEn:'Finance Manager',     dept:'المالية',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'أستاذ مشارك',          posEn:'Associate Professor',  dept:'التدريس',  level:3, reportsTo:1, hasLogin:true },
    { posAr:'محاضر',                posEn:'Lecturer',             dept:'التدريس',  level:4, reportsTo:1, hasLogin:true },
    { posAr:'مسؤول قبول وتسجيل',    posEn:'Admissions Officer',   dept:'القبول والتسجيل', level:4, reportsTo:0, hasLogin:true },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:3, hasLogin:true },
  ],
  school: [
    { posAr:'مدير المدرسة',         posEn:'School Principal',     dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'وكيل/مساعد مدير',      posEn:'Vice Principal',       dept:'الإدارة',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدير الموارد البشرية', posEn:'HR Manager',           dept:'الموارد البشرية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'محاسب المدرسة',        posEn:'School Accountant',    dept:'المالية',  level:4, reportsTo:0, hasLogin:true },
    { posAr:'معلم أول',             posEn:'Head Teacher',         dept:'التدريس',  level:3, reportsTo:1, hasLogin:true },
    { posAr:'معلم',                 posEn:'Teacher',              dept:'التدريس',  level:4, reportsTo:4, hasLogin:true },
    { posAr:'مرشد طلابي',           posEn:'Student Counselor',    dept:'الشؤون الطلابية', level:4, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال',         posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],
  kindergarten: [
    { posAr:'مديرة الروضة',         posEn:'Kindergarten Director',dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'مشرفة تربوية',         posEn:'Education Supervisor', dept:'الشؤون التربوية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'معلمة روضة',           posEn:'Kindergarten Teacher', dept:'التدريس',  level:4, reportsTo:1, hasLogin:true },
    { posAr:'مساعدة معلمة',         posEn:'Teacher Assistant',    dept:'التدريس',  level:5, reportsTo:2, hasLogin:false },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:0, hasLogin:true },
  ],
  training_center: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير التدريب',         posEn:'Training Director',    dept:'البرامج التدريبية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدرب',                 posEn:'Trainer',              dept:'البرامج التدريبية', level:4, reportsTo:6, hasLogin:true },
    { posAr:'منسق برامج',           posEn:'Programs Coordinator', dept:'البرامج التدريبية', level:4, reportsTo:6, hasLogin:true },
  ],
  language_institute: [
    ...SHARED_BACKOFFICE,
    { posAr:'المدير الأكاديمي',     posEn:'Academic Director',    dept:'الشؤون الأكاديمية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدرس لغة',             posEn:'Language Teacher',     dept:'التدريس',  level:4, reportsTo:6, hasLogin:true },
  ],
  driving_school: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المدرسة',         posEn:'School Director',      dept:'الإدارة',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدرب قيادة',           posEn:'Driving Instructor',   dept:'التدريب',  level:4, reportsTo:6, hasLogin:true },
  ],
  quran_institute: [
    { posAr:'مدير المعهد',          posEn:'Institute Director',   dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'مشرف تحفيظ',           posEn:'Memorization Supervisor', dept:'التحفيظ', level:2, reportsTo:0, hasLogin:true },
    { posAr:'معلم تحفيظ',           posEn:'Quran Teacher',        dept:'التحفيظ',  level:4, reportsTo:1, hasLogin:true },
    { posAr:'محاسب',                posEn:'Accountant',           dept:'المالية',  level:4, reportsTo:0, hasLogin:true },
  ],

  // ── التجميل والعافية ───────────────────────────────────────────────────
  salon_ladies: [
    { posAr:'مديرة الصالون',        posEn:'Salon Manager',        dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'كبيرة الأخصائيات',     posEn:'Senior Stylist',       dept:'الخدمات',  level:3, reportsTo:0, hasLogin:true },
    { posAr:'أخصائية تجميل',        posEn:'Beauty Specialist',    dept:'الخدمات',  level:5, reportsTo:1, hasLogin:true },
    { posAr:'موظفة استقبال',        posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],
  salon_gents: [
    { posAr:'مدير الصالون',         posEn:'Salon Manager',        dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'كبير الحلاقين',        posEn:'Senior Barber',        dept:'الخدمات',  level:3, reportsTo:0, hasLogin:true },
    { posAr:'حلاق',                 posEn:'Barber',               dept:'الخدمات',  level:5, reportsTo:1, hasLogin:true },
  ],
  spa: [
    { posAr:'مديرة السبا',          posEn:'Spa Manager',          dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'أخصائية علاج وتدليك',  posEn:'Massage Therapist',    dept:'الخدمات',  level:4, reportsTo:0, hasLogin:true },
    { posAr:'موظفة استقبال',        posEn:'Receptionist',         dept:'الاستقبال',level:5, reportsTo:0, hasLogin:true },
  ],
  gym: [
    { posAr:'مدير النادي',          posEn:'Gym Manager',          dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'مدرب لياقة أول',       posEn:'Head Fitness Trainer', dept:'التدريب',  level:3, reportsTo:0, hasLogin:true },
    { posAr:'مدرب لياقة',           posEn:'Fitness Trainer',      dept:'التدريب',  level:5, reportsTo:1, hasLogin:true },
    { posAr:'موظف استقبال واشتراكات',posEn:'Membership Receptionist', dept:'الاستقبال', level:5, reportsTo:0, hasLogin:true },
  ],
  medical_spa: [
    { posAr:'مديرة المركز',         posEn:'Center Manager',       dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'طبيبة تجميل',          posEn:'Cosmetic Physician',   dept:'الطبي',    level:2, reportsTo:0, hasLogin:true },
    { posAr:'أخصائية تجميل',        posEn:'Aesthetics Specialist',dept:'الخدمات',  level:4, reportsTo:1, hasLogin:true },
  ],

  // ── الإنشاء والعقارات ──────────────────────────────────────────────────
  construction_general: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المشاريع',        posEn:'Projects Director',    dept:'المشاريع', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس موقع',           posEn:'Site Engineer',        dept:'الهندسة',  level:3, reportsTo:6, hasLogin:true },
    { posAr:'مشرف موقع',            posEn:'Site Supervisor',      dept:'الهندسة',  level:4, reportsTo:7, hasLogin:true },
  ],
  mep: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المشاريع',        posEn:'Projects Director',    dept:'المشاريع', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس MEP',            posEn:'MEP Engineer',         dept:'الهندسة',  level:3, reportsTo:6, hasLogin:true },
    { posAr:'فني كهرباء/سباكة',     posEn:'MEP Technician',       dept:'التنفيذ',  level:5, reportsTo:7, hasLogin:false },
  ],
  interior_design: [
    ...SHARED_BACKOFFICE,
    { posAr:'مديرة التصميم',        posEn:'Design Director',      dept:'التصميم',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مصمم داخلي',           posEn:'Interior Designer',    dept:'التصميم',  level:3, reportsTo:6, hasLogin:true },
  ],
  real_estate: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير التطوير العقاري', posEn:'Development Director', dept:'التطوير',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس مشاريع',         posEn:'Projects Engineer',    dept:'الهندسة',  level:3, reportsTo:6, hasLogin:true },
    { posAr:'مستشار مبيعات عقاري',  posEn:'Real Estate Sales Consultant', dept:'المبيعات', level:4, reportsTo:0, hasLogin:true },
  ],
  property_management: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير إدارة الأملاك',   posEn:'Property Manager',     dept:'إدارة الأملاك', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مسؤول تأجير',          posEn:'Leasing Officer',      dept:'التأجير',  level:4, reportsTo:6, hasLogin:true },
    { posAr:'فني صيانة',            posEn:'Maintenance Technician', dept:'الصيانة',level:5, reportsTo:6, hasLogin:false },
  ],
  real_estate_broker: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الوساطة العقارية',posEn:'Brokerage Manager',    dept:'الوساطة',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'وسيط عقاري',           posEn:'Real Estate Broker',   dept:'الوساطة',  level:4, reportsTo:6, hasLogin:true },
  ],

  // ── النقل واللوجستيك ───────────────────────────────────────────────────
  freight: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير العمليات اللوجستية',posEn:'Logistics Ops Manager', dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مخلص جمركي',           posEn:'Customs Broker',       dept:'الجمارك',  level:4, reportsTo:6, hasLogin:true },
    { posAr:'منسق شحنات',           posEn:'Shipment Coordinator', dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
  ],
  delivery: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير عمليات التوصيل',  posEn:'Delivery Ops Manager', dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'منسق طلبات',           posEn:'Dispatch Coordinator', dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
    { posAr:'سائق توصيل',           posEn:'Delivery Driver',      dept:'التوصيل',  level:5, reportsTo:7, hasLogin:false },
  ],
  warehouse_storage: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المستودعات',      posEn:'Warehouse Manager',    dept:'المستودعات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مشرف مستودع',          posEn:'Warehouse Supervisor', dept:'المستودعات', level:3, reportsTo:6, hasLogin:true },
    { posAr:'عامل مستودع',          posEn:'Warehouse Worker',     dept:'المستودعات', level:5, reportsTo:7, hasLogin:false },
  ],
  transportation: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الأسطول',         posEn:'Fleet Manager',        dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'سائق',                 posEn:'Driver',               dept:'النقل',    level:5, reportsTo:6, hasLogin:false },
  ],

  // ── التصنيع ─────────────────────────────────────────────────────────────
  manufacturing: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المصنع',          posEn:'Plant Manager',        dept:'الإنتاج',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس إنتاج',          posEn:'Production Engineer',  dept:'الإنتاج',  level:3, reportsTo:6, hasLogin:true },
    { posAr:'مراقب جودة',           posEn:'Quality Control Officer', dept:'الجودة',level:4, reportsTo:6, hasLogin:true },
    { posAr:'عامل إنتاج',           posEn:'Production Worker',    dept:'الإنتاج',  level:5, reportsTo:7, hasLogin:false },
  ],
  food_production: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المصنع',          posEn:'Plant Manager',        dept:'الإنتاج',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'مسؤول سلامة غذائية',   posEn:'Food Safety Officer',  dept:'الجودة',   level:4, reportsTo:6, hasLogin:true },
    { posAr:'عامل إنتاج',           posEn:'Production Worker',    dept:'الإنتاج',  level:5, reportsTo:6, hasLogin:false },
  ],

  // ── الخدمات المهنية ────────────────────────────────────────────────────
  consulting: [
    ...SHARED_BACKOFFICE,
    { posAr:'شريك إداري',           posEn:'Managing Partner',     dept:'الاستشارات', level:1, reportsTo:null, hasLogin:true },
    { posAr:'استشاري أول',          posEn:'Senior Consultant',    dept:'الاستشارات', level:3, reportsTo:6, hasLogin:true },
    { posAr:'محلل أعمال',           posEn:'Business Analyst',     dept:'الاستشارات', level:4, reportsTo:7, hasLogin:true },
  ],
  law_firm: [
    ...SHARED_BACKOFFICE,
    { posAr:'الشريك الرئيسي',       posEn:'Managing Partner',     dept:'القانونية', level:1, reportsTo:null, hasLogin:true },
    { posAr:'محامٍ أول',            posEn:'Senior Lawyer',        dept:'القانونية', level:2, reportsTo:6, hasLogin:true },
    { posAr:'محامٍ',                posEn:'Lawyer',               dept:'القانونية', level:3, reportsTo:7, hasLogin:true },
    { posAr:'سكرتير قانوني',        posEn:'Legal Secretary',      dept:'الدعم القانوني', level:5, reportsTo:7, hasLogin:true },
  ],
  accounting_firm: [
    ...SHARED_BACKOFFICE,
    { posAr:'الشريك المؤسس',        posEn:'Founding Partner',     dept:'المحاسبة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'مدقق حسابات أول',      posEn:'Senior Auditor',       dept:'التدقيق',   level:3, reportsTo:6, hasLogin:true },
    { posAr:'محاسب قانوني',         posEn:'Certified Accountant', dept:'المحاسبة',  level:4, reportsTo:6, hasLogin:true },
  ],
  it_company: [
    ...SHARED_BACKOFFICE,
    { posAr:'المدير التقني',        posEn:'CTO',                  dept:'التقنية',   level:1, reportsTo:null, hasLogin:true },
    { posAr:'مدير المشاريع التقنية',posEn:'IT Projects Manager',  dept:'التقنية',   level:2, reportsTo:6, hasLogin:true },
    { posAr:'مطور برمجيات',         posEn:'Software Developer',   dept:'التطوير',   level:4, reportsTo:7, hasLogin:true },
    { posAr:'مهندس دعم فني',        posEn:'Support Engineer',     dept:'الدعم الفني',level:5, reportsTo:6, hasLogin:true },
  ],
  engineering: [
    ...SHARED_BACKOFFICE,
    { posAr:'المدير الهندسي',       posEn:'Engineering Director', dept:'الهندسة',   level:1, reportsTo:null, hasLogin:true },
    { posAr:'مهندس أول',            posEn:'Senior Engineer',      dept:'الهندسة',   level:3, reportsTo:6, hasLogin:true },
    { posAr:'مهندس',                posEn:'Engineer',             dept:'الهندسة',   level:4, reportsTo:7, hasLogin:true },
  ],
  hr_company: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير عمليات الاستقدام',posEn:'Recruitment Ops Manager', dept:'الاستقدام', level:2, reportsTo:0, hasLogin:true },
    { posAr:'أخصائي استقدام',       posEn:'Recruitment Specialist', dept:'الاستقدام', level:4, reportsTo:6, hasLogin:true },
  ],
  security_company: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير عمليات الحراسة',  posEn:'Security Ops Manager', dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مشرف نوبة',            posEn:'Shift Supervisor',     dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
    { posAr:'حارس أمن',             posEn:'Security Guard',       dept:'العمليات', level:5, reportsTo:7, hasLogin:false },
  ],
  cleaning: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير العمليات',        posEn:'Operations Manager',   dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مشرف نظافة',           posEn:'Cleaning Supervisor',  dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
    { posAr:'عامل نظافة',           posEn:'Cleaner',              dept:'العمليات', level:5, reportsTo:7, hasLogin:false },
  ],
  maintenance: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الصيانة',         posEn:'Maintenance Manager',  dept:'الصيانة',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'فني صيانة أول',        posEn:'Senior Technician',    dept:'الصيانة',  level:4, reportsTo:6, hasLogin:true },
    { posAr:'فني صيانة',            posEn:'Technician',           dept:'الصيانة',  level:5, reportsTo:7, hasLogin:false },
  ],
  advertising: [
    ...SHARED_BACKOFFICE,
    { posAr:'المدير الإبداعي',      posEn:'Creative Director',    dept:'الإبداع',   level:2, reportsTo:0, hasLogin:true },
    { posAr:'مصمم جرافيك',          posEn:'Graphic Designer',     dept:'التصميم',   level:4, reportsTo:6, hasLogin:true },
    { posAr:'مدير حسابات العملاء',  posEn:'Account Manager',      dept:'خدمة العملاء',level:3, reportsTo:0, hasLogin:true },
  ],

  // ── المالية والتأمين ───────────────────────────────────────────────────
  exchange: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير فرع الصرافة',     posEn:'Branch Manager',       dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'موظف صرافة',           posEn:'Exchange Teller',      dept:'العمليات', level:5, reportsTo:6, hasLogin:true },
  ],
  insurance: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المطالبات',       posEn:'Claims Manager',       dept:'المطالبات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'وكيل تأمين',           posEn:'Insurance Agent',      dept:'المبيعات', level:4, reportsTo:0, hasLogin:true },
  ],
  investment: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الاستثمار',       posEn:'Investment Manager',   dept:'الاستثمار', level:2, reportsTo:0, hasLogin:true },
    { posAr:'محلل مالي',            posEn:'Financial Analyst',    dept:'التحليل المالي', level:4, reportsTo:6, hasLogin:true },
  ],

  // ── السيارات ───────────────────────────────────────────────────────────
  car_dealership: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المعرض',          posEn:'Showroom Manager',     dept:'المبيعات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مستشار مبيعات سيارات', posEn:'Sales Consultant',     dept:'المبيعات', level:4, reportsTo:6, hasLogin:true },
  ],
  car_workshop: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الورشة',          posEn:'Workshop Manager',     dept:'الصيانة',  level:2, reportsTo:0, hasLogin:true },
    { posAr:'فني ميكانيكي',         posEn:'Mechanic',             dept:'الصيانة',  level:5, reportsTo:6, hasLogin:false },
    { posAr:'مستقبل سيارات',        posEn:'Service Advisor',      dept:'الاستقبال',level:4, reportsTo:6, hasLogin:true },
  ],

  // ── الزراعة والفعاليات ─────────────────────────────────────────────────
  agriculture: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المزرعة',         posEn:'Farm Manager',         dept:'الإنتاج الزراعي', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس زراعي',          posEn:'Agricultural Engineer',dept:'الإنتاج الزراعي', level:3, reportsTo:6, hasLogin:true },
    { posAr:'عامل زراعي',           posEn:'Farm Worker',          dept:'الإنتاج الزراعي', level:5, reportsTo:7, hasLogin:false },
  ],
  events: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الفعاليات',       posEn:'Events Director',      dept:'الفعاليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'منسق فعاليات',         posEn:'Event Coordinator',    dept:'الفعاليات', level:4, reportsTo:6, hasLogin:true },
  ],
  media: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الإنتاج',         posEn:'Production Manager',   dept:'الإنتاج',   level:2, reportsTo:0, hasLogin:true },
    { posAr:'مونتير',               posEn:'Video Editor',         dept:'الإنتاج',   level:4, reportsTo:6, hasLogin:true },
    { posAr:'مصور',                 posEn:'Photographer',         dept:'الإنتاج',   level:4, reportsTo:6, hasLogin:true },
  ],
  sport_club: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير النادي الرياضي',  posEn:'Sports Club Manager',  dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مدرب رياضي',           posEn:'Sports Coach',         dept:'التدريب',  level:4, reportsTo:6, hasLogin:true },
  ],
  amusement: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير المنتزه',         posEn:'Park Manager',         dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مشرف ألعاب',           posEn:'Rides Supervisor',     dept:'العمليات', level:4, reportsTo:6, hasLogin:true },
  ],

  // ── غير ربحي وأخرى ─────────────────────────────────────────────────────
  ngo: [
    ...SHARED_BACKOFFICE,
    { posAr:'المدير التنفيذي',      posEn:'Executive Director',   dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'منسق برامج خيرية',     posEn:'Programs Coordinator', dept:'البرامج',  level:3, reportsTo:0, hasLogin:true },
    { posAr:'مسؤول علاقات متبرعين', posEn:'Donor Relations Officer', dept:'التمويل', level:4, reportsTo:0, hasLogin:true },
  ],
  waqf: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الوقف',           posEn:'Waqf Director',        dept:'الإدارة',  level:1, reportsTo:null, hasLogin:true },
    { posAr:'مسؤول استثمار الوقف',  posEn:'Waqf Investment Officer', dept:'الاستثمار', level:3, reportsTo:0, hasLogin:true },
  ],
  telecom: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير الشبكات',         posEn:'Network Operations Manager', dept:'التقنية', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس اتصالات',        posEn:'Telecom Engineer',     dept:'التقنية',  level:3, reportsTo:6, hasLogin:true },
  ],
  oil_gas: [
    ...SHARED_BACKOFFICE,
    { posAr:'مدير العمليات',        posEn:'Operations Manager',   dept:'العمليات', level:2, reportsTo:0, hasLogin:true },
    { posAr:'مهندس بترول',          posEn:'Petroleum Engineer',   dept:'الهندسة',  level:3, reportsTo:6, hasLogin:true },
    { posAr:'فني عمليات حقل',       posEn:'Field Operations Technician', dept:'العمليات', level:5, reportsTo:6, hasLogin:false },
  ],
  other: [
    ...SHARED_BACKOFFICE,
    { posAr:'مشرف عمليات',          posEn:'Operations Supervisor', dept:'العمليات', level:3, reportsTo:0, hasLogin:true },
    { posAr:'موظف تنفيذي',          posEn:'Operations Staff',     dept:'العمليات',  level:5, reportsTo:6, hasLogin:true },
  ],
};

// ── القطاعات المتبقية التي لم تُذكر صراحة تستخدم نمط "other" + التجارة ──
const FALLBACK_KEYS = [
  'insurance' // already defined above, kept for clarity
];

module.exports = { SECTOR_POSITIONS, SHARED_BACKOFFICE, SALARY_BY_LEVEL, APPROVAL_BY_LEVEL };
