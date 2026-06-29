import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Grow, Stepper, Step, StepLabel, MenuItem, LinearProgress,
  InputAdornment, Chip, Tooltip, Grid, Paper
} from '@mui/material';
import { Check, Visibility, VisibilityOff, Search, Info } from '@mui/icons-material';
import api from '../../services/api';

// ─── All 69 industry types (matching server config) ─────────────────────────
const GROUPS = [
  { id:'trade',        label:'التجارة',             icon:'🛒', color:'#1a73e8',
    industries:[
      { id:'trading_general', icon:'🏪', label:'تجارة عامة',       desc:'جملة وتجزئة واستيراد وتصدير' },
      { id:'retail',          icon:'🛍️', label:'تجزئة',            desc:'محلات ومراكز تسوق' },
      { id:'wholesale',       icon:'📦', label:'جملة وتوزيع',      desc:'توزيع للتجار والشركات' },
      { id:'ecommerce',       icon:'🛒', label:'تجارة إلكترونية',  desc:'متاجر إلكترونية وأونلاين' },
    ]
  },
  { id:'hospitality',  label:'الضيافة والغذاء',    icon:'🏨', color:'#ff6d00',
    industries:[
      { id:'restaurant',          icon:'🍽️', label:'مطعم',              desc:'مطاعم وفود ترك' },
      { id:'cafe',                icon:'☕',  label:'كافيه / مقهى',      desc:'مقاهي ومشروبات' },
      { id:'catering',            icon:'🍱', label:'تموين وضيافة',     desc:'خدمات تموين المناسبات' },
      { id:'hotel',               icon:'🏨', label:'فندق',              desc:'فنادق ومنتجعات' },
      { id:'furnished_apartments',icon:'🏠', label:'شقق مفروشة',       desc:'إيجار يومي وشهري' },
    ]
  },
  { id:'health',       label:'الصحة والطب',         icon:'🏥', color:'#e53935',
    industries:[
      { id:'hospital',     icon:'🏥', label:'مستشفى',            desc:'مستشفيات عامة وتخصصية' },
      { id:'polyclinic',   icon:'🏪', label:'مستوصف / بولي كلينيك', desc:'عيادات متعددة' },
      { id:'clinic',       icon:'🩺', label:'عيادة طبية',        desc:'عيادات عامة وتخصصية' },
      { id:'dental',       icon:'🦷', label:'عيادة أسنان',       desc:'طب وتقويم الأسنان' },
      { id:'pharmacy',     icon:'💊', label:'صيدلية',            desc:'صيدليات وأجهزة طبية' },
      { id:'medical_lab',  icon:'🔬', label:'مختبر طبي',         desc:'تحاليل طبية وبنك دم' },
      { id:'radiology',    icon:'🩻', label:'مركز أشعة',         desc:'تصوير طبي وأشعة' },
      { id:'physiotherapy',icon:'🏃', label:'علاج طبيعي',        desc:'إعادة تأهيل وعلاج' },
      { id:'optometry',    icon:'👓', label:'بصريات',            desc:'نظارات وعدسات لاصقة' },
      { id:'veterinary',   icon:'🐾', label:'عيادة بيطرية',      desc:'رعاية الحيوانات' },
    ]
  },
  { id:'education',    label:'التعليم والتدريب',   icon:'🎓', color:'#1565c0',
    industries:[
      { id:'university',       icon:'🎓', label:'جامعة / كلية',      desc:'تعليم عالٍ ودراسات عليا' },
      { id:'school',           icon:'🏫', label:'مدرسة',             desc:'ابتدائي وإعدادي وثانوي' },
      { id:'kindergarten',     icon:'🧒', label:'روضة / حضانة',      desc:'رياض أطفال وحضانات' },
      { id:'training_center',  icon:'📚', label:'مركز تدريب',        desc:'تدريب مهني وتطوير' },
      { id:'language_institute',icon:'🌍',label:'معهد لغات',         desc:'تعليم اللغات والترجمة' },
      { id:'driving_school',   icon:'🚗', label:'مدرسة قيادة',       desc:'رخص السيارات والشاحنات' },
      { id:'quran_institute',  icon:'📖', label:'معهد تحفيظ قرآن',   desc:'قرآن وعلوم شرعية' },
    ]
  },
  { id:'beauty',       label:'التجميل والعافية',   icon:'💅', color:'#ad1457',
    industries:[
      { id:'salon_ladies',icon:'💅', label:'صالون نسائي',       desc:'تجميل عرائس وسبا' },
      { id:'salon_gents', icon:'💈', label:'صالون رجالي',       desc:'حلاقة وعناية رجالية' },
      { id:'spa',         icon:'🧖', label:'سبا ومركز تدليك',   desc:'علاجات وتدليك' },
      { id:'gym',         icon:'🏋️', label:'نادي رياضي / جيم',  desc:'لياقة وسباحة' },
      { id:'medical_spa', icon:'✨', label:'تجميل طبي',         desc:'حقن وليزر وعمليات' },
    ]
  },
  { id:'construction', label:'الإنشاء والمقاولات', icon:'🏗️', color:'#e65100',
    industries:[
      { id:'construction_general',icon:'🏗️', label:'مقاولات عامة',    desc:'بناء وتشييد' },
      { id:'mep',                 icon:'⚡',  label:'كهرباء وسباكة MEP',desc:'تكييف وميكانيكا' },
      { id:'interior_design',     icon:'🛋️', label:'تصميم داخلي',      desc:'تشطيبات ومفروشات' },
    ]
  },
  { id:'real_estate',  label:'العقارات',           icon:'🏘️', color:'#4e342e',
    industries:[
      { id:'real_estate',         icon:'🏘️', label:'تطوير عقاري',     desc:'بناء وبيع الوحدات' },
      { id:'property_management', icon:'🏢', label:'إدارة أملاك',     desc:'تأجير وإدارة العقارات' },
      { id:'real_estate_broker',  icon:'🤝', label:'وساطة عقارية',    desc:'بيع وتأجير وسمسرة' },
    ]
  },
  { id:'logistics',    label:'النقل واللوجستيك',  icon:'🚚', color:'#1b5e20',
    industries:[
      { id:'freight',           icon:'🚢', label:'شحن وتخليص جمركي', desc:'شحن دولي وجمارك' },
      { id:'delivery',          icon:'🚚', label:'توصيل وتوزيع',     desc:'توصيل للعملاء' },
      { id:'warehouse_storage', icon:'🏭', label:'مستودعات وتخزين',  desc:'خدمات لوجستية' },
      { id:'transportation',    icon:'🚌', label:'نقل ركاب',         desc:'حافلات وسيارات أجرة' },
    ]
  },
  { id:'manufacturing',label:'التصنيع',            icon:'🏭', color:'#37474f',
    industries:[
      { id:'manufacturing',   icon:'🏭', label:'تصنيع وإنتاج',    desc:'مصانع وخطوط إنتاج' },
      { id:'food_production', icon:'🍜', label:'صناعات غذائية',   desc:'غذاء ومشروبات وتعبئة' },
    ]
  },
  { id:'services',     label:'الخدمات المهنية',   icon:'💼', color:'#283593',
    industries:[
      { id:'consulting',      icon:'💼', label:'استشارات',          desc:'إدارية ومالية وقانونية' },
      { id:'law_firm',        icon:'⚖️', label:'مكتب محاماة',       desc:'استشارات قانونية' },
      { id:'accounting_firm', icon:'📊', label:'محاسبة وتدقيق',    desc:'زكاة وضريبة ومراجعة' },
      { id:'it_company',      icon:'💻', label:'تقنية / برمجيات',   desc:'تطوير وأمن معلومات' },
      { id:'engineering',     icon:'📐', label:'مكتب هندسي',        desc:'هندسة معمارية ومدنية' },
      { id:'hr_company',      icon:'👥', label:'استقدام وموارد بشرية',desc:'توظيف واستقدام' },
      { id:'security_company',icon:'🛡️', label:'حراسة وأمن',        desc:'حراسة ومراقبة وإنذار' },
      { id:'cleaning',        icon:'🧹', label:'نظافة ومرافق',      desc:'نظافة وصيانة كافيتيريا' },
      { id:'maintenance',     icon:'🔧', label:'صيانة وإصلاح',      desc:'تكييف وكهرباء وسباكة' },
      { id:'advertising',     icon:'📢', label:'إعلان وعلاقات عامة',desc:'وكالات إعلان ومؤثرين' },
    ]
  },
  { id:'finance',      label:'المالية والتأمين',  icon:'💰', color:'#1b5e20',
    industries:[
      { id:'exchange',    icon:'💱', label:'صرافة وحوالات', desc:'صرافة وتحويل أموال' },
      { id:'insurance',   icon:'🛡️', label:'تأمين',         desc:'تأمين حياة وطبي وسيارات' },
      { id:'investment',  icon:'📈', label:'استثمار وصناديق',desc:'استثمار وتمويل' },
    ]
  },
  { id:'automotive',   label:'السيارات',           icon:'🚗', color:'#37474f',
    industries:[
      { id:'car_dealership',icon:'🚗', label:'وكالة ومعرض سيارات',desc:'بيع وتأجير سيارات' },
      { id:'car_workshop',  icon:'🔧', label:'ورشة سيارات',        desc:'صيانة وإصلاح وصبغ' },
    ]
  },
  { id:'agriculture',  label:'الزراعة',            icon:'🌾', color:'#558b2f',
    industries:[
      { id:'agriculture',icon:'🌾', label:'زراعة وثروة حيوانية',desc:'مزارع وثروة ومصايد' },
    ]
  },
  { id:'events',       label:'الفعاليات والترفيه', icon:'🎉', color:'#c2185b',
    industries:[
      { id:'events',      icon:'🎉', label:'فعاليات ومناسبات',desc:'مؤتمرات وأعراس ومعارض' },
      { id:'media',       icon:'📺', label:'إعلام وإنتاج',    desc:'استوديوهات ومحتوى' },
      { id:'sport_club',  icon:'⚽', label:'نادي رياضي',      desc:'أندية واتحادات' },
      { id:'amusement',   icon:'🎡', label:'ترفيه وملاهي',    desc:'سينما وألعاب عائلية' },
    ]
  },
  { id:'ngo',          label:'غير ربحي وأوقاف',  icon:'❤️', color:'#c62828',
    industries:[
      { id:'ngo',  icon:'❤️', label:'جمعية خيرية',   desc:'خيرية وأوقاف ومجتمعية' },
      { id:'waqf', icon:'🕌', label:'وقف وأوقاف',     desc:'إدارة الأصول الوقفية' },
    ]
  },
  { id:'other',        label:'أخرى',               icon:'🏢', color:'#546e7a',
    industries:[
      { id:'telecom', icon:'📡', label:'اتصالات ورقمية',desc:'اتصالات وإنترنت' },
      { id:'oil_gas', icon:'⛽', label:'نفط وغاز وطاقة',desc:'نفط وطاقة متجددة' },
      { id:'other',   icon:'🏢', label:'أخرى',         desc:'أنشطة غير مصنفة' },
    ]
  },
];

const PLANS = [
  { id:'trial',        label:'تجريبي',       price:'مجاناً',   period:'30 يوم',  users:10,  icon:'🎁', color:'#34a853' },
  { id:'starter',      label:'Starter',      price:'99 ر.س',  period:'/شهر',    users:25,  icon:'🚀', color:'#1a73e8' },
  { id:'professional', label:'Professional', price:'299 ر.س', period:'/شهر',    users:100, icon:'⭐', color:'#9c27b0' },
];

const CITIES = ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الأحساء','القصيم','أبها','تبوك','الطائف','حائل','جازان','نجران','الباحة','الجوف','الخبر','الجبيل'];

const pwStrength = pw => { let s=0; if(pw.length>=8)s++; if(/[A-Z]/.test(pw))s++; if(/[0-9]/.test(pw))s++; if(/[^a-zA-Z0-9]/.test(pw))s++; return s; };

const StrBar = ({ v }) => {
  const info=[null,{c:'#e53935',l:'ضعيفة'},{c:'#f57c00',l:'مقبولة'},{c:'#fbc02d',l:'جيدة'},{c:'#43a047',l:'قوية'}];
  if(!v) return null;
  return <Box sx={{mt:0.5}}><LinearProgress variant="determinate" value={v*25} sx={{height:4,borderRadius:2,bgcolor:'#eee','& .MuiLinearProgress-bar':{bgcolor:info[v].c,borderRadius:2}}}/><Typography variant="caption" sx={{color:info[v].c,fontSize:'0.7rem'}}>{info[v].l}</Typography></Box>;
};

const STEPS = ['نوع النشاط','الشركة','المسؤول','الخطة','مراجعة'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step,setStep]   = useState(0);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [showPw,setShowPw] = useState(false);
  const [search,setSearch] = useState('');
  const [form,setForm]   = useState({
    industry:'', companyName:'', companyNameEn:'', phone:'', city:'الرياض', country:'SA',
    commercialReg:'', vatNumber:'',
    name:'', email:'', adminPhone:'', password:'', confirmPw:'', plan:'trial'
  });

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  // Find selected industry across all groups
  const selectedInd = useMemo(()=>{
    for(const g of GROUPS) for(const i of g.industries) if(i.id===form.industry) return {...i, groupColor:g.color};
    return null;
  },[form.industry]);

  const selectedGroup = useMemo(()=>GROUPS.find(g=>g.industries.some(i=>i.id===form.industry)),[form.industry]);

  // Filter industries by search
  const filteredGroups = useMemo(()=>{
    if(!search) return GROUPS;
    const q = search.toLowerCase();
    return GROUPS.map(g=>({...g, industries:g.industries.filter(i=>i.label.includes(q)||i.desc.includes(q)||i.labelEn?.toLowerCase().includes(q))}))
      .filter(g=>g.industries.length>0);
  },[search]);

  const validate = () => {
    if(step===0 && !form.industry) return 'يرجى اختيار نوع النشاط التجاري';
    if(step===1){
      if(!form.companyName.trim()) return 'اسم الشركة مطلوب';
      const crClean = form.commercialReg.replace(/[\s-]/g,'');
      if(!crClean) return 'الرقم الموحد للسجل التجاري مطلوب';
      if(!/^\d{10}$/.test(crClean)) return 'رقم السجل التجاري يجب أن يكون 10 أرقام';
      const vatClean = form.vatNumber.replace(/\s/g,'');
      if(!vatClean) return 'الرقم الضريبي (VAT) مطلوب';
      if(!/^3\d{14}$/.test(vatClean)) return 'الرقم الضريبي يجب أن يبدأ بـ 3 ويكون 15 رقماً';
    }
    if(step===2){
      if(!form.name.trim()) return 'الاسم الكامل مطلوب';
      if(!form.email.trim()||!/\S+@\S+\.\S+/.test(form.email)) return 'بريد إلكتروني غير صالح';
      if(!form.password||form.password.length<8) return 'كلمة المرور 8 أحرف على الأقل';
      if(form.password!==form.confirmPw) return 'كلمتا المرور غير متطابقتين';
    }
    return null;
  };

  const next = () => { const e=validate(); if(e){setError(e);return;} setError(''); setStep(s=>s+1); };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/users/register',{
        name:form.name, email:form.email.trim().toLowerCase(), password:form.password,
        companyName:form.companyName, companyNameEn:form.companyNameEn||form.companyName,
        industry:form.industry, plan:form.plan, phone:form.adminPhone, city:form.city,
        commercialReg:form.commercialReg.replace(/[\s-]/g,''),
        vatNumber:form.vatNumber.replace(/\s/g,'')
      });
      if(res.data.success){
        const u=res.data.data?.user||{};
        localStorage.setItem('token',res.data.token);
        localStorage.setItem('userId',u._id||'');
        localStorage.setItem('userName',u.name||form.name);
        localStorage.setItem('userRole',u.role||'admin');
        localStorage.setItem('userIndustry',form.industry);
        localStorage.setItem('userCompany',form.companyName);
        navigate('/dashboard');
      }
    } catch(err){ setError(err.response?.data?.message||'خطأ في إنشاء الحساب'); setStep(2); }
    finally{ setLoading(false); }
  };

  const indColor = selectedInd?.groupColor || '#1a73e8';

  return (
    <Box sx={{minHeight:'100vh',display:'flex',background:'#060d1a',overflow:'hidden',position:'relative'}}>
      {/* Orbs */}
      {[{s:500,x:-80,y:-80,c:'rgba(26,115,232,0.10)'},{s:400,x:'65%',y:'55%',c:'rgba(108,71,255,0.09)'}].map((o,i)=>(
        <Box key={i} sx={{position:'absolute',width:o.s,height:o.s,left:o.x,top:o.y,borderRadius:'50%',background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`,pointerEvents:'none'}}/>
      ))}

      {/* Left panel */}
      <Box sx={{display:{xs:'none',lg:'flex'},flex:1,flexDirection:'column',justifyContent:'center',alignItems:'center',p:6,zIndex:1}}>
        {/* Logo */}
        <Box sx={{textAlign:'center',mb:5}}>
          <Box sx={{width:72,height:72,borderRadius:'18px',mx:'auto',mb:2.5,background:'linear-gradient(135deg, #1a73e8, #4fc3f7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(26,115,232,0.4)'}}>
            <Typography sx={{fontSize:36,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif',letterSpacing:'-1px'}}>W</Typography>
          </Box>
          <Typography sx={{fontSize:30,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>Wassel ERP</Typography>
          <Typography sx={{color:'rgba(255,255,255,0.4)',fontSize:12,mt:0.5,letterSpacing:2,textTransform:'uppercase'}}>
            69 نوع نشاط تجاري · موثّق بالسجل التجاري السعودي
          </Typography>
        </Box>

        {/* Selected industry preview */}
        {selectedInd ? (
          <Box sx={{width:300,bgcolor:'rgba(255,255,255,0.06)',border:`1px solid ${indColor}40`,borderRadius:3,p:3,mb:4}}>
            <Typography sx={{fontSize:36,mb:1}}>{selectedInd.icon}</Typography>
            <Typography sx={{color:'#fff',fontWeight:700,fontSize:18,mb:0.5}}>{selectedInd.label}</Typography>
            <Typography sx={{color:'rgba(255,255,255,0.5)',fontSize:13,mb:2}}>{selectedInd.desc}</Typography>
            <Chip label={`خطة ${form.plan}`} size="small" sx={{bgcolor:`${indColor}25`,color:indColor,fontWeight:600}}/>
          </Box>
        ) : (
          <Box sx={{width:300,mb:4}}>
            {['69 نوع نشاط مدرج في السجل التجاري السعودي','واجهة مخصصة لكل قطاع','مشتريات مشتركة لجميع الأنواع','مرتبط بـ ZATCA وVAT'].map((t,i)=>(
              <Box key={i} sx={{display:'flex',alignItems:'center',gap:1.5,mb:1.2}}>
                <Box sx={{width:20,height:20,borderRadius:'50%',flexShrink:0,bgcolor:'rgba(52,168,83,0.2)',border:'1px solid rgba(52,168,83,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Check sx={{fontSize:12,color:'#34a853'}}/>
                </Box>
                <Typography sx={{color:'rgba(255,255,255,0.7)',fontSize:13}}>{t}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Right panel - form */}
      <Box sx={{flex:{xs:1,lg:'0 0 560px'},display:'flex',alignItems:'flex-start',justifyContent:'center',p:{xs:2,sm:3},zIndex:1,overflowY:'auto',maxHeight:'100vh'}}>
        <Grow in timeout={600}>
          <Box sx={{width:'100%',maxWidth:510,bgcolor:'rgba(255,255,255,0.97)',borderRadius:4,p:{xs:3,sm:4},boxShadow:'0 32px 100px rgba(0,0,0,0.5)',my:3}}>

            {/* Mobile logo */}
            <Box sx={{display:{xs:'flex',lg:'none'},alignItems:'center',gap:1.5,mb:3}}>
              <Box sx={{width:40,height:40,borderRadius:'10px',background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Typography sx={{fontSize:20,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif'}}>W</Typography>
              </Box>
              <Typography variant="h6" fontWeight={800}>Wassel ERP</Typography>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>إنشاء حساب جديد</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb:2.5}}>
              الخطوة {step+1} من {STEPS.length} · {STEPS[step]}
            </Typography>

            <Stepper activeStep={step} alternativeLabel sx={{mb:3}}>
              {STEPS.map((l,i)=>(
                <Step key={i} completed={step>i}>
                  <StepLabel sx={{'& .MuiStepLabel-label':{fontSize:'0.65rem'}}}>{l}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{mb:2,borderRadius:2,fontSize:'0.83rem'}} onClose={()=>setError('')}>{error}</Alert>}

            {/* ══ STEP 0: INDUSTRY ══ */}
            {step===0 && (
              <Box>
                {/* Search */}
                <TextField size="small" fullWidth placeholder="ابحث: مطعم، مستشفى، تجارة..." value={search} onChange={e=>setSearch(e.target.value)}
                  sx={{mb:2,'& .MuiOutlinedInput-root':{borderRadius:3}}}
                  InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18,color:'text.secondary'}}/></InputAdornment>}}/>

                {/* Group by category */}
                <Box sx={{maxHeight:420,overflowY:'auto',pr:0.5}}>
                  {filteredGroups.map(g=>(
                    <Box key={g.id} sx={{mb:2}}>
                      <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}>
                        <Typography sx={{fontSize:14}}>{g.icon}</Typography>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{textTransform:'uppercase',letterSpacing:0.8,fontSize:'0.7rem'}}>{g.label}</Typography>
                      </Box>
                      <Grid container spacing={1}>
                        {g.industries.map(ind=>(
                          <Grid item xs={6} key={ind.id}>
                            <Box onClick={()=>setForm(p=>({...p,industry:ind.id}))}
                              sx={{p:1.3,borderRadius:2,cursor:'pointer',display:'flex',alignItems:'center',gap:1,
                                border:'1.5px solid',
                                borderColor:form.industry===ind.id?g.color:'divider',
                                bgcolor:form.industry===ind.id?`${g.color}10`:'transparent',
                                transition:'all 0.15s',
                                '&:hover':{borderColor:g.color,bgcolor:`${g.color}08`}
                              }}>
                              <Typography sx={{fontSize:18,flexShrink:0}}>{ind.icon}</Typography>
                              <Box sx={{minWidth:0}}>
                                <Typography variant="caption" fontWeight={700} display="block"
                                  sx={{color:form.industry===ind.id?g.color:'text.primary',fontSize:'0.72rem',lineHeight:1.2,
                                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                  {ind.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary"
                                  sx={{fontSize:'0.63rem',lineHeight:1.1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>
                                  {ind.desc}
                                </Typography>
                              </Box>
                              {form.industry===ind.id && <Check sx={{fontSize:14,color:g.color,flexShrink:0,ml:'auto'}}/>}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
                {form.industry && (
                  <Box sx={{mt:2,p:1.5,bgcolor:`${indColor}10`,borderRadius:2,border:`1px solid ${indColor}30`,display:'flex',alignItems:'center',gap:1}}>
                    <Typography sx={{fontSize:20}}>{selectedInd?.icon}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{color:indColor}}>محدد: {selectedInd?.label}</Typography>
                    <Button size="small" onClick={()=>setForm(p=>({...p,industry:''}))} sx={{ml:'auto',fontSize:'0.7rem'}}>تغيير</Button>
                  </Box>
                )}
              </Box>
            )}

            {/* ══ STEP 1: COMPANY ══ */}
            {step===1 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {selectedInd && (
                  <Box sx={{display:'flex',alignItems:'center',gap:1.5,p:1.5,borderRadius:2,bgcolor:`${indColor}10`,border:`1px solid ${indColor}30`}}>
                    <Typography sx={{fontSize:24}}>{selectedInd.icon}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={700} sx={{color:indColor}}>{selectedInd.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedInd.desc}</Typography>
                    </Box>
                  </Box>
                )}
                <TextField label="اسم الشركة / المنشأة *" value={form.companyName} onChange={set('companyName')} fullWidth required
                  InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>}}/>
                <TextField label="Company Name (English)" value={form.companyNameEn} onChange={set('companyNameEn')} fullWidth
                  InputProps={{startAdornment:<InputAdornment position="start">🌐</InputAdornment>}}/>
                
                {/* CR Number */}
                <Box>
                  <TextField
                    label="الرقم الموحد للسجل التجاري *"
                    value={form.commercialReg}
                    onChange={e=>setForm(p=>({...p,commercialReg:e.target.value.replace(/[^\d]/g,'').slice(0,10)}))}
                    placeholder="1234567890"
                    fullWidth required
                    error={form.commercialReg.length>0 && !/^\d{10}$/.test(form.commercialReg)}
                    helperText={
                      form.commercialReg.length>0 && !/^\d{10}$/.test(form.commercialReg)
                        ? `⚠ 10 أرقام مطلوبة (${form.commercialReg.length}/10)`
                        : form.commercialReg.length===10 ? '✓ صحيح' : '10 أرقام — من السجل التجاري أو Maroof'
                    }
                    inputProps={{maxLength:10,inputMode:'numeric',dir:'ltr'}}
                    InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>,
                      sx:{fontFamily:'monospace',fontSize:'1rem',letterSpacing:2}}}
                  />
                </Box>

                {/* VAT Number */}
                <Box>
                  <TextField
                    label="الرقم الضريبي (VAT) *"
                    value={form.vatNumber}
                    onChange={e=>setForm(p=>({...p,vatNumber:e.target.value.replace(/[^\d]/g,'').slice(0,15)}))}
                    placeholder="300000000000003"
                    fullWidth required
                    error={form.vatNumber.length>0 && !/^3\d{14}$/.test(form.vatNumber)}
                    helperText={
                      form.vatNumber.length>0 && !/^3\d{14}$/.test(form.vatNumber)
                        ? `⚠ يبدأ بـ 3 ويكون 15 رقماً (${form.vatNumber.length}/15)`
                        : form.vatNumber.length===15 ? '✓ صحيح' : '15 رقماً يبدأ بـ 3 — من بوابة ZATCA'
                    }
                    inputProps={{maxLength:15,inputMode:'numeric',dir:'ltr'}}
                    InputProps={{startAdornment:<InputAdornment position="start">🧾</InputAdornment>,
                      sx:{fontFamily:'monospace',fontSize:'0.95rem',letterSpacing:1.5}}}
                  />
                </Box>
                <TextField label="رقم الهاتف" value={form.phone} onChange={set('phone')} fullWidth
                  InputProps={{startAdornment:<InputAdornment position="start">📞</InputAdornment>}}/>
                <TextField label="المدينة" value={form.city} onChange={set('city')} fullWidth select>
                  {CITIES.map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
              </Box>
            )}

            {/* ══ STEP 2: ADMIN ══ */}
            {step===2 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                <TextField label="الاسم الكامل *" value={form.name} onChange={set('name')} fullWidth required
                  InputProps={{startAdornment:<InputAdornment position="start">👤</InputAdornment>}}/>
                <TextField label="البريد الإلكتروني *" type="email" value={form.email} onChange={set('email')} fullWidth required
                  InputProps={{startAdornment:<InputAdornment position="start">📧</InputAdornment>}}/>
                <TextField label="رقم الجوال" value={form.adminPhone} onChange={set('adminPhone')} fullWidth
                  InputProps={{startAdornment:<InputAdornment position="start">📱</InputAdornment>}}/>
                <Box>
                  <TextField label="كلمة المرور *" type={showPw?'text':'password'} value={form.password} onChange={set('password')} fullWidth required
                    helperText="8 أحرف — أحرف كبيرة وأرقام ورموز للأمان"
                    InputProps={{
                      startAdornment:<InputAdornment position="start">🔒</InputAdornment>,
                      endAdornment:<InputAdornment position="end">
                        <Box onClick={()=>setShowPw(v=>!v)} sx={{cursor:'pointer',color:'text.secondary',display:'flex'}}>
                          {showPw?<VisibilityOff sx={{fontSize:18}}/>:<Visibility sx={{fontSize:18}}/>}
                        </Box>
                      </InputAdornment>
                    }}/>
                  {form.password && <StrBar v={pwStrength(form.password)}/>}
                </Box>
                <TextField label="تأكيد كلمة المرور *" type={showPw?'text':'password'} value={form.confirmPw} onChange={set('confirmPw')} fullWidth required
                  error={!!form.confirmPw&&form.password!==form.confirmPw}
                  helperText={form.confirmPw&&form.password!==form.confirmPw?'⚠ غير متطابقة':''}
                  InputProps={{startAdornment:<InputAdornment position="start">🔐</InputAdornment>}}/>
              </Box>
            )}

            {/* ══ STEP 3: PLAN ══ */}
            {step===3 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                <Typography variant="body2" fontWeight={600} gutterBottom>اختر خطة الاشتراك</Typography>
                {PLANS.map(pl=>(
                  <Box key={pl.id} onClick={()=>setForm(p=>({...p,plan:pl.id}))}
                    sx={{p:2,borderRadius:2.5,cursor:'pointer',border:'2px solid',borderColor:form.plan===pl.id?pl.color:'divider',
                      bgcolor:form.plan===pl.id?`${pl.color}0f`:'transparent',transition:'all 0.18s','&:hover':{borderColor:pl.color}}}>
                    <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
                        <Typography sx={{fontSize:24}}>{pl.icon}</Typography>
                        <Box>
                          <Typography fontWeight={700} sx={{color:form.plan===pl.id?pl.color:'text.primary'}}>{pl.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{pl.users} مستخدم</Typography>
                        </Box>
                      </Box>
                      <Box sx={{textAlign:'right'}}>
                        <Typography fontWeight={800} sx={{color:pl.color}}>{pl.price}</Typography>
                        <Typography variant="caption" color="text.secondary">{pl.period}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
                <Alert severity="info" sx={{borderRadius:2,fontSize:'0.8rem'}}>
                  جميع الخطط تشمل: المشتريات، المحاسبة، الموارد البشرية، ونظام VAT/ZATCA
                </Alert>
              </Box>
            )}

            {/* ══ STEP 4: CONFIRM ══ */}
            {step===4 && (
              <Box>
                <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2.5,mb:2}}>
                  <Typography variant="body2" fontWeight={700} gutterBottom>ملخص الحساب</Typography>
                  {[
                    [selectedInd?.icon+' نوع النشاط', selectedInd?.label],
                    ['🏢 الشركة', form.companyName],
                    ['📍 المدينة', form.city],
                    ['📦 الخطة', PLANS.find(p=>p.id===form.plan)?.label+' - '+PLANS.find(p=>p.id===form.plan)?.price],
                    ['👤 المسؤول', form.name],
                    ['📧 البريد', form.email],
                  ].map(([k,v])=>(
                    <Box key={k} sx={{display:'flex',justifyContent:'space-between',py:0.8,borderBottom:'1px solid #eee'}}>
                      <Typography variant="caption" color="text.secondary">{k}</Typography>
                      <Typography variant="caption" fontWeight={600}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
                <Alert severity="success" icon="🎉" sx={{mb:2,borderRadius:2,fontSize:'0.83rem'}}>
                  30 يوم تجربة مجانية — بدون بطاقة ائتمان
                </Alert>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  بالمتابعة تقبل شروط الاستخدام وسياسة الخصوصية
                </Typography>
              </Box>
            )}

            {/* Navigation buttons */}
            <Box sx={{display:'flex',gap:1.5,mt:3}}>
              {step>0 && (
                <Button variant="outlined" onClick={()=>{setError('');setStep(s=>s-1);}}
                  sx={{flex:1,py:1.3,borderRadius:2,fontWeight:600}}>← السابق</Button>
              )}
              {step<4 ? (
                <Button variant="contained" onClick={next} sx={{
                  flex:2,py:1.3,fontWeight:700,borderRadius:2,
                  background:`linear-gradient(135deg, ${indColor}, ${indColor}cc)`,
                  boxShadow:`0 4px 16px ${indColor}35`,
                }}>التالي ←</Button>
              ) : (
                <Button variant="contained" onClick={submit} disabled={loading} sx={{
                  flex:2,py:1.3,fontWeight:700,borderRadius:2,
                  background:'linear-gradient(135deg, #34a853, #2d7a3a)',
                  boxShadow:'0 4px 16px rgba(52,168,83,0.35)',
                }}>
                  {loading?<CircularProgress size={22} color="inherit"/>:'🚀 إطلاق الحساب'}
                </Button>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{mt:2.5}}>
              لديك حساب؟{' '}
              <Link to="/login" style={{color:'#1a73e8',fontWeight:700,textDecoration:'none'}}>سجّل دخولك</Link>
            </Typography>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
