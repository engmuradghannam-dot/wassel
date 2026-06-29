/**
 * WasselERP Industry Configuration
 * Based on: Saudi Ministry of Commerce + ISIC Rev.4 International Standard
 * Covers all types recognized in Saudi & GCC commercial registries
 */

const INDUSTRIES = {

  // ══════════════════════════════════════════════════════
  // G. TRADE — التجارة (أكثر أنواع السجلات شيوعاً)
  // ══════════════════════════════════════════════════════
  trading_general: {
    id:'trading_general', group:'trade',
    label:'تجارة عامة', labelEn:'General Trading',
    icon:'🏪', color:'#1a73e8',
    desc:'استيراد وتصدير وبيع بالجملة والتجزئة',
    modules:['inventory','suppliers','customers','sales_orders','purchase_orders','accounting','warehouse','logistics','crm','vat','reports'],
    dashboardType:'trading',
    licenseFields:['commercialReg','vatNumber']
  },
  retail: {
    id:'retail', group:'trade',
    label:'بيع بالتجزئة', labelEn:'Retail',
    icon:'🛍️', color:'#00897b',
    desc:'محلات ومراكز تسوق وبيع مباشر للمستهلك',
    modules:['pos','inventory','customers','sales','suppliers','accounting','vat','reports'],
    dashboardType:'retail',
    licenseFields:['commercialReg','vatNumber']
  },
  wholesale: {
    id:'wholesale', group:'trade',
    label:'بيع بالجملة', labelEn:'Wholesale',
    icon:'📦', color:'#0288d1',
    desc:'توزيع وبيع بالجملة للتجار والشركات',
    modules:['inventory','customers','sales_orders','purchase_orders','suppliers','warehouse','accounting','logistics','reports'],
    dashboardType:'trading',
    licenseFields:['commercialReg','vatNumber']
  },
  ecommerce: {
    id:'ecommerce', group:'trade',
    label:'تجارة إلكترونية', labelEn:'E-Commerce',
    icon:'🛒', color:'#f57c00',
    desc:'متاجر إلكترونية وبيع عبر الإنترنت',
    modules:['products','orders','customers','inventory','shipping','accounting','vat','reports'],
    dashboardType:'ecommerce',
    licenseFields:['commercialReg','vatNumber','freelancePermit']
  },

  // ══════════════════════════════════════════════════════
  // I. FOOD & HOSPITALITY — الضيافة والغذاء
  // ══════════════════════════════════════════════════════
  restaurant: {
    id:'restaurant', group:'hospitality',
    label:'مطعم', labelEn:'Restaurant',
    icon:'🍽️', color:'#e65100',
    desc:'مطاعم وكافيهات وفود ترك ومطابخ سحابية',
    modules:['tables','pos','menu','kitchen_orders','inventory','suppliers','employees','accounting','delivery','vat','reports'],
    dashboardType:'restaurant',
    licenseFields:['commercialReg','healthLicense','municipalityLicense']
  },
  cafe: {
    id:'cafe', group:'hospitality',
    label:'كافيه / مقهى', labelEn:'Café',
    icon:'☕', color:'#795548',
    desc:'مقاهي ومحلات قهوة ومشروبات',
    modules:['pos','menu','inventory','suppliers','employees','accounting','vat','reports'],
    dashboardType:'restaurant',
    licenseFields:['commercialReg','healthLicense']
  },
  catering: {
    id:'catering', group:'hospitality',
    label:'تموين وضيافة', labelEn:'Catering',
    icon:'🍱', color:'#bf360c',
    desc:'خدمات تموين للشركات والمناسبات',
    modules:['events','orders','menu','inventory','suppliers','employees','accounting','vat','reports'],
    dashboardType:'restaurant',
    licenseFields:['commercialReg','healthLicense']
  },
  hotel: {
    id:'hotel', group:'hospitality',
    label:'فندق / فندق شقق', labelEn:'Hotel',
    icon:'🏨', color:'#ff6d00',
    desc:'فنادق وشقق فندقية ومنتجعات وموتيلات',
    modules:['rooms','bookings','housekeeping','pos','restaurant','accounting','hr','crm','reports'],
    dashboardType:'hotel',
    licenseFields:['commercialReg','tourismLicense','starRating']
  },
  furnished_apartments: {
    id:'furnished_apartments', group:'hospitality',
    label:'شقق مفروشة', labelEn:'Furnished Apartments',
    icon:'🏠', color:'#ff8f00',
    desc:'شقق مفروشة للإيجار اليومي والشهري',
    modules:['units','bookings','housekeeping','accounting','crm','reports'],
    dashboardType:'hotel',
    licenseFields:['commercialReg','tourismLicense','municipalityPermit']
  },

  // ══════════════════════════════════════════════════════
  // Q. HEALTH & MEDICAL — الصحة والطب
  // ══════════════════════════════════════════════════════
  hospital: {
    id:'hospital', group:'health',
    label:'مستشفى', labelEn:'Hospital',
    icon:'🏥', color:'#c62828',
    desc:'مستشفيات عامة وتخصصية ومراكز طبية متكاملة',
    modules:['patients','appointments','doctors','nurses','pharmacy','lab','radiology','icu','billing','insurance','hr','accounting','reports'],
    dashboardType:'hospital',
    licenseFields:['healthLicense','mohAccreditation','classification']
  },
  polyclinic: {
    id:'polyclinic', group:'health',
    label:'مستوصف / بولي كلينيك', labelEn:'Polyclinic',
    icon:'🏪', color:'#d32f2f',
    desc:'مستوصفات متخصصة وعيادات متعددة',
    modules:['patients','appointments','doctors','pharmacy','billing','insurance','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','mohApproval']
  },
  clinic: {
    id:'clinic', group:'health',
    label:'عيادة طبية', labelEn:'Medical Clinic',
    icon:'🩺', color:'#e53935',
    desc:'عيادات طبية عامة وتخصصية خاصة',
    modules:['patients','appointments','doctors','billing','pharmacy_basic','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','doctorLicense']
  },
  dental: {
    id:'dental', group:'health',
    label:'عيادة / مركز أسنان', labelEn:'Dental Center',
    icon:'🦷', color:'#1976d2',
    desc:'عيادات وأكاديميات ومراكز تقويم الأسنان',
    modules:['patients','appointments','dental_chart','treatments','xray','billing','lab','accounting','reports'],
    dashboardType:'dental',
    licenseFields:['healthLicense','dentistLicense']
  },
  pharmacy: {
    id:'pharmacy', group:'health',
    label:'صيدلية', labelEn:'Pharmacy',
    icon:'💊', color:'#00897b',
    desc:'صيدليات ومستودعات أدوية وأجهزة طبية',
    modules:['medications','prescriptions','inventory','pos','patients','suppliers','accounting','vat','reports'],
    dashboardType:'pharmacy',
    licenseFields:['pharmacyLicense','pharmacistLicense','mohPermit']
  },
  medical_lab: {
    id:'medical_lab', group:'health',
    label:'مختبر طبي', labelEn:'Medical Laboratory',
    icon:'🔬', color:'#6a1b9a',
    desc:'مختبرات تحاليل طبية وبنوك دم',
    modules:['patients','tests','results','billing','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','labAccreditation']
  },
  radiology: {
    id:'radiology', group:'health',
    label:'مركز أشعة', labelEn:'Radiology Center',
    icon:'🩻', color:'#4527a0',
    desc:'مراكز أشعة وتصوير طبي ومسح ذري',
    modules:['patients','appointments','imaging','billing','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','radiologyLicense']
  },
  physiotherapy: {
    id:'physiotherapy', group:'health',
    label:'علاج طبيعي / تأهيل', labelEn:'Physiotherapy',
    icon:'🏃', color:'#2e7d32',
    desc:'مراكز علاج طبيعي وإعادة تأهيل',
    modules:['patients','appointments','sessions','billing','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','therapistLicense']
  },
  optometry: {
    id:'optometry', group:'health',
    label:'مركز بصريات', labelEn:'Optometry Center',
    icon:'👓', color:'#0277bd',
    desc:'مراكز قياس وبيع نظارات وعدسات',
    modules:['patients','appointments','products','pos','inventory','billing','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','optometristLicense']
  },
  veterinary: {
    id:'veterinary', group:'health',
    label:'عيادة بيطرية', labelEn:'Veterinary Clinic',
    icon:'🐾', color:'#558b2f',
    desc:'عيادات ومستشفيات بيطرية ورعاية حيوانات',
    modules:['patients','appointments','pharmacy','billing','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['vetLicense','maaLicense']
  },

  // ══════════════════════════════════════════════════════
  // P. EDUCATION — التعليم
  // ══════════════════════════════════════════════════════
  university: {
    id:'university', group:'education',
    label:'جامعة / كلية', labelEn:'University / College',
    icon:'🎓', color:'#1a237e',
    desc:'جامعات وكليات ومعاهد تعليم عالٍ',
    modules:['students','faculties','departments','courses','registration','grades','exams','research','library','hr','accounting','housing','reports'],
    dashboardType:'university',
    licenseFields:['moeAccreditation','programAccreditation','ncaaLicense']
  },
  school: {
    id:'school', group:'education',
    label:'مدرسة', labelEn:'School',
    icon:'🏫', color:'#283593',
    desc:'مدارس ابتدائية وإعدادية وثانوية حكومية وخاصة',
    modules:['students','teachers','classes','subjects','grades','attendance','exams','fees','library','hr','accounting','parents_portal','reports'],
    dashboardType:'school',
    licenseFields:['moeLicense','schoolAccreditation']
  },
  kindergarten: {
    id:'kindergarten', group:'education',
    label:'روضة أطفال / حضانة', labelEn:'Kindergarten',
    icon:'🧒', color:'#e91e63',
    desc:'رياض أطفال وحضانات ومراكز تنمية الطفل',
    modules:['children','classes','attendance','activities','meals','fees','parents_portal','accounting','reports'],
    dashboardType:'school',
    licenseFields:['moeLicense','healthCertificate']
  },
  training_center: {
    id:'training_center', group:'education',
    label:'مركز تدريب وتطوير', labelEn:'Training Center',
    icon:'📚', color:'#1565c0',
    desc:'مراكز تدريب مهني وتطوير وبرامج مؤهلات',
    modules:['trainees','trainers','courses','schedules','certificates','exams','accounting','reports'],
    dashboardType:'school',
    licenseFields:['tvtcLicense','tpcLicense']
  },
  language_institute: {
    id:'language_institute', group:'education',
    label:'معهد لغات', labelEn:'Language Institute',
    icon:'🌍', color:'#006064',
    desc:'معاهد تعليم اللغات والترجمة',
    modules:['students','teachers','courses','levels','schedules','exams','certificates','accounting','reports'],
    dashboardType:'school',
    licenseFields:['moeLicense']
  },
  driving_school: {
    id:'driving_school', group:'education',
    label:'مدرسة تعليم قيادة', labelEn:'Driving School',
    icon:'🚗', color:'#37474f',
    desc:'مدارس تعليم القيادة ورخص السيارات والشاحنات',
    modules:['students','instructors','vehicles','schedules','tests','licenses','accounting','reports'],
    dashboardType:'school',
    licenseFields:['mtcLicense','drivingSchoolPermit']
  },
  quran_institute: {
    id:'quran_institute', group:'education',
    label:'معهد تحفيظ قرآن', labelEn:'Quran Institute',
    icon:'📖', color:'#004d40',
    desc:'مراكز ومعاهد تحفيظ القرآن والعلوم الشرعية',
    modules:['students','teachers','classes','attendance','certificates','fees','accounting','reports'],
    dashboardType:'school',
    licenseFields:['moeLicense','islamicAffairsApproval']
  },

  // ══════════════════════════════════════════════════════
  // R. BEAUTY & WELLNESS — التجميل والعافية
  // ══════════════════════════════════════════════════════
  salon_ladies: {
    id:'salon_ladies', group:'beauty',
    label:'صالون نسائي', labelEn:"Ladies Salon",
    icon:'💅', color:'#ad1457',
    desc:'صالونات تجميل نسائية وعرائس وسبا',
    modules:['appointments','staff','services','pos','inventory','customers','accounting','reports'],
    dashboardType:'salon',
    licenseFields:['commercialReg','municipalityLicense','femaleStaffOnly']
  },
  salon_gents: {
    id:'salon_gents', group:'beauty',
    label:'صالون رجالي / حلاقة', labelEn:"Gents Salon / Barber",
    icon:'💈', color:'#1565c0',
    desc:'صالونات حلاقة رجالية وعناية بالذكور',
    modules:['appointments','barbers','services','pos','inventory','accounting','reports'],
    dashboardType:'salon',
    licenseFields:['commercialReg','municipalityLicense']
  },
  spa: {
    id:'spa', group:'beauty',
    label:'سبا ومركز تدليك', labelEn:'Spa & Massage Center',
    icon:'🧖', color:'#6a1b9a',
    desc:'مراكز سبا وعلاجات تجميلية وتدليك',
    modules:['appointments','therapists','services','pos','inventory','customers','accounting','reports'],
    dashboardType:'salon',
    licenseFields:['commercialReg','healthLicense','municipalityLicense']
  },
  gym: {
    id:'gym', group:'beauty',
    label:'نادي رياضي / صالة لياقة', labelEn:'Gym & Fitness',
    icon:'🏋️', color:'#7b1fa2',
    desc:'أندية رياضية وصالات لياقة وسباحة',
    modules:['members','subscriptions','classes','trainers','lockers','pos','inventory','accounting','reports'],
    dashboardType:'gym',
    licenseFields:['commercialReg','sportsFedLicense','municipalityLicense']
  },
  medical_spa: {
    id:'medical_spa', group:'beauty',
    label:'مركز تجميل طبي', labelEn:'Medical Aesthetics',
    icon:'✨', color:'#c2185b',
    desc:'مراكز تجميل طبي وحقن وليزر',
    modules:['patients','appointments','doctors','treatments','billing','accounting','reports'],
    dashboardType:'clinic',
    licenseFields:['healthLicense','mohPermit']
  },

  // ══════════════════════════════════════════════════════
  // F. CONSTRUCTION — الإنشاء والمقاولات
  // ══════════════════════════════════════════════════════
  construction_general: {
    id:'construction_general', group:'construction',
    label:'مقاولات عامة', labelEn:'General Contractor',
    icon:'🏗️', color:'#e65100',
    desc:'مقاولات إنشاء وبناء وتشييد عامة',
    modules:['projects','subcontractors','purchase_orders','inventory','equipment','employees','hr','accounting','zatca','reports'],
    dashboardType:'construction',
    licenseFields:['commercialReg','classificationGrade','vatNumber']
  },
  mep: {
    id:'mep', group:'construction',
    label:'كهرباء وسباكة وتكييف (MEP)', labelEn:'MEP Contractor',
    icon:'⚡', color:'#f57f17',
    desc:'مقاولات كهرباء وسباكة وتكييف وميكانيكا',
    modules:['projects','purchase_orders','inventory','employees','equipment','accounting','reports'],
    dashboardType:'construction',
    licenseFields:['commercialReg','seccLicense','sacomeLicense']
  },
  interior_design: {
    id:'interior_design', group:'construction',
    label:'تصميم داخلي وتشطيبات', labelEn:'Interior Design',
    icon:'🛋️', color:'#bf360c',
    desc:'تصميم داخلي وتشطيبات ومفروشات',
    modules:['projects','customers','suppliers','purchase_orders','inventory','accounting','reports'],
    dashboardType:'construction',
    licenseFields:['commercialReg','vatNumber']
  },

  // ══════════════════════════════════════════════════════
  // L. REAL ESTATE — العقارات
  // ══════════════════════════════════════════════════════
  real_estate: {
    id:'real_estate', group:'real_estate',
    label:'تطوير عقاري', labelEn:'Real Estate Developer',
    icon:'🏘️', color:'#4e342e',
    desc:'شركات تطوير وبناء وبيع الوحدات العقارية',
    modules:['properties','units','customers','sales_orders','contracts','accounting','crm','reports'],
    dashboardType:'real_estate',
    licenseFields:['commercialReg','reraLicense','vatNumber']
  },
  property_management: {
    id:'property_management', group:'real_estate',
    label:'إدارة أملاك', labelEn:'Property Management',
    icon:'🏢', color:'#5d4037',
    desc:'إدارة وتأجير الأملاك والعقارات',
    modules:['properties','leases','tenants','maintenance','accounting','crm','reports'],
    dashboardType:'real_estate',
    licenseFields:['commercialReg','reraLicense']
  },
  real_estate_broker: {
    id:'real_estate_broker', group:'real_estate',
    label:'وساطة عقارية', labelEn:'Real Estate Broker',
    icon:'🤝', color:'#6d4c41',
    desc:'وسطاء عقاريين ومكاتب بيع وتأجير',
    modules:['listings','customers','crm','commissions','accounting','reports'],
    dashboardType:'real_estate',
    licenseFields:['commercialReg','reraLicense']
  },

  // ══════════════════════════════════════════════════════
  // H. TRANSPORTATION & LOGISTICS — النقل واللوجستيك
  // ══════════════════════════════════════════════════════
  freight: {
    id:'freight', group:'logistics',
    label:'شحن وتخليص جمركي', labelEn:'Freight & Customs',
    icon:'🚢', color:'#1b5e20',
    desc:'شحن دولي وتخليص جمركي وبحري وجوي وبري',
    modules:['shipments','customs','fleet','drivers','purchase_orders','customers','accounting','reports'],
    dashboardType:'logistics',
    licenseFields:['commercialReg','sacoLicense','vatNumber']
  },
  delivery: {
    id:'delivery', group:'logistics',
    label:'توصيل وتوزيع', labelEn:'Last-Mile Delivery',
    icon:'🚚', color:'#2e7d32',
    desc:'خدمات توصيل وتوزيع للمناطق والعملاء',
    modules:['orders','fleet','drivers','tracking','customers','accounting','reports'],
    dashboardType:'logistics',
    licenseFields:['commercialReg','transportLicense']
  },
  warehouse_storage: {
    id:'warehouse_storage', group:'logistics',
    label:'تخزين ومستودعات', labelEn:'Warehousing',
    icon:'🏭', color:'#33691e',
    desc:'مستودعات تخزين وخدمات لوجستية',
    modules:['inventory','warehouse_zones','customers','operations','accounting','reports'],
    dashboardType:'logistics',
    licenseFields:['commercialReg','municipalityLicense']
  },
  transportation: {
    id:'transportation', group:'logistics',
    label:'نقل ركاب', labelEn:'Passenger Transport',
    icon:'🚌', color:'#558b2f',
    desc:'شركات نقل ركاب وحافلات وسيارات أجرة',
    modules:['vehicles','drivers','routes','bookings','customers','accounting','reports'],
    dashboardType:'logistics',
    licenseFields:['commercialReg','mtcLicense','gplLicense']
  },

  // ══════════════════════════════════════════════════════
  // C. MANUFACTURING — التصنيع
  // ══════════════════════════════════════════════════════
  manufacturing: {
    id:'manufacturing', group:'manufacturing',
    label:'تصنيع وإنتاج', labelEn:'Manufacturing',
    icon:'🏭', color:'#37474f',
    desc:'مصانع وخطوط إنتاج وتجميع',
    modules:['bom','production_orders','quality','inventory','suppliers','purchase_orders','employees','accounting','reports'],
    dashboardType:'manufacturing',
    licenseFields:['commercialReg','industrialLicense','saudiStandardsCert']
  },
  food_production: {
    id:'food_production', group:'manufacturing',
    label:'صناعات غذائية', labelEn:'Food Production',
    icon:'🍜', color:'#e65100',
    desc:'مصانع غذاء ومشروبات وتعبئة وتغليف',
    modules:['bom','production','quality','haccp','inventory','suppliers','accounting','reports'],
    dashboardType:'manufacturing',
    licenseFields:['commercialReg','sfdalicense','saudiStandards']
  },

  // ══════════════════════════════════════════════════════
  // M. PROFESSIONAL SERVICES — الخدمات المهنية
  // ══════════════════════════════════════════════════════
  consulting: {
    id:'consulting', group:'services',
    label:'استشارات', labelEn:'Consulting',
    icon:'💼', color:'#283593',
    desc:'استشارات إدارية ومالية وقانونية وتقنية',
    modules:['clients','projects','employees','billing','accounting','crm','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','vatNumber']
  },
  law_firm: {
    id:'law_firm', group:'services',
    label:'مكتب محاماة', labelEn:'Law Firm',
    icon:'⚖️', color:'#1a237e',
    desc:'مكاتب محاماة واستشارات قانونية',
    modules:['clients','cases','billing','employees','accounting','reports'],
    dashboardType:'services',
    licenseFields:['barAssocLicense','moJApproval']
  },
  accounting_firm: {
    id:'accounting_firm', group:'services',
    label:'مكتب محاسبة وتدقيق', labelEn:'Accounting Firm',
    icon:'📊', color:'#004d40',
    desc:'مكاتب محاسبة وتدقيق مالي وزكاة وضريبة',
    modules:['clients','engagements','billing','employees','accounting','zatca','reports'],
    dashboardType:'services',
    licenseFields:['socpaLicense']
  },
  it_company: {
    id:'it_company', group:'services',
    label:'شركة تقنية / برمجيات', labelEn:'IT & Software',
    icon:'💻', color:'#0277bd',
    desc:'شركات برمجيات وتطوير وأمن معلومات وسحابة',
    modules:['clients','projects','employees','billing','hr','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','citcLicense','vatNumber']
  },
  engineering: {
    id:'engineering', group:'services',
    label:'مكتب هندسي', labelEn:'Engineering Consultancy',
    icon:'📐', color:'#37474f',
    desc:'مكاتب هندسة معمارية ومدنية واستشارات إنشائية',
    modules:['projects','clients','employees','billing','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','saceLicense']
  },
  hr_company: {
    id:'hr_company', group:'services',
    label:'استقدام وموارد بشرية', labelEn:'HR & Recruitment',
    icon:'👥', color:'#00695c',
    desc:'شركات استقدام وتوظيف وخدمات موارد بشرية',
    modules:['candidates','clients','placements','billing','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','moeLaborLicense','visaFees']
  },
  security_company: {
    id:'security_company', group:'services',
    label:'حراسة وأمن', labelEn:'Security Services',
    icon:'🛡️', color:'#212121',
    desc:'شركات حراسة وأمن ومراقبة وأنظمة إنذار',
    modules:['clients','guards','shifts','billing','hr','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','moisLicense']
  },
  cleaning: {
    id:'cleaning', group:'services',
    label:'نظافة وتشغيل ومواصلات', labelEn:'Cleaning & Facility Management',
    icon:'🧹', color:'#00838f',
    desc:'شركات نظافة ومرافق وصيانة وكافيتيريا',
    modules:['clients','staff','contracts','schedules','billing','hr','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','vatNumber']
  },
  maintenance: {
    id:'maintenance', group:'services',
    label:'صيانة وإصلاح', labelEn:'Maintenance & Repair',
    icon:'🔧', color:'#bf360c',
    desc:'شركات صيانة منزلية وتكييف وكهرباء وسباكة',
    modules:['work_orders','technicians','inventory','customers','billing','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg']
  },
  advertising: {
    id:'advertising', group:'services',
    label:'إعلان ودعاية وعلاقات عامة', labelEn:'Advertising & PR',
    icon:'📢', color:'#e91e63',
    desc:'وكالات إعلان ودعاية وعلاقات عامة ومؤثرين',
    modules:['clients','campaigns','projects','billing','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','citcLicense','vatNumber']
  },

  // ══════════════════════════════════════════════════════
  // K. FINANCIAL — المالية والتأمين
  // ══════════════════════════════════════════════════════
  exchange: {
    id:'exchange', group:'finance',
    label:'صرافة وحوالات', labelEn:'Exchange & Remittance',
    icon:'💱', color:'#1b5e20',
    desc:'شركات صرافة وتحويل أموال ومدفوعات',
    modules:['transactions','customers','branches','accounting','compliance','reports'],
    dashboardType:'finance',
    licenseFields:['samaLicense','amlCompliance']
  },
  insurance: {
    id:'insurance', group:'finance',
    label:'تأمين', labelEn:'Insurance',
    icon:'🛡️', color:'#1565c0',
    desc:'شركات تأمين على الحياة والممتلكات والطبي والسيارات',
    modules:['policies','customers','claims','agents','accounting','reports'],
    dashboardType:'finance',
    licenseFields:['iacLicense','samaApproval']
  },
  investment: {
    id:'investment', group:'finance',
    label:'استثمار وصناديق', labelEn:'Investment',
    icon:'📈', color:'#004d40',
    desc:'شركات استثمار وصناديق وتمويل',
    modules:['portfolios','clients','transactions','accounting','compliance','reports'],
    dashboardType:'finance',
    licenseFields:['cfaLicense','cfmlicense','samaLicense']
  },

  // ══════════════════════════════════════════════════════
  // A. AGRICULTURE — الزراعة
  // ══════════════════════════════════════════════════════
  agriculture: {
    id:'agriculture', group:'agriculture',
    label:'زراعة وثروة حيوانية', labelEn:'Agriculture & Livestock',
    icon:'🌾', color:'#558b2f',
    desc:'مزارع وشركات زراعية وثروة حيوانية وأسماك',
    modules:['lands','crops','livestock','inventory','suppliers','accounting','reports'],
    dashboardType:'agriculture',
    licenseFields:['commercialReg','moeawLicense']
  },

  // ══════════════════════════════════════════════════════
  // N. EVENTS & ENTERTAINMENT — الفعاليات والترفيه
  // ══════════════════════════════════════════════════════
  events: {
    id:'events', group:'events',
    label:'فعاليات ومناسبات', labelEn:'Events & Occasions',
    icon:'🎉', color:'#c2185b',
    desc:'تنظيم مؤتمرات وحفلات وأعراس ومعارض',
    modules:['events','clients','vendors','staff','inventory','billing','accounting','reports'],
    dashboardType:'events',
    licenseFields:['commercialReg','gcaLicense','vatNumber']
  },
  media: {
    id:'media', group:'events',
    label:'إعلام وإنتاج', labelEn:'Media & Production',
    icon:'📺', color:'#6a1b9a',
    desc:'استوديوهات وإنتاج محتوى ومنصات إعلامية',
    modules:['projects','clients','crew','equipment','billing','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','gcamLicense']
  },
  sport_club: {
    id:'sport_club', group:'events',
    label:'نادي رياضي / دوري', labelEn:'Sports Club',
    icon:'⚽', color:'#2e7d32',
    desc:'أندية رياضية واتحادات وبطولات',
    modules:['members','players','coaches','events','sponsorships','accounting','reports'],
    dashboardType:'gym',
    licenseFields:['sportsFedLicense','generalSportsAuth']
  },
  amusement: {
    id:'amusement', group:'events',
    label:'ترفيه وملاهي', labelEn:'Amusement & Entertainment',
    icon:'🎡', color:'#ff6f00',
    desc:'ملاعب ترفيهية وسينما ودور ترفيه وعائلة',
    modules:['tickets','visitors','inventory','pos','employees','accounting','reports'],
    dashboardType:'retail',
    licenseFields:['commercialReg','gcaLicense','municipalityLicense']
  },

  // ══════════════════════════════════════════════════════
  // AUTOMOTIVE — السيارات
  // ══════════════════════════════════════════════════════
  car_dealership: {
    id:'car_dealership', group:'automotive',
    label:'وكالة ومعرض سيارات', labelEn:'Car Dealership',
    icon:'🚗', color:'#37474f',
    desc:'وكالات ومعارض بيع وتأجير سيارات',
    modules:['vehicles','customers','sales','financing','maintenance','accounting','reports'],
    dashboardType:'trading',
    licenseFields:['commercialReg','mvdaLicense','vatNumber']
  },
  car_workshop: {
    id:'car_workshop', group:'automotive',
    label:'ورشة سيارات وصيانة', labelEn:'Auto Workshop',
    icon:'🔧', color:'#455a64',
    desc:'ورش صيانة وإصلاح وصبغ وتغليف سيارات',
    modules:['work_orders','vehicles','customers','inventory','pos','employees','accounting','reports'],
    dashboardType:'services',
    licenseFields:['commercialReg','mvdaLicense']
  },

  // ══════════════════════════════════════════════════════
  // NGO / CHARITY — الجمعيات والمنظمات غير الربحية
  // ══════════════════════════════════════════════════════
  ngo: {
    id:'ngo', group:'ngo',
    label:'جمعية خيرية / منظمة غير ربحية', labelEn:'NGO / Non-Profit',
    icon:'❤️', color:'#c62828',
    desc:'جمعيات خيرية وأوقاف ومؤسسات مجتمعية',
    modules:['donors','donations','beneficiaries','programs','volunteers','accounting','zakat','reports'],
    dashboardType:'ngo',
    licenseFields:['mcaLicense','zakatApproval']
  },
  waqf: {
    id:'waqf', group:'ngo',
    label:'وقف وأوقاف', labelEn:'Waqf / Endowment',
    icon:'🕌', color:'#004d40',
    desc:'إدارة الأوقاف والأصول الخيرية',
    modules:['assets','beneficiaries','revenues','expenses','accounting','reports'],
    dashboardType:'ngo',
    licenseFields:['awqafLicense']
  },

  // ══════════════════════════════════════════════════════
  // SPECIAL / OTHER
  // ══════════════════════════════════════════════════════
  telecom: {
    id:'telecom', group:'services',
    label:'اتصالات وخدمات رقمية', labelEn:'Telecom & Digital',
    icon:'📡', color:'#0d47a1',
    desc:'شركات اتصالات ومزودو إنترنت وخدمات رقمية',
    modules:['subscriptions','customers','billing','network','accounting','reports'],
    dashboardType:'services',
    licenseFields:['citcLicense']
  },
  oil_gas: {
    id:'oil_gas', group:'energy',
    label:'نفط وغاز وطاقة', labelEn:'Oil, Gas & Energy',
    icon:'⛽', color:'#212121',
    desc:'شركات نفط وغاز ومشتقات وطاقة متجددة',
    modules:['projects','contracts','inventory','employees','accounting','reports'],
    dashboardType:'construction',
    licenseFields:['commercialReg','meiLicense']
  },
  other: {
    id:'other', group:'other',
    label:'أخرى', labelEn:'Other',
    icon:'🏢', color:'#546e7a',
    desc:'أنشطة تجارية أخرى غير مصنفة',
    modules:['customers','suppliers','inventory','accounting','employees','reports'],
    dashboardType:'trading',
    licenseFields:['commercialReg']
  }
};

// Groups for UI organization
const INDUSTRY_GROUPS = {
  trade:         { label:'التجارة', labelEn:'Trade', icon:'🛒', color:'#1a73e8' },
  hospitality:   { label:'الضيافة والغذاء', labelEn:'Hospitality', icon:'🏨', color:'#ff6d00' },
  health:        { label:'الصحة والطب', labelEn:'Health & Medical', icon:'🏥', color:'#e53935' },
  education:     { label:'التعليم والتدريب', labelEn:'Education', icon:'🎓', color:'#1565c0' },
  beauty:        { label:'التجميل والعافية', labelEn:'Beauty & Wellness', icon:'💅', color:'#ad1457' },
  construction:  { label:'الإنشاء والمقاولات', labelEn:'Construction', icon:'🏗️', color:'#e65100' },
  real_estate:   { label:'العقارات', labelEn:'Real Estate', icon:'🏘️', color:'#4e342e' },
  logistics:     { label:'النقل واللوجستيك', labelEn:'Logistics', icon:'🚚', color:'#1b5e20' },
  manufacturing: { label:'التصنيع', labelEn:'Manufacturing', icon:'🏭', color:'#37474f' },
  services:      { label:'الخدمات المهنية', labelEn:'Professional Services', icon:'💼', color:'#283593' },
  finance:       { label:'المالية والتأمين', labelEn:'Finance', icon:'💰', color:'#1b5e20' },
  automotive:    { label:'السيارات', labelEn:'Automotive', icon:'🚗', color:'#37474f' },
  agriculture:   { label:'الزراعة', labelEn:'Agriculture', icon:'🌾', color:'#558b2f' },
  events:        { label:'الفعاليات والترفيه', labelEn:'Events & Entertainment', icon:'🎉', color:'#c2185b' },
  ngo:           { label:'غير ربحي وأوقاف', labelEn:'NGO & Waqf', icon:'❤️', color:'#c62828' },
  energy:        { label:'الطاقة والنفط', labelEn:'Energy', icon:'⛽', color:'#212121' },
  other:         { label:'أخرى', labelEn:'Other', icon:'🏢', color:'#546e7a' },
};

module.exports = { INDUSTRIES, INDUSTRY_GROUPS };
