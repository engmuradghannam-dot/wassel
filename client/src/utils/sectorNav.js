/**
 * WasselERP — Sector Navigation Configuration
 * Each industry gets a tailored nav and dashboard modules
 */

// ── Shared bottom links (always visible) ─────────────────────────
const SHARED_BOTTOM = [
  null,
  { path:'/accounting',       icon:'💰', key:'nav.accounting'      },
  { path:'/employees',        icon:'👤', key:'nav.employees'        },
  { path:'/purchase-requests',icon:'📝', key:'nav.pr'              },
  { path:'/contracts',        icon:'📄', key:'nav.contracts'        },
  { path:'/legal',            icon:'⚖️', key:'nav.legal'           },
  { path:'/chat',             icon:'💬', key:'nav.chat'             },
  { path:'/mail',             icon:'📧', key:'nav.mail'             },
  null,
  { path:'/roles',            icon:'🔐', key:'nav.roles'            },
  { path:'/company-settings', icon:'🏢', key:'nav.company'          },
  { path:'/settings',         icon:'⚙️', key:'settings.title'       },
];

const SECTOR_NAV = {

  // ── TRADE ────────────────────────────────────────────────────────
  trading_general: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/sales-orders',    icon:'📋', key:'nav.salesOrders'     },
    { path:'/warehouses',      icon:'🏭', key:'nav.warehouses'      },
    { path:'/projects',        icon:'📁', key:'nav.projects'        },
    ...SHARED_BOTTOM
  ],
  retail: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'📦', key:'nav.products'        },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/sales-orders',    icon:'🧾', key:'nav.sales'           },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/warehouses',      icon:'🏭', key:'nav.warehouses'      },
    ...SHARED_BOTTOM
  ],
  wholesale:  null, // uses trading_general
  ecommerce: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'📦', key:'nav.products'        },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/sales-orders',    icon:'🛒', key:'nav.orders'          },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/warehouses',      icon:'🏭', key:'nav.warehouses'      },
    ...SHARED_BOTTOM
  ],

  // ── HOTEL ────────────────────────────────────────────────────────
  hotel: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/rooms',           icon:'🛏️', key:'nav.rooms'           },
    { path:'/bookings',        icon:'📅', key:'nav.bookings'        },
    { path:'/customers',       icon:'👥', key:'nav.guests'          },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],
  furnished_apartments: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/rooms',           icon:'🏠', key:'nav.units'           },
    { path:'/bookings',        icon:'📅', key:'nav.bookings'        },
    { path:'/customers',       icon:'👥', key:'nav.tenants'         },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],

  // ── RESTAURANT ───────────────────────────────────────────────────
  restaurant: [
    { path:'/dashboard',         icon:'📊', key:'nav.dashboard'         },
    { path:'/tables',            icon:'🍽️', key:'nav.tables'            },
    { path:'/restaurant-orders', icon:'📋', key:'nav.orders'            },
    { path:'/inventory',         icon:'📦', key:'nav.inventory'         },
    { path:'/suppliers',         icon:'🚛', key:'nav.suppliers'         },
    { path:'/purchase-orders',   icon:'🛒', key:'nav.purchaseOrders'    },
    { path:'/customers',         icon:'👥', key:'nav.customers'         },
    ...SHARED_BOTTOM
  ],
  cafe: null,     // uses restaurant
  catering: null, // uses restaurant

  // ── HEALTH ───────────────────────────────────────────────────────
  hospital: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/patients',        icon:'🩺', key:'nav.patients'        },
    { path:'/appointments',    icon:'📅', key:'nav.appointments'    },
    { path:'/employees',       icon:'👨‍⚕️', key:'nav.doctors'        },
    { path:'/inventory',       icon:'💊', key:'nav.pharmacy'        },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/branches',        icon:'🏥', key:'nav.branches'        },
    ...SHARED_BOTTOM
  ],
  polyclinic: null, // uses hospital
  clinic: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/patients',        icon:'🩺', key:'nav.patients'        },
    { path:'/appointments',    icon:'📅', key:'nav.appointments'    },
    { path:'/employees',       icon:'👨‍⚕️', key:'nav.doctors'        },
    { path:'/inventory',       icon:'💊', key:'nav.pharmacy'        },
    ...SHARED_BOTTOM
  ],
  dental:         null, // uses clinic
  physiotherapy:  null, // uses clinic
  optometry:      null, // uses clinic
  veterinary:     null, // uses clinic
  medical_lab:    null, // uses clinic
  radiology:      null, // uses clinic
  medical_spa:    null, // uses clinic

  // ── PHARMACY ─────────────────────────────────────────────────────
  pharmacy: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'💊', key:'nav.medications'     },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],

  // ── EDUCATION ────────────────────────────────────────────────────
  school: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/students',        icon:'🎓', key:'nav.students'        },
    { path:'/grades',          icon:'📝', key:'nav.grades'          },
    { path:'/employees',       icon:'📚', key:'nav.teachers'        },
    { path:'/branches',        icon:'🏫', key:'nav.branches'        },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  university: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/students',        icon:'🎓', key:'nav.students'        },
    { path:'/grades',          icon:'📝', key:'nav.grades'          },
    { path:'/employees',       icon:'📚', key:'nav.professors'      },
    { path:'/branches',        icon:'🏛️', key:'nav.faculties'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  kindergarten: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/students',        icon:'🧒', key:'nav.children'        },
    { path:'/employees',       icon:'👩‍🏫', key:'nav.teachers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  training_center:  null, // uses school
  language_institute: null, // uses school
  driving_school:   null, // uses school
  quran_institute:  null, // uses school

  // ── GYM / SPORT ──────────────────────────────────────────────────
  gym: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/memberships',     icon:'💳', key:'nav.members'         },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/employees',       icon:'💪', key:'nav.trainers'        },
    { path:'/inventory',       icon:'🏋️', key:'nav.equipment'      },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],
  sport_club: null, // uses gym

  // ── SALON / SPA ──────────────────────────────────────────────────
  salon_ladies: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/appointments',    icon:'📅', key:'nav.appointments'    },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/employees',       icon:'✂️', key:'nav.stylists'        },
    { path:'/inventory',       icon:'💄', key:'nav.products'        },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],
  salon_gents: null,  // uses salon_ladies
  spa:         null,  // uses salon_ladies

  // ── REAL ESTATE ──────────────────────────────────────────────────
  real_estate: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/properties',      icon:'🏘️', key:'nav.properties'      },
    { path:'/leases',          icon:'📄', key:'nav.leases'          },
    { path:'/customers',       icon:'👥', key:'nav.clients'         },
    { path:'/projects',        icon:'🏗️', key:'nav.projects'        },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],
  property_management: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/properties',      icon:'🏢', key:'nav.properties'      },
    { path:'/leases',          icon:'📄', key:'nav.leases'          },
    { path:'/customers',       icon:'👥', key:'nav.tenants'         },
    { path:'/inventory',       icon:'🔧', key:'nav.maintenance'     },
    ...SHARED_BOTTOM
  ],
  real_estate_broker: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/properties',      icon:'🏘️', key:'nav.listings'        },
    { path:'/customers',       icon:'👥', key:'nav.clients'         },
    { path:'/projects',        icon:'📋', key:'nav.deals'           },
    ...SHARED_BOTTOM
  ],

  // ── CONSTRUCTION ─────────────────────────────────────────────────
  construction_general: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/projects',        icon:'🏗️', key:'nav.projects'        },
    { path:'/customers',       icon:'👥', key:'nav.clients'         },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'🔩', key:'nav.materials'       },
    { path:'/warehouses',      icon:'🏭', key:'nav.warehouses'      },
    ...SHARED_BOTTOM
  ],
  mep:            null, // uses construction_general
  interior_design:null, // uses construction_general

  // ── LOGISTICS ────────────────────────────────────────────────────
  freight: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/customers',       icon:'👥', key:'nav.clients'         },
    { path:'/projects',        icon:'🚢', key:'nav.shipments'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  delivery:          null, // uses freight
  warehouse_storage: null, // uses freight
  transportation:    null, // uses freight

  // ── MANUFACTURING ────────────────────────────────────────────────
  manufacturing: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/projects',        icon:'🏭', key:'nav.production'      },
    { path:'/inventory',       icon:'📦', key:'nav.materials'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/warehouses',      icon:'🏭', key:'nav.warehouses'      },
    ...SHARED_BOTTOM
  ],
  food_production: null, // uses manufacturing

  // ── SERVICES / CONSULTING ────────────────────────────────────────
  consulting: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/customers',       icon:'👥', key:'nav.clients'         },
    { path:'/projects',        icon:'📋', key:'nav.projects'        },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  law_firm:        null, // uses consulting
  accounting_firm: null, // uses consulting
  it_company:      null, // uses consulting
  engineering:     null, // uses consulting
  hr_company:      null, // uses consulting
  security_company:null, // uses consulting
  cleaning:        null, // uses consulting
  maintenance:     null, // uses consulting
  advertising:     null, // uses consulting

  // ── AUTOMOTIVE ───────────────────────────────────────────────────
  car_dealership: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'🚗', key:'nav.vehicles'        },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/sales-orders',    icon:'💰', key:'nav.sales'           },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],
  car_workshop: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/customers',       icon:'🚗', key:'nav.vehicles'        },
    { path:'/projects',        icon:'🔧', key:'nav.workOrders'      },
    { path:'/inventory',       icon:'🔩', key:'nav.spareParts'      },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],

  // ── FINANCE ──────────────────────────────────────────────────────
  exchange: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/projects',        icon:'💱', key:'nav.transactions'    },
    ...SHARED_BOTTOM
  ],
  insurance:   null, // uses exchange
  investment:  null, // uses exchange

  // ── NGO ──────────────────────────────────────────────────────────
  ngo: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/customers',       icon:'❤️', key:'nav.donors'          },
    { path:'/projects',        icon:'🤝', key:'nav.programs'        },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  waqf: null, // uses ngo

  // ── AGRICULTURE ──────────────────────────────────────────────────
  agriculture: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'🌾', key:'nav.crops'           },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    ...SHARED_BOTTOM
  ],

  // ── EVENTS ───────────────────────────────────────────────────────
  events: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/projects',        icon:'🎉', key:'nav.events'          },
    { path:'/customers',       icon:'👥', key:'nav.clients'         },
    { path:'/suppliers',       icon:'🚛', key:'nav.vendors'         },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    ...SHARED_BOTTOM
  ],
  media:    null, // uses events
  amusement:null, // uses events

  // ── OTHER / DEFAULT ──────────────────────────────────────────────
  other: [
    { path:'/dashboard',       icon:'📊', key:'nav.dashboard'       },
    { path:'/inventory',       icon:'📦', key:'nav.inventory'       },
    { path:'/customers',       icon:'👥', key:'nav.customers'       },
    { path:'/suppliers',       icon:'🚛', key:'nav.suppliers'       },
    { path:'/purchase-orders', icon:'🛒', key:'nav.purchaseOrders'  },
    { path:'/projects',        icon:'📋', key:'nav.projects'        },
    ...SHARED_BOTTOM
  ],
  telecom: null,  // uses other
  oil_gas: null,  // uses other
};

// ── Resolve nav for any industry (fallback to group default) ─────
const GROUP_DEFAULTS = {
  trade:        'trading_general',
  hospitality:  'hotel',
  health:       'clinic',
  education:    'school',
  beauty:       'salon_ladies',
  construction: 'construction_general',
  real_estate:  'real_estate',
  logistics:    'freight',
  manufacturing:'manufacturing',
  services:     'consulting',
  finance:      'exchange',
  automotive:   'car_dealership',
  agriculture:  'agriculture',
  events:       'events',
  ngo:          'ngo',
  energy:       'other',
  other:        'other',
};

// Industry → group mapping
const IND_GROUP = {
  trading_general:'trade', retail:'trade', wholesale:'trade', ecommerce:'trade',
  restaurant:'hospitality', cafe:'hospitality', catering:'hospitality',
  hotel:'hospitality', furnished_apartments:'hospitality',
  hospital:'health', polyclinic:'health', clinic:'health', dental:'health',
  pharmacy:'health', medical_lab:'health', radiology:'health',
  physiotherapy:'health', optometry:'health', veterinary:'health', medical_spa:'health',
  university:'education', school:'education', kindergarten:'education',
  training_center:'education', language_institute:'education',
  driving_school:'education', quran_institute:'education',
  salon_ladies:'beauty', salon_gents:'beauty', spa:'beauty',
  gym:'beauty', sport_club:'beauty',
  construction_general:'construction', mep:'construction', interior_design:'construction',
  real_estate:'real_estate', property_management:'real_estate', real_estate_broker:'real_estate',
  freight:'logistics', delivery:'logistics', warehouse_storage:'logistics', transportation:'logistics',
  manufacturing:'manufacturing', food_production:'manufacturing',
  consulting:'services', law_firm:'services', accounting_firm:'services',
  it_company:'services', engineering:'services', hr_company:'services',
  security_company:'services', cleaning:'services', maintenance:'services', advertising:'services',
  exchange:'finance', insurance:'finance', investment:'finance',
  car_dealership:'automotive', car_workshop:'automotive',
  agriculture:'agriculture',
  events:'events', media:'events', amusement:'events',
  ngo:'ngo', waqf:'ngo',
  telecom:'other', oil_gas:'other', other:'other',
};

export const getNavForIndustry = (industry) => {
  // Direct match
  if (SECTOR_NAV[industry]) return SECTOR_NAV[industry];
  // Group default
  const group = IND_GROUP[industry];
  if (group) {
    const defaultInd = GROUP_DEFAULTS[group];
    if (SECTOR_NAV[defaultInd]) return SECTOR_NAV[defaultInd];
  }
  // Ultimate fallback: trading
  return SECTOR_NAV.trading_general;
};

// ── Sector colors ────────────────────────────────────────────────
const SECTOR_COLORS = {
  trade:'#1a73e8', hospitality:'#ff6d00', health:'#e53935',
  education:'#283593', beauty:'#ad1457', construction:'#e65100',
  real_estate:'#4e342e', logistics:'#1b5e20', manufacturing:'#37474f',
  services:'#283593', finance:'#1b5e20', automotive:'#37474f',
  agriculture:'#558b2f', events:'#c2185b', ngo:'#c62828',
  energy:'#212121', other:'#546e7a',
};

export const getSectorColor = (industry) => {
  const group = IND_GROUP[industry] || 'other';
  return SECTOR_COLORS[group] || '#1a73e8';
};

export const getSectorGroup = (industry) => IND_GROUP[industry] || 'other';

export default SECTOR_NAV;
