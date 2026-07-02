/**
 * config/azDemoData.js — قائمة موظفين تجريبية من A إلى Z (26 موظف)
 * ─────────────────────────────────────────────────────────────────────
 * تغطي كل الأقسام الرئيسية بمسميات وظيفية حقيقية، وبمزيج جنسيات واقعي
 * (أغلبية سعودية + عدد من الجنسيات الأخرى) — يعكس تركيبة نطاقات فعلية
 * بدل قائمة سعوديين فقط، لأن نظام نطاقات أصلاً يقيس هذا المزيج.
 *
 * level: 1=رئيس تنفيذي، 2=مدير قسم، 3=أخصائي/مشرف، 4=موظف تنفيذي
 * managerDept: يُستخدم لربط كل موظف بمديره تلقائياً عند البذر (نفس القسم)
 */
const AZ_EMPLOYEES = [
  { letter:'A', name:'أحمد القحطاني',     nameEn:'Ahmed Al-Qahtani',  position:'الرئيس التنفيذي',        positionEn:'Chief Executive Officer', dept:'الإدارة العليا',   level:1, nationality:'سعودي' },
  { letter:'B', name:'بندر العتيبي',      nameEn:'Bandar Al-Otaibi',  position:'مدير المبيعات',          positionEn:'Sales Manager',           dept:'المبيعات',         level:2, nationality:'سعودي' },
  { letter:'C', name:'كارلوس مندوزا',     nameEn:'Carlos Mendoza',    position:'أخصائي شحن ولوجستيات',   positionEn:'Logistics Specialist',    dept:'اللوجستيات',       level:3, nationality:'الفلبين' },
  { letter:'D', name:'دانة الحربي',       nameEn:'Dana Al-Harbi',     position:'محاسبة أولى',            positionEn:'Senior Accountant',       dept:'المحاسبة',         level:3, nationality:'سعودي' },
  { letter:'E', name:'إيهاب يوسف',        nameEn:'Ehab Youssef',      position:'مهندس أنظمة',            positionEn:'Systems Engineer',        dept:'تقنية المعلومات',  level:3, nationality:'مصري' },
  { letter:'F', name:'فهد الدوسري',       nameEn:'Fahad Al-Dosari',   position:'مدير المشتريات',         positionEn:'Purchasing Manager',      dept:'المشتريات',        level:2, nationality:'سعودي' },
  { letter:'G', name:'غادة الزهراني',     nameEn:'Ghada Al-Zahrani',  position:'أخصائية موارد بشرية',    positionEn:'HR Specialist',           dept:'الموارد البشرية',  level:3, nationality:'سعودي' },
  { letter:'H', name:'حسن العنزي',        nameEn:'Hassan Al-Anazi',   position:'مشرف مستودع',            positionEn:'Warehouse Supervisor',    dept:'المستودعات',       level:3, nationality:'سعودي' },
  { letter:'I', name:'إبراهيم السبيعي',   nameEn:'Ibrahim Al-Subaie', position:'مدير مالي',              positionEn:'Finance Manager',         dept:'المالية',          level:2, nationality:'سعودي' },
  { letter:'J', name:'جمال خان',          nameEn:'Jamal Khan',        position:'سائق شاحنة',             positionEn:'Truck Driver',            dept:'اللوجستيات',       level:4, nationality:'باكستاني' },
  { letter:'K', name:'خالد الغامدي',      nameEn:'Khaled Al-Ghamdi',  position:'مندوب مبيعات',           positionEn:'Sales Representative',    dept:'المبيعات',         level:3, nationality:'سعودي' },
  { letter:'L', name:'ليلى المطيري',      nameEn:'Layla Al-Mutairi',  position:'أخصائية تسويق',          positionEn:'Marketing Specialist',    dept:'التسويق',          level:3, nationality:'سعودي' },
  { letter:'M', name:'ماجد الشهري',       nameEn:'Majed Al-Shehri',   position:'مدير المستودعات',        positionEn:'Warehouse Manager',       dept:'المستودعات',       level:2, nationality:'سعودي' },
  { letter:'N', name:'ناصر الحارثي',      nameEn:'Nasser Al-Harthi',  position:'مراقب جودة',             positionEn:'Quality Controller',      dept:'الجودة',           level:3, nationality:'سعودي' },
  { letter:'O', name:'عمر الرشيدي',       nameEn:'Omar Al-Rashidi',   position:'محلل نظم',               positionEn:'Systems Analyst',         dept:'تقنية المعلومات',  level:3, nationality:'سعودي' },
  { letter:'P', name:'بريا شارما',        nameEn:'Priya Sharma',      position:'محاسبة',                 positionEn:'Accountant',              dept:'المحاسبة',         level:3, nationality:'هندي' },
  { letter:'Q', name:'قصي المالكي',       nameEn:'Qusai Al-Malki',    position:'مشرف مبيعات',            positionEn:'Sales Supervisor',        dept:'المبيعات',         level:3, nationality:'سعودي' },
  { letter:'R', name:'راكان الدوسري',     nameEn:'Rakan Al-Dawsari',  position:'أخصائي شؤون قانونية',    positionEn:'Legal Affairs Specialist',dept:'الشؤون القانونية', level:3, nationality:'سعودي' },
  { letter:'S', name:'سارة العمري',       nameEn:'Sara Al-Amri',      position:'مديرة الموارد البشرية',  positionEn:'HR Manager',              dept:'الموارد البشرية',  level:2, nationality:'سعودي' },
  { letter:'T', name:'طلال الزهراني',     nameEn:'Talal Al-Zahrani',  position:'فني صيانة',              positionEn:'Maintenance Technician',  dept:'الصيانة',          level:4, nationality:'سعودي' },
  { letter:'U', name:'عمر فاروق',         nameEn:'Umar Farooq',       position:'عامل مستودع',            positionEn:'Warehouse Worker',        dept:'المستودعات',       level:4, nationality:'باكستاني' },
  { letter:'V', name:'فيكتور سانتوس',     nameEn:'Victor Santos',     position:'سائق توصيل',             positionEn:'Delivery Driver',         dept:'اللوجستيات',       level:4, nationality:'الفلبين' },
  { letter:'W', name:'وليد القحطاني',     nameEn:'Waleed Al-Qahtani', position:'مدير المشاريع',          positionEn:'Project Manager',         dept:'المشاريع',         level:2, nationality:'سعودي' },
  { letter:'X', name:'شين وانغ',          nameEn:'Xin Wang',          position:'مهندسة جودة',            positionEn:'Quality Engineer',        dept:'الجودة',           level:3, nationality:'صيني' },
  { letter:'Y', name:'يوسف العنزي',       nameEn:'Yousef Al-Enezi',   position:'محلل مالي',              positionEn:'Financial Analyst',       dept:'المالية',          level:3, nationality:'سعودي' },
  { letter:'Z', name:'زياد الحربي',       nameEn:'Ziyad Al-Harbi',    position:'مدير تنفيذي مساعد',      positionEn:'Assistant Executive Manager', dept:'الإدارة العليا', level:2, nationality:'سعودي' },
];

// رواتب تقديرية بالريال السعودي حسب المستوى الهرمي (دراسات سوق عامة)
const SALARY_RANGE_BY_LEVEL = {
  1: [25000, 35000],
  2: [10000, 16000],
  3: [6000, 9000],
  4: [3800, 5500],
};

module.exports = { AZ_EMPLOYEES, SALARY_RANGE_BY_LEVEL };
