/**
 * WasselERP Country & Tax Configuration
 * Based on official tax rates as of 2024-2025
 * Sources: OECD, IMF, country tax authorities
 */

const COUNTRIES = {

  // ══ GULF COOPERATION COUNCIL (GCC) ══════════════════════════════
  SA: {
    code:'SA', name:'المملكة العربية السعودية', nameEn:'Saudi Arabia',
    flag:'🇸🇦', currency:'SAR', currencySymbol:'ر.س',
    phone:'+966', dir:'rtl', lang:'ar',
    timezone:'Asia/Riyadh',
    capital:'الرياض',
    cities:['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الأحساء','القصيم','أبها','تبوك','الطائف','حائل','جازان','نجران','الباحة','الجوف','الخبر','الجبيل','ينبع','بريدة','عرعر'],
    taxes: {
      vat:         { rate:15, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      zakat:       { rate:2.5, name:'زكاة الأعمال', nameEn:'Zakat', applies:true, notes:'على الشركات السعودية' },
      withholding: { rate:5,  name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:true },
      corporate:   { rate:20, name:'ضريبة الدخل على الأجانب', nameEn:'Corporate Tax (Foreign)', applies:true },
      excise:      { rate:100, name:'ضريبة انتقائية (التبغ/المشروبات)', nameEn:'Excise Tax', applies:true, selective:true },
      customs:     { rate:5,  name:'الجمارك (عام)', nameEn:'Customs (General)', applies:true },
    },
    taxAuthority:    'هيئة الزكاة والضريبة والجمارك (ZATCA)',
    taxAuthorityEn:  'Zakat, Tax and Customs Authority (ZATCA)',
    taxAuthorityUrl: 'https://zatca.gov.sa',
    commercialRegLength: 10,
    vatNumberPrefix: '3', vatNumberLength: 15,
    invoiceRequired: true,
    eInvoicing: true,
    group:'gcc'
  },

  AE: {
    code:'AE', name:'الإمارات العربية المتحدة', nameEn:'United Arab Emirates',
    flag:'🇦🇪', currency:'AED', currencySymbol:'د.إ',
    phone:'+971', dir:'rtl', lang:'ar',
    timezone:'Asia/Dubai',
    capital:'أبوظبي',
    cities:['دبي','أبوظبي','الشارقة','عجمان','رأس الخيمة','الفجيرة','أم القيوين'],
    taxes: {
      vat:       { rate:5,  name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      corporate: { rate:9,  name:'ضريبة الشركات', nameEn:'Corporate Tax', applies:true, notes:'أرباح > 375,000 درهم' },
      withholding:{ rate:0, name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:false },
      customs:   { rate:5,  name:'الجمارك', nameEn:'Customs', applies:true },
    },
    taxAuthority:'الهيئة الاتحادية للضرائب', taxAuthorityEn:'Federal Tax Authority',
    commercialRegLength:9, vatNumberPrefix:'', vatNumberLength:15,
    invoiceRequired:true, eInvoicing:false,
    group:'gcc'
  },

  KW: {
    code:'KW', name:'الكويت', nameEn:'Kuwait',
    flag:'🇰🇼', currency:'KWD', currencySymbol:'د.ك',
    phone:'+965', dir:'rtl', lang:'ar', timezone:'Asia/Kuwait',
    capital:'الكويت', cities:['الكويت','السالمية','حولي','الفروانية','الأحمدي','الجهراء'],
    taxes: {
      vat:       { rate:0, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:false, notes:'لا توجد حتى الآن' },
      corporate: { rate:15, name:'ضريبة دخل الشركات', nameEn:'Corporate Tax', applies:true, notes:'للشركات الأجنبية فقط' },
      customs:   { rate:5, name:'الجمارك', nameEn:'Customs', applies:true },
    },
    taxAuthority:'وزارة المالية', taxAuthorityEn:'Ministry of Finance',
    commercialRegLength:6, vatNumberPrefix:'', vatNumberLength:0,
    invoiceRequired:true, eInvoicing:false, group:'gcc'
  },

  QA: {
    code:'QA', name:'قطر', nameEn:'Qatar',
    flag:'🇶🇦', currency:'QAR', currencySymbol:'ر.ق',
    phone:'+974', dir:'rtl', lang:'ar', timezone:'Asia/Qatar',
    capital:'الدوحة', cities:['الدوحة','الريان','الوكرة','الخور','الشمال','الظعاين'],
    taxes: {
      vat:       { rate:0,  name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:false },
      corporate: { rate:10, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:5, name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:true },
      customs:   { rate:5,  name:'الجمارك', nameEn:'Customs', applies:true },
    },
    taxAuthority:'هيئة الضرائب العامة', taxAuthorityEn:'General Tax Authority',
    commercialRegLength:7, vatNumberLength:0,
    invoiceRequired:true, eInvoicing:false, group:'gcc'
  },

  BH: {
    code:'BH', name:'البحرين', nameEn:'Bahrain',
    flag:'🇧🇭', currency:'BHD', currencySymbol:'د.ب',
    phone:'+973', dir:'rtl', lang:'ar', timezone:'Asia/Bahrain',
    capital:'المنامة', cities:['المنامة','المحرق','الرفاع','الحد','سترة','عيسى مدينة'],
    taxes: {
      vat:      { rate:10, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:0,  name:'ضريبة الشركات', nameEn:'Corporate Tax', applies:false },
      customs:  { rate:5,  name:'الجمارك', nameEn:'Customs', applies:true },
    },
    taxAuthority:'الجهاز الوطني للإيرادات', taxAuthorityEn:'National Bureau for Revenue',
    commercialRegLength:9, vatNumberPrefix:'', vatNumberLength:15,
    invoiceRequired:true, eInvoicing:false, group:'gcc'
  },

  OM: {
    code:'OM', name:'سلطنة عُمان', nameEn:'Oman',
    flag:'🇴🇲', currency:'OMR', currencySymbol:'ر.ع',
    phone:'+968', dir:'rtl', lang:'ar', timezone:'Asia/Muscat',
    capital:'مسقط', cities:['مسقط','صلالة','صحار','نزوى','السيب','مطرح'],
    taxes: {
      vat:      { rate:5, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:15, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:10, name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:true },
      customs:  { rate:5, name:'الجمارك', nameEn:'Customs', applies:true },
    },
    taxAuthority:'هيئة الضرائب', taxAuthorityEn:'Tax Authority of Oman',
    commercialRegLength:8, vatNumberLength:15,
    invoiceRequired:true, eInvoicing:false, group:'gcc'
  },

  // ══ ARAB COUNTRIES ═══════════════════════════════════════════════
  EG: {
    code:'EG', name:'مصر', nameEn:'Egypt',
    flag:'🇪🇬', currency:'EGP', currencySymbol:'ج.م',
    phone:'+20', dir:'rtl', lang:'ar', timezone:'Africa/Cairo',
    capital:'القاهرة', cities:['القاهرة','الإسكندرية','الجيزة','المنصورة','أسيوط','الأقصر','أسوان','بورسعيد','السويس'],
    taxes: {
      vat:      { rate:14, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:22.5, name:'ضريبة الدخل على الشركات', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:10, name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:true },
      customs:  { rate:12, name:'الجمارك (متوسط)', nameEn:'Customs (avg)', applies:true },
    },
    taxAuthority:'مصلحة الضرائب المصرية', taxAuthorityEn:'Egyptian Tax Authority',
    vatNumberLength:9, invoiceRequired:true, eInvoicing:true, group:'arab'
  },

  JO: {
    code:'JO', name:'الأردن', nameEn:'Jordan',
    flag:'🇯🇴', currency:'JOD', currencySymbol:'د.أ',
    phone:'+962', dir:'rtl', lang:'ar', timezone:'Asia/Amman',
    capital:'عمّان', cities:['عمّان','الزرقاء','إربد','العقبة','المفرق','الكرك'],
    taxes: {
      vat:      { rate:16, name:'ضريبة المبيعات', nameEn:'Sales Tax', applies:true },
      corporate:{ rate:20, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:10, name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'دائرة ضريبة الدخل والمبيعات', taxAuthorityEn:'Income & Sales Tax Dept',
    vatNumberLength:9, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  LB: {
    code:'LB', name:'لبنان', nameEn:'Lebanon',
    flag:'🇱🇧', currency:'LBP', currencySymbol:'ل.ل',
    phone:'+961', dir:'rtl', lang:'ar', timezone:'Asia/Beirut',
    capital:'بيروت', cities:['بيروت','طرابلس','صيدا','صور','زحلة','جونية'],
    taxes: {
      vat:      { rate:11, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:17, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
    },
    taxAuthority:'وزارة المالية', taxAuthorityEn:'Ministry of Finance',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  IQ: {
    code:'IQ', name:'العراق', nameEn:'Iraq',
    flag:'🇮🇶', currency:'IQD', currencySymbol:'د.ع',
    phone:'+964', dir:'rtl', lang:'ar', timezone:'Asia/Baghdad',
    capital:'بغداد', cities:['بغداد','البصرة','الموصل','أربيل','النجف','كربلاء'],
    taxes: {
      vat:      { rate:0,  name:'ضريبة المبيعات', nameEn:'Sales Tax', applies:false },
      corporate:{ rate:15, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:10, name:'ضريبة الاستقطاع', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'الهيئة العامة للضرائب', taxAuthorityEn:'General Commission for Taxes',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  SY: {
    code:'SY', name:'سوريا', nameEn:'Syria',
    flag:'🇸🇾', currency:'SYP', currencySymbol:'ل.س',
    phone:'+963', dir:'rtl', lang:'ar', timezone:'Asia/Damascus',
    capital:'دمشق', cities:['دمشق','حلب','حمص','اللاذقية','حماة','دير الزور'],
    taxes: {
      vat:      { rate:0,  name:'ضريبة المبيعات', nameEn:'Sales Tax', applies:false },
      corporate:{ rate:22, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
    },
    taxAuthority:'وزارة المالية', taxAuthorityEn:'Ministry of Finance',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  YE: {
    code:'YE', name:'اليمن', nameEn:'Yemen',
    flag:'🇾🇪', currency:'YER', currencySymbol:'ر.ي',
    phone:'+967', dir:'rtl', lang:'ar', timezone:'Asia/Aden',
    capital:'صنعاء', cities:['صنعاء','عدن','تعز','الحديدة','إب','ذمار'],
    taxes: {
      vat:      { rate:5,  name:'الضريبة العامة على المبيعات', nameEn:'GST', applies:true },
      corporate:{ rate:20, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
    },
    taxAuthority:'مصلحة الضرائب', taxAuthorityEn:'Tax Authority',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  LY: {
    code:'LY', name:'ليبيا', nameEn:'Libya',
    flag:'🇱🇾', currency:'LYD', currencySymbol:'د.ل',
    phone:'+218', dir:'rtl', lang:'ar', timezone:'Africa/Tripoli',
    capital:'طرابلس', cities:['طرابلس','بنغازي','مصراتة','الزاوية','البيضاء'],
    taxes: {
      vat:      { rate:0,  name:'ضريبة المبيعات', nameEn:'Sales Tax', applies:false },
      corporate:{ rate:20, name:'ضريبة الدخل', nameEn:'Corporate Tax', applies:true },
    },
    taxAuthority:'مصلحة الضرائب', taxAuthorityEn:'Tax Authority',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  TN: {
    code:'TN', name:'تونس', nameEn:'Tunisia',
    flag:'🇹🇳', currency:'TND', currencySymbol:'د.ت',
    phone:'+216', dir:'rtl', lang:'ar', timezone:'Africa/Tunis',
    capital:'تونس', cities:['تونس','صفاقس','سوسة','بنزرت','قفصة','القيروان'],
    taxes: {
      vat:      { rate:19, name:'الأداء على القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:25, name:'الضريبة على الشركات', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:15, name:'الخصم من المورد', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'المديرية العامة للضرائب', taxAuthorityEn:'General Tax Directorate',
    vatNumberLength:7, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  DZ: {
    code:'DZ', name:'الجزائر', nameEn:'Algeria',
    flag:'🇩🇿', currency:'DZD', currencySymbol:'د.ج',
    phone:'+213', dir:'rtl', lang:'ar', timezone:'Africa/Algiers',
    capital:'الجزائر', cities:['الجزائر','وهران','قسنطينة','عنابة','بليدة','سطيف'],
    taxes: {
      vat:      { rate:19, name:'الرسم على القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:26, name:'الضريبة على أرباح الشركات', nameEn:'Corporate Tax', applies:true },
    },
    taxAuthority:'المديرية العامة للضرائب', taxAuthorityEn:'General Tax Directorate',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  MA: {
    code:'MA', name:'المغرب', nameEn:'Morocco',
    flag:'🇲🇦', currency:'MAD', currencySymbol:'د.م',
    phone:'+212', dir:'rtl', lang:'ar', timezone:'Africa/Casablanca',
    capital:'الرباط', cities:['الدار البيضاء','الرباط','فاس','مراكش','أكادير','طنجة'],
    taxes: {
      vat:      { rate:20, name:'الضريبة على القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:31, name:'الضريبة على الشركات', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:15, name:'الضريبة الاستقطاعية', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'المديرية العامة للضرائب', taxAuthorityEn:'General Tax Directorate',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  SD: {
    code:'SD', name:'السودان', nameEn:'Sudan',
    flag:'🇸🇩', currency:'SDG', currencySymbol:'ج.س',
    phone:'+249', dir:'rtl', lang:'ar', timezone:'Africa/Khartoum',
    capital:'الخرطوم', cities:['الخرطوم','أم درمان','بورتسودان','كسلا','الأبيض'],
    taxes: {
      vat:      { rate:17, name:'ضريبة القيمة المضافة', nameEn:'VAT', applies:true },
      corporate:{ rate:35, name:'ضريبة الأرباح', nameEn:'Corporate Tax', applies:true },
    },
    taxAuthority:'هيئة الضرائب', taxAuthorityEn:'Taxation Chamber',
    vatNumberLength:0, invoiceRequired:true, eInvoicing:false, group:'arab'
  },

  // ══ SOUTH / SOUTHEAST ASIA ═══════════════════════════════════════
  PK: {
    code:'PK', name:'باكستان', nameEn:'Pakistan',
    flag:'🇵🇰', currency:'PKR', currencySymbol:'₨',
    phone:'+92', dir:'ltr', lang:'ur', timezone:'Asia/Karachi',
    capital:'إسلام آباد', cities:['كراتشي','لاهور','إسلام آباد','فيصل آباد','راولبندي','ملتان'],
    taxes: {
      vat:      { rate:17, name:'General Sales Tax (GST)', nameEn:'GST', applies:true },
      corporate:{ rate:29, name:'Corporate Tax', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:15, name:'Withholding Tax', nameEn:'Withholding Tax', applies:true },
      customs:  { rate:11, name:'Customs Duty', nameEn:'Customs', applies:true },
    },
    taxAuthority:'Federal Board of Revenue (FBR)', taxAuthorityEn:'FBR',
    vatNumberLength:7, invoiceRequired:true, eInvoicing:false, group:'asia'
  },

  IN: {
    code:'IN', name:'الهند', nameEn:'India',
    flag:'🇮🇳', currency:'INR', currencySymbol:'₹',
    phone:'+91', dir:'ltr', lang:'hi', timezone:'Asia/Kolkata',
    capital:'نيودلهي', cities:['مومباي','دلهي','بنغالور','حيدر آباد','أحمد آباد','تشيناي','كلكتا'],
    taxes: {
      vat:      { rate:18, name:'Goods & Services Tax (GST)', nameEn:'GST', applies:true, brackets:[{rate:0},{rate:5},{rate:12},{rate:18},{rate:28}] },
      corporate:{ rate:25, name:'Corporate Tax', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:10, name:'TDS', nameEn:'Tax Deducted at Source', applies:true },
      customs:  { rate:10, name:'Basic Customs Duty', nameEn:'Customs', applies:true },
    },
    taxAuthority:'Central Board of Indirect Taxes (CBIC)', taxAuthorityEn:'CBIC',
    vatNumberLength:15, invoiceRequired:true, eInvoicing:true, group:'asia'
  },

  ID: {
    code:'ID', name:'إندونيسيا', nameEn:'Indonesia',
    flag:'🇮🇩', currency:'IDR', currencySymbol:'Rp',
    phone:'+62', dir:'ltr', lang:'id', timezone:'Asia/Jakarta',
    capital:'جاكرتا', cities:['جاكرتا','سورابايا','باندونغ','بيكاسي','ميدان','سيمارانغ'],
    taxes: {
      vat:      { rate:11, name:'PPN (Pajak Pertambahan Nilai)', nameEn:'VAT', applies:true },
      corporate:{ rate:22, name:'PPh Badan', nameEn:'Corporate Income Tax', applies:true },
      withholding:{ rate:15, name:'PPh Pasal 23', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'Direktorat Jenderal Pajak', taxAuthorityEn:'Directorate General of Taxes',
    vatNumberLength:15, invoiceRequired:true, eInvoicing:true, group:'asia'
  },

  TR: {
    code:'TR', name:'تركيا', nameEn:'Turkey',
    flag:'🇹🇷', currency:'TRY', currencySymbol:'₺',
    phone:'+90', dir:'ltr', lang:'tr', timezone:'Europe/Istanbul',
    capital:'أنقرة', cities:['إسطنبول','أنقرة','إزمير','بورصة','أضنة','غازي عنتاب'],
    taxes: {
      vat:      { rate:20, name:'KDV (Katma Değer Vergisi)', nameEn:'VAT', applies:true, brackets:[{rate:1},{rate:10},{rate:20}] },
      corporate:{ rate:25, name:'Kurumlar Vergisi', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:15, name:'Stopaj Vergisi', nameEn:'Withholding Tax', applies:true },
      customs:  { rate:4.5, name:'Gümrük Vergisi', nameEn:'Customs', applies:true },
    },
    taxAuthority:'Gelir İdaresi Başkanlığı (GİB)', taxAuthorityEn:'Revenue Administration',
    vatNumberLength:10, invoiceRequired:true, eInvoicing:true, group:'europe'
  },

  // ══ EUROPE ═══════════════════════════════════════════════════════
  DE: {
    code:'DE', name:'ألمانيا', nameEn:'Germany',
    flag:'🇩🇪', currency:'EUR', currencySymbol:'€',
    phone:'+49', dir:'ltr', lang:'de', timezone:'Europe/Berlin',
    capital:'برلين', cities:['برلين','هامبورغ','ميونخ','كولونيا','فرانكفورت','شتوتغارت'],
    taxes: {
      vat:      { rate:19, name:'Umsatzsteuer (MwSt)', nameEn:'VAT', applies:true, reduced:7 },
      corporate:{ rate:15, name:'Körperschaftsteuer', nameEn:'Corporate Tax', applies:true },
      tradeT:   { rate:14, name:'Gewerbesteuer', nameEn:'Trade Tax', applies:true },
      withholding:{ rate:25, name:'Kapitalertragsteuer', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'Bundeszentralamt für Steuern', taxAuthorityEn:'Federal Central Tax Office',
    vatNumberLength:9, invoiceRequired:true, eInvoicing:false, group:'europe'
  },

  FR: {
    code:'FR', name:'فرنسا', nameEn:'France',
    flag:'🇫🇷', currency:'EUR', currencySymbol:'€',
    phone:'+33', dir:'ltr', lang:'fr', timezone:'Europe/Paris',
    capital:'باريس', cities:['باريس','مرسيليا','ليون','تولوز','نيس','نانت'],
    taxes: {
      vat:      { rate:20, name:'TVA', nameEn:'VAT', applies:true, reduced:10, superReduced:5.5 },
      corporate:{ rate:25, name:'Impôt sur les Sociétés', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:30, name:'Prélèvement Forfaitaire Unique', nameEn:'Flat Tax', applies:true },
    },
    taxAuthority:'Direction générale des Finances publiques', taxAuthorityEn:'DGFiP',
    vatNumberLength:11, invoiceRequired:true, eInvoicing:false, group:'europe'
  },

  GB: {
    code:'GB', name:'المملكة المتحدة', nameEn:'United Kingdom',
    flag:'🇬🇧', currency:'GBP', currencySymbol:'£',
    phone:'+44', dir:'ltr', lang:'en', timezone:'Europe/London',
    capital:'لندن', cities:['لندن','برمنغهام','مانشستر','ليدز','غلاسكو','ليفربول'],
    taxes: {
      vat:      { rate:20, name:'Value Added Tax', nameEn:'VAT', applies:true, reduced:5 },
      corporate:{ rate:25, name:'Corporation Tax', nameEn:'Corporation Tax', applies:true },
      withholding:{ rate:20, name:'Income Tax (Withholding)', nameEn:'Withholding Tax', applies:true },
      customs:  { rate:4,  name:'Import Duty', nameEn:'Customs', applies:true },
    },
    taxAuthority:'HM Revenue & Customs (HMRC)', taxAuthorityEn:'HMRC',
    vatNumberLength:9, invoiceRequired:true, eInvoicing:false, group:'europe'
  },

  // ══ AMERICAS ══════════════════════════════════════════════════════
  US: {
    code:'US', name:'الولايات المتحدة', nameEn:'United States',
    flag:'🇺🇸', currency:'USD', currencySymbol:'$',
    phone:'+1', dir:'ltr', lang:'en', timezone:'America/New_York',
    capital:'واشنطن', cities:['نيويورك','لوس أنجلوس','شيكاغو','هيوستن','فينيكس','فيلادلفيا'],
    taxes: {
      vat:      { rate:0,  name:'No Federal VAT', nameEn:'No Federal VAT', applies:false, notes:'Sales tax varies by state (0-13%)' },
      salesTax: { rate:7.5, name:'State Sales Tax (avg)', nameEn:'Sales Tax', applies:true, notes:'Average across states' },
      corporate:{ rate:21, name:'Corporate Income Tax', nameEn:'Corporate Tax', applies:true },
      withholding:{ rate:30, name:'Withholding Tax', nameEn:'Withholding Tax', applies:true },
    },
    taxAuthority:'Internal Revenue Service (IRS)', taxAuthorityEn:'IRS',
    vatNumberLength:0, invoiceRequired:false, eInvoicing:false, group:'americas'
  },

  // ══ EAST ASIA ════════════════════════════════════════════════════
  CN: {
    code:'CN', name:'الصين', nameEn:'China',
    flag:'🇨🇳', currency:'CNY', currencySymbol:'¥',
    phone:'+86', dir:'ltr', lang:'zh', timezone:'Asia/Shanghai',
    capital:'بيجين', cities:['شنغهاي','بيجين','شنتشن','غوانزو','تشنغدو','ووهان'],
    taxes: {
      vat:      { rate:13, name:'增值税 (VAT)', nameEn:'VAT', applies:true, brackets:[{rate:9},{rate:6},{rate:13}] },
      corporate:{ rate:25, name:'企业所得税', nameEn:'Corporate Income Tax', applies:true },
      withholding:{ rate:10, name:'预提税', nameEn:'Withholding Tax', applies:true },
      customs:  { rate:5,  name:'进口关税', nameEn:'Import Tariff', applies:true },
    },
    taxAuthority:'国家税务总局 (SAT)', taxAuthorityEn:'State Taxation Administration',
    vatNumberLength:15, invoiceRequired:true, eInvoicing:true, group:'asia'
  },

  // ══ OTHER IMPORTANT ══════════════════════════════════════════════
  OTHER: {
    code:'OTHER', name:'دولة أخرى', nameEn:'Other Country',
    flag:'🌍', currency:'USD', currencySymbol:'$',
    phone:'', dir:'ltr', lang:'en', timezone:'UTC',
    capital:'', cities:[],
    taxes: {
      vat: { rate:0, name:'Tax', nameEn:'Tax', applies:false },
    },
    taxAuthority:'', taxAuthorityEn:'',
    vatNumberLength:0, invoiceRequired:false, eInvoicing:false, group:'other'
  },
};

// Helper: get tax info for a country
const getTaxInfo = (countryCode) => COUNTRIES[countryCode] || COUNTRIES['OTHER'];

// Helper: get VAT rate
const getVATRate = (countryCode) => {
  const c = COUNTRIES[countryCode];
  return c?.taxes?.vat?.applies ? (c.taxes.vat.rate||0) : 0;
};

// Helper: sorted list for UI
const getCountriesList = () =>
  Object.values(COUNTRIES).sort((a,b) => {
    // GCC first, then Arab, then rest
    const order = {gcc:0, arab:1, asia:2, europe:3, americas:4, other:99};
    const diff = (order[a.group]||5) - (order[b.group]||5);
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ar');
  });

module.exports = { COUNTRIES, getTaxInfo, getVATRate, getCountriesList };
