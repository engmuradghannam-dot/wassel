const mongoose = require('mongoose');

// All modules in the system (used for permission matrix)
const ALL_MODULES = [
  // Core
  'dashboard','users','roles','company_settings','branches','warehouses',
  // Finance
  'accounting','payments','tax_returns','budgets','reports',
  // Procurement
  'suppliers','purchase_orders','rfq','inventory','stock_movements',
  // Sales & CRM
  'customers','sales_orders','quotations','crm','deliveries',
  // HR
  'employees','payroll','hr_leaves','attendance',
  // Operations
  'projects','shipments','customs','logistics',
  // Communication
  'chat','meetings','notifications',
  // Industry-specific
  'patients','appointments','medical_records','pharmacy_mgmt','lab',
  'rooms','bookings','restaurant_pos','menu','kitchen',
  'students','classes','grades','teachers',
  'members','subscriptions','gym_classes',
  'properties','leases','tenants',
  'salon_appointments','salon_services','staff_schedule',
  'production','bom','quality',
  'fleet','drivers','routes',
  'donors','donations','beneficiaries',
  'ai_assistant','system_settings','audit_log'
];

const ALL_ACTIONS = ['read','create','update','delete','approve','export','import'];

const roleSchema = new mongoose.Schema({
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  // ─── Identity ─────────────────────────────────────────────────
  name:     { type: String, required: true, trim: true },
  nameAr:   { type: String, trim: true },
  nameEn:   { type: String, trim: true },
  color:    { type: String, default: '#1a73e8' },
  icon:     { type: String, default: '👤' },
  level:    { type: Number, default: 5 }, // 1=highest, 10=lowest

  // ─── Description ──────────────────────────────────────────────
  description:   { type: String },
  descriptionEn: { type: String },

  // ─── Permissions Matrix ───────────────────────────────────────
  // Format: { module: 'inventory', actions: ['read','create','update'] }
  permissions: [{
    module:  { type: String, enum: ALL_MODULES, required: true },
    actions: [{ type: String, enum: ALL_ACTIONS }],
    // Field-level restrictions (e.g. hide salary field from regular users)
    hiddenFields:     [{ type: String }],
    readonlyFields:   [{ type: String }],
    // Row-level restrictions (e.g. only see own records)
    ownRecordsOnly:   { type: Boolean, default: false },
    branchRestricted: { type: Boolean, default: false }
  }],

  // ─── System Restrictions ──────────────────────────────────────
  canAccessAllBranches: { type: Boolean, default: false },
  canExport:            { type: Boolean, default: false },
  canImport:            { type: Boolean, default: false },
  canApprove:           { type: Boolean, default: false },
  canManageUsers:       { type: Boolean, default: false },
  canViewFinancials:    { type: Boolean, default: false },
  canViewSalaries:      { type: Boolean, default: false },

  // ─── Time Restrictions ────────────────────────────────────────
  allowedHours: {
    enabled:  { type: Boolean, default: false },
    from:     { type: String, default: '08:00' },
    to:       { type: String, default: '18:00' },
    days:     [{ type: Number }] // 0=Sun,1=Mon,...6=Sat
  },

  // ─── Industry context ─────────────────────────────────────────
  industry:  { type: String }, // inherit from company
  isDefault: { type: Boolean, default: false }, // pre-built role
  isSystem:  { type: Boolean, default: false }, // cannot be deleted
  isActive:  { type: Boolean, default: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

roleSchema.index({ company: 1, name: 1 }, { unique: true });
roleSchema.index({ company: 1, isDefault: 1 });

// Static: get default roles for an industry
roleSchema.statics.getDefaultRoles = function(industry, companyId) {
  return DEFAULT_ROLES_BY_INDUSTRY[industry] || DEFAULT_ROLES_BY_INDUSTRY['trading_general'];
};

// DEFAULT ROLES per industry type
const DEFAULT_ROLES_BY_INDUSTRY = {
  'trading_general': [
    { name:'مدير عام', nameEn:'General Manager', icon:'👔', color:'#1a73e8', level:1, isDefault:true, canViewFinancials:true, canManageUsers:true, canApprove:true, canExport:true, canAccessAllBranches:true,
      permissions: ALL_MODULES.map(m => ({ module:m, actions:['read','create','update','delete','approve','export'] })) },
    { name:'محاسب', nameEn:'Accountant', icon:'📊', color:'#34a853', level:3, isDefault:true, canViewFinancials:true, canExport:true,
      permissions: [
        { module:'accounting', actions:['read','create','update','delete'] },
        { module:'payments', actions:['read','create','update'] },
        { module:'tax_returns', actions:['read','create','update'] },
        { module:'reports', actions:['read','export'] },
        { module:'purchase_orders', actions:['read'] },
        { module:'sales_orders', actions:['read'] },
        { module:'suppliers', actions:['read'] },
        { module:'customers', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'مشتريات', nameEn:'Purchasing Officer', icon:'🛒', color:'#f57c00', level:3, isDefault:true,
      permissions: [
        { module:'suppliers', actions:['read','create','update'] },
        { module:'purchase_orders', actions:['read','create','update'] },
        { module:'rfq', actions:['read','create','update','delete'] },
        { module:'inventory', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'مستودعات', nameEn:'Warehouse Manager', icon:'📦', color:'#7b1fa2', level:3, isDefault:true,
      permissions: [
        { module:'inventory', actions:['read','create','update'] },
        { module:'warehouses', actions:['read'] },
        { module:'stock_movements', actions:['read','create'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'مبيعات', nameEn:'Sales Representative', icon:'💼', color:'#00897b', level:4, isDefault:true, ownRecordsOnly:true,
      permissions: [
        { module:'customers', actions:['read','create','update'] },
        { module:'sales_orders', actions:['read','create','update'] },
        { module:'quotations', actions:['read','create','update'] },
        { module:'inventory', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'موارد بشرية', nameEn:'HR Manager', icon:'👥', color:'#c2185b', level:3, isDefault:true, canViewSalaries:true,
      permissions: [
        { module:'employees', actions:['read','create','update'] },
        { module:'payroll', actions:['read','create','update'] },
        { module:'hr_leaves', actions:['read','create','update','approve'] },
        { module:'attendance', actions:['read','create','update'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'موظف', nameEn:'Employee', icon:'👤', color:'#546e7a', level:5, isDefault:true,
      permissions: [
        { module:'dashboard', actions:['read'] },
        { module:'chat', actions:['read','create'] }
      ]
    }
  ],
  'hospital': [
    { name:'طبيب', nameEn:'Doctor', icon:'👨‍⚕️', color:'#e53935', level:2, isDefault:true,
      permissions: [
        { module:'patients', actions:['read','create','update'] },
        { module:'appointments', actions:['read','create','update'] },
        { module:'medical_records', actions:['read','create','update'] },
        { module:'pharmacy_mgmt', actions:['read'] },
        { module:'lab', actions:['read','create'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'ممرض', nameEn:'Nurse', icon:'👩‍⚕️', color:'#f06292', level:3, isDefault:true,
      permissions: [
        { module:'patients', actions:['read','update'] },
        { module:'appointments', actions:['read','update'] },
        { module:'medical_records', actions:['read','create'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'كاشير', nameEn:'Cashier', icon:'💰', color:'#43a047', level:4, isDefault:true,
      permissions: [
        { module:'patients', actions:['read'] },
        { module:'accounting', actions:['read','create'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'صيدلاني', nameEn:'Pharmacist', icon:'💊', color:'#00897b', level:3, isDefault:true,
      permissions: [
        { module:'pharmacy_mgmt', actions:['read','create','update'] },
        { module:'inventory', actions:['read','update'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ],
  'restaurant': [
    { name:'مدير مطعم', nameEn:'Restaurant Manager', icon:'🍽️', color:'#e65100', level:1, isDefault:true, canViewFinancials:true, canManageUsers:true,
      permissions: ALL_MODULES.map(m => ({ module:m, actions:['read','create','update','delete','approve'] }))
    },
    { name:'كابتن / نادل', nameEn:'Waiter', icon:'🤵', color:'#f57c00', level:4, isDefault:true,
      permissions: [
        { module:'restaurant_pos', actions:['read','create','update'] },
        { module:'menu', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'طباخ', nameEn:'Chef', icon:'👨‍🍳', color:'#bf360c', level:3, isDefault:true,
      permissions: [
        { module:'kitchen', actions:['read','update'] },
        { module:'inventory', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ],
  'school': [
    { name:'معلم', nameEn:'Teacher', icon:'📚', color:'#283593', level:3, isDefault:true,
      permissions: [
        { module:'students', actions:['read'] },
        { module:'classes', actions:['read','update'] },
        { module:'grades', actions:['read','create','update'] },
        { module:'attendance', actions:['read','create','update'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'طالب', nameEn:'Student', icon:'🎓', color:'#1565c0', level:6, isDefault:true,
      permissions: [
        { module:'classes', actions:['read'] },
        { module:'grades', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ],
  'university': [
    { name:'أستاذ', nameEn:'Professor', icon:'🎓', color:'#1a237e', level:2, isDefault:true,
      permissions: [
        { module:'students', actions:['read'] },
        { module:'classes', actions:['read','create','update'] },
        { module:'grades', actions:['read','create','update','delete'] },
        { module:'dashboard', actions:['read'] }
      ]
    },
    { name:'طالب', nameEn:'Student', icon:'📖', color:'#283593', level:6, isDefault:true,
      permissions: [
        { module:'classes', actions:['read'] },
        { module:'grades', actions:['read'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ],
  'gym': [
    { name:'مدرب', nameEn:'Trainer', icon:'💪', color:'#7b1fa2', level:3, isDefault:true,
      permissions: [
        { module:'members', actions:['read'] },
        { module:'gym_classes', actions:['read','create','update'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ],
  'salon_ladies': [
    { name:'حلاقة / تجميل', nameEn:'Stylist', icon:'✂️', color:'#ad1457', level:3, isDefault:true,
      permissions: [
        { module:'salon_appointments', actions:['read','update'] },
        { module:'salon_services', actions:['read'] },
        { module:'customers', actions:['read','update'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ],
  'real_estate': [
    { name:'وسيط عقاري', nameEn:'Real Estate Agent', icon:'🏘️', color:'#4e342e', level:3, isDefault:true,
      permissions: [
        { module:'properties', actions:['read','create','update'] },
        { module:'leases', actions:['read','create','update'] },
        { module:'customers', actions:['read','create','update'] },
        { module:'crm', actions:['read','create','update'] },
        { module:'dashboard', actions:['read'] }
      ]
    }
  ]
};

// Use trading_general as fallback for all unlisted types
const FALLBACK_INDUSTRIES = [
  'retail','wholesale','ecommerce','cafe','catering','hotel','furnished_apartments',
  'polyclinic','clinic','dental','pharmacy','medical_lab','radiology','physiotherapy',
  'optometry','veterinary','kindergarten','training_center','language_institute',
  'driving_school','quran_institute','salon_gents','spa','medical_spa',
  'construction_general','mep','interior_design','property_management','real_estate_broker',
  'freight','delivery','warehouse_storage','transportation','manufacturing','food_production',
  'consulting','law_firm','accounting_firm','it_company','engineering','hr_company',
  'security_company','cleaning','maintenance','advertising','exchange','insurance',
  'investment','car_dealership','car_workshop','agriculture','events','media',
  'sport_club','amusement','ngo','waqf','telecom','oil_gas','other'
];
FALLBACK_INDUSTRIES.forEach(id => {
  if (!DEFAULT_ROLES_BY_INDUSTRY[id]) {
    DEFAULT_ROLES_BY_INDUSTRY[id] = DEFAULT_ROLES_BY_INDUSTRY['trading_general'];
  }
});

module.exports = mongoose.model('Role', roleSchema);
module.exports.DEFAULT_ROLES_BY_INDUSTRY = DEFAULT_ROLES_BY_INDUSTRY;
module.exports.ALL_MODULES = ALL_MODULES;
module.exports.ALL_ACTIONS = ALL_ACTIONS;
