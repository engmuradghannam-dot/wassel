import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Grow, Stepper, Step, StepLabel, MenuItem, LinearProgress,
  InputAdornment, Chip, Tooltip, Grid, Paper, Divider
} from '@mui/material';
import { Check, Visibility, VisibilityOff, Search, Info, Language } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import CountrySelector, { BUILT_IN_COUNTRIES } from '../../components/CountrySelector';
import TaxInfo from '../../components/TaxInfo';
import LanguageSelector from '../../components/LanguageSelector';

// 69 industry types (grouped)
const GROUPS = [
  { id:'trade',       label:'التجارة',          labelEn:'Trade',           icon:'🛒', color:'#1a73e8', industries:[
    {id:'trading_general',icon:'🏪',label:'تجارة عامة',labelEn:'General Trading',desc:'جملة وتجزئة واستيراد'},
    {id:'retail',icon:'🛍️',label:'تجزئة',labelEn:'Retail',desc:'محلات ومراكز تسوق'},
    {id:'wholesale',icon:'📦',label:'جملة وتوزيع',labelEn:'Wholesale',desc:'توزيع للتجار'},
    {id:'ecommerce',icon:'🛒',label:'تجارة إلكترونية',labelEn:'E-Commerce',desc:'متاجر أونلاين'},
  ]},
  { id:'hospitality', label:'الضيافة والغذاء', labelEn:'Hospitality',     icon:'🏨', color:'#ff6d00', industries:[
    {id:'restaurant',icon:'🍽️',label:'مطعم',labelEn:'Restaurant',desc:'مطاعم وفود ترك'},
    {id:'cafe',icon:'☕',label:'كافيه',labelEn:'Café',desc:'مقاهي ومشروبات'},
    {id:'catering',icon:'🍱',label:'تموين',labelEn:'Catering',desc:'تموين المناسبات'},
    {id:'hotel',icon:'🏨',label:'فندق',labelEn:'Hotel',desc:'فنادق ومنتجعات'},
    {id:'furnished_apartments',icon:'🏠',label:'شقق مفروشة',labelEn:'Furnished Apts',desc:'إيجار يومي وشهري'},
  ]},
  { id:'health',      label:'الصحة والطب',     labelEn:'Healthcare',      icon:'🏥', color:'#e53935', industries:[
    {id:'hospital',icon:'🏥',label:'مستشفى',labelEn:'Hospital',desc:'مستشفيات عامة وتخصصية'},
    {id:'polyclinic',icon:'🏪',label:'مستوصف',labelEn:'Polyclinic',desc:'عيادات متعددة'},
    {id:'clinic',icon:'🩺',label:'عيادة',labelEn:'Clinic',desc:'عيادات عامة وتخصصية'},
    {id:'dental',icon:'🦷',label:'أسنان',labelEn:'Dental',desc:'طب وتقويم الأسنان'},
    {id:'pharmacy',icon:'💊',label:'صيدلية',labelEn:'Pharmacy',desc:'صيدليات وأجهزة طبية'},
    {id:'medical_lab',icon:'🔬',label:'مختبر',labelEn:'Lab',desc:'تحاليل طبية'},
    {id:'radiology',icon:'🩻',label:'أشعة',labelEn:'Radiology',desc:'تصوير طبي'},
    {id:'physiotherapy',icon:'🏃',label:'علاج طبيعي',labelEn:'Physiotherapy',desc:'تأهيل وعلاج'},
    {id:'optometry',icon:'👓',label:'بصريات',labelEn:'Optometry',desc:'نظارات وعدسات'},
    {id:'veterinary',icon:'🐾',label:'بيطري',labelEn:'Veterinary',desc:'رعاية الحيوانات'},
  ]},
  { id:'education',   label:'التعليم',          labelEn:'Education',       icon:'🎓', color:'#283593', industries:[
    {id:'university',icon:'🎓',label:'جامعة / كلية',labelEn:'University',desc:'تعليم عالٍ'},
    {id:'school',icon:'🏫',label:'مدرسة',labelEn:'School',desc:'ابتدائي وثانوي'},
    {id:'kindergarten',icon:'🧒',label:'روضة / حضانة',labelEn:'Kindergarten',desc:'رياض أطفال'},
    {id:'training_center',icon:'📚',label:'مركز تدريب',labelEn:'Training',desc:'تدريب وتطوير'},
    {id:'language_institute',icon:'🌍',label:'معهد لغات',labelEn:'Language Inst.',desc:'تعليم اللغات'},
    {id:'driving_school',icon:'🚗',label:'مدرسة قيادة',labelEn:'Driving School',desc:'رخص السيارات'},
    {id:'quran_institute',icon:'📖',label:'تحفيظ قرآن',labelEn:'Quran Inst.',desc:'قرآن وعلوم شرعية'},
  ]},
  { id:'beauty',      label:'التجميل والعافية', labelEn:'Beauty',         icon:'💅', color:'#ad1457', industries:[
    {id:'salon_ladies',icon:'💅',label:'صالون نسائي',labelEn:'Ladies Salon',desc:'تجميل وعرائس'},
    {id:'salon_gents',icon:'💈',label:'صالون رجالي',labelEn:'Gents Salon',desc:'حلاقة رجالية'},
    {id:'spa',icon:'🧖',label:'سبا ومساج',labelEn:'Spa',desc:'علاجات وتدليك'},
    {id:'gym',icon:'🏋️',label:'نادي رياضي',labelEn:'Gym',desc:'لياقة وسباحة'},
    {id:'medical_spa',icon:'✨',label:'تجميل طبي',labelEn:'Medical Aesthetics',desc:'حقن وليزر'},
  ]},
  { id:'construction',label:'الإنشاء',          labelEn:'Construction',   icon:'🏗️', color:'#e65100', industries:[
    {id:'construction_general',icon:'🏗️',label:'مقاولات',labelEn:'Contractor',desc:'بناء وتشييد'},
    {id:'mep',icon:'⚡',label:'MEP',labelEn:'MEP',desc:'كهرباء وسباكة وتكييف'},
    {id:'interior_design',icon:'🛋️',label:'تصميم داخلي',labelEn:'Interior Design',desc:'تشطيبات ومفروشات'},
  ]},
  { id:'real_estate', label:'العقارات',          labelEn:'Real Estate',    icon:'🏘️', color:'#4e342e', industries:[
    {id:'real_estate',icon:'🏘️',label:'تطوير عقاري',labelEn:'Developer',desc:'بناء وبيع وحدات'},
    {id:'property_management',icon:'🏢',label:'إدارة أملاك',labelEn:'Prop. Mgmt',desc:'تأجير وإدارة'},
    {id:'real_estate_broker',icon:'🤝',label:'وساطة عقارية',labelEn:'Broker',desc:'بيع وتأجير وسمسرة'},
  ]},
  { id:'logistics',   label:'النقل واللوجستيك', labelEn:'Logistics',      icon:'🚚', color:'#1b5e20', industries:[
    {id:'freight',icon:'🚢',label:'شحن وجمارك',labelEn:'Freight',desc:'شحن دولي'},
    {id:'delivery',icon:'🚚',label:'توصيل',labelEn:'Delivery',desc:'توصيل للعملاء'},
    {id:'warehouse_storage',icon:'🏭',label:'مستودعات',labelEn:'Warehousing',desc:'تخزين لوجستي'},
    {id:'transportation',icon:'🚌',label:'نقل ركاب',labelEn:'Transport',desc:'حافلات وتاكسي'},
  ]},
  { id:'services',    label:'الخدمات المهنية',  labelEn:'Professional',   icon:'💼', color:'#283593', industries:[
    {id:'consulting',icon:'💼',label:'استشارات',labelEn:'Consulting',desc:'إدارية ومالية'},
    {id:'law_firm',icon:'⚖️',label:'محاماة',labelEn:'Law Firm',desc:'استشارات قانونية'},
    {id:'accounting_firm',icon:'📊',label:'محاسبة',labelEn:'Accounting',desc:'زكاة وضريبة'},
    {id:'it_company',icon:'💻',label:'تقنية',labelEn:'IT & Software',desc:'برمجيات وأمن'},
    {id:'engineering',icon:'📐',label:'هندسة',labelEn:'Engineering',desc:'استشارات هندسية'},
    {id:'hr_company',icon:'👥',label:'استقدام',labelEn:'HR & Recruitment',desc:'توظيف واستقدام'},
    {id:'security_company',icon:'🛡️',label:'حراسة',labelEn:'Security',desc:'حراسة ومراقبة'},
    {id:'cleaning',icon:'🧹',label:'نظافة',labelEn:'Cleaning',desc:'نظافة وصيانة'},
    {id:'advertising',icon:'📢',label:'إعلان',labelEn:'Advertising',desc:'وكالات إعلان'},
  ]},
  { id:'other',       label:'أخرى',             labelEn:'Other',          icon:'🏢', color:'#546e7a', industries:[
    {id:'manufacturing',icon:'🏭',label:'تصنيع',labelEn:'Manufacturing',desc:'مصانع وإنتاج'},
    {id:'agriculture',icon:'🌾',label:'زراعة',labelEn:'Agriculture',desc:'مزارع وثروة'},
    {id:'events',icon:'🎉',label:'فعاليات',labelEn:'Events',desc:'مؤتمرات وأعراس'},
    {id:'ngo',icon:'❤️',label:'جمعية خيرية',labelEn:'NGO',desc:'خيرية وأوقاف'},
    {id:'car_dealership',icon:'🚗',label:'وكالة سيارات',labelEn:'Car Dealer',desc:'بيع وتأجير سيارات'},
    {id:'exchange',icon:'💱',label:'صرافة',labelEn:'Exchange',desc:'صرافة وتحويل'},
    {id:'other',icon:'🏢',label:'أخرى',labelEn:'Other',desc:'أنشطة أخرى'},
  ]},
];

const PLANS = [
  {id:'trial',      label:'تجريبي',      labelEn:'Trial',        price:'مجاناً', priceEn:'Free', period:'30 يوم', users:10, icon:'🎁', color:'#34a853'},
  {id:'starter',    label:'Starter',     labelEn:'Starter',      price:'99 ر.س', priceEn:'$26', period:'/شهر', users:25, icon:'🚀', color:'#1a73e8'},
  {id:'professional',label:'Professional',labelEn:'Professional', price:'299 ر.س', priceEn:'$79', period:'/شهر', users:100, icon:'⭐', color:'#9c27b0'},
];

const pwStrength = pw => {
  let s=0;
  if(pw.length>=8) s++;
  if(/[A-Z]/.test(pw)) s++;
  if(/[0-9]/.test(pw)) s++;
  if(/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
};

const StrBar = ({ v }) => {
  const info=[null,{c:'#e53935',l:'ضعيفة'},{c:'#f57c00',l:'مقبولة'},{c:'#fbc02d',l:'جيدة'},{c:'#43a047',l:'قوية'}];
  if(!v) return null;
  return (
    <Box sx={{mt:0.5}}>
      <LinearProgress variant="determinate" value={v*25}
        sx={{height:4,borderRadius:2,bgcolor:'#eee','& .MuiLinearProgress-bar':{bgcolor:info[v].c,borderRadius:2}}}/>
      <Typography variant="caption" sx={{color:info[v].c,fontSize:'0.7rem'}}>{info[v].l}</Typography>
    </Box>
  );
};

const STEPS = ['الدولة','القطاع','الشركة','المسؤول','الخطة','مراجعة'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const AR = ['ar','ur'].includes(i18n.language);
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm]     = useState({
    country:'SA', city:'الرياض',
    industry:'', companyName:'', companyNameEn:'', phone:'',
    commercialReg:'', vatNumber:'',
    name:'', email:'', adminPhone:'', password:'', confirmPw:'',
    plan:'trial'
  });

  const selectedCountry = useMemo(() =>
    BUILT_IN_COUNTRIES.find(c => c.code === form.country) || BUILT_IN_COUNTRIES[0],
    [form.country]
  );

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}));

  const selectedInd = useMemo(() => {
    for(const g of GROUPS) for(const i of g.industries) if(i.id===form.industry) return {...i, groupColor:g.color};
    return null;
  },[form.industry]);

  const filteredGroups = useMemo(() => {
    if(!search) return GROUPS;
    const q = search.toLowerCase();
    return GROUPS.map(g=>({...g,industries:g.industries.filter(i=>i.label.includes(q)||i.labelEn.toLowerCase().includes(q)||i.desc.includes(q))}))
      .filter(g=>g.industries.length>0);
  },[search]);

  const validate = () => {
    if(step===0 && !form.country) return AR?'يرجى اختيار الدولة':'Please select a country';
    if(step===1 && !form.industry) return AR?'يرجى اختيار القطاع':'Please select a sector';
    if(step===2){
      if(!form.companyName.trim()) return AR?'اسم الشركة مطلوب':'Company name required';
      const crClean = form.commercialReg.replace(/[\s-]/g,'');
      if(form.country==='SA' && crClean && !/^\d{10}$/.test(crClean)) return AR?'السجل التجاري 10 أرقام':'CR must be 10 digits';
      const vatClean = form.vatNumber.replace(/\s/g,'');
      if(form.country==='SA' && vatClean && !/^3\d{14}$/.test(vatClean)) return AR?'الرقم الضريبي 15 رقم يبدأ بـ 3':'VAT: 15 digits starting with 3';
    }
    if(step===3){
      if(!form.name.trim()) return AR?'الاسم مطلوب':'Name required';
      if(!form.email.trim()||!/\S+@\S+\.\S+/.test(form.email)) return AR?'بريد إلكتروني غير صالح':'Invalid email';
      if(!form.password||form.password.length<8) return AR?'كلمة المرور 8 أحرف على الأقل':'Password min 8 chars';
      if(form.password!==form.confirmPw) return AR?'كلمتا المرور غير متطابقتين':'Passwords do not match';
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
        industry:form.industry, plan:form.plan, phone:form.adminPhone,
        city:form.city, country:form.country,
        commercialReg:form.commercialReg.replace(/[\s-]/g,''),
        vatNumber:form.vatNumber.replace(/\s/g,''),
      });
      if(res.data.success){
        const u=res.data.data?.user||{};
        localStorage.setItem('token',res.data.token);
        localStorage.setItem('userId',u._id||'');
        localStorage.setItem('userName',u.name||form.name);
        localStorage.setItem('userRole',u.role||'admin');
        localStorage.setItem('userIndustry',form.industry);
        localStorage.setItem('userCompany',form.companyName);
        localStorage.setItem('userCountry',form.country);
        navigate('/dashboard');
      }
    } catch(err){ setError(err.response?.data?.message||t('common.error')); setStep(3); }
    finally{ setLoading(false); }
  };

  const indColor = selectedInd?.groupColor || '#1a73e8';

  return (
    <Box sx={{minHeight:'100vh',display:'flex',background:'#060d1a',overflow:'hidden',position:'relative'}}>
      {/* Background orbs */}
      {[{s:500,x:-80,y:-80,c:'rgba(26,115,232,0.10)'},{s:400,x:'65%',y:'55%',c:'rgba(108,71,255,0.09)'}].map((o,i)=>(
        <Box key={i} sx={{position:'absolute',width:o.s,height:o.s,left:o.x,top:o.y,borderRadius:'50%',background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      ))}

      {/* Language selector top */}
      <Box sx={{position:'absolute',top:16,right:AR?'auto':20,left:AR?20:'auto',zIndex:10}}>
        <LanguageSelector onDark />
      </Box>

      {/* LEFT panel */}
      <Box sx={{display:{xs:'none',lg:'flex'},flex:1,flexDirection:'column',justifyContent:'center',alignItems:'center',p:6,zIndex:1}}>
        <Box sx={{textAlign:'center',mb:4}}>
          <Box sx={{width:72,height:72,borderRadius:'18px',mx:'auto',mb:2.5,
            background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 0 40px rgba(26,115,232,0.4)'}}>
            <Typography sx={{fontSize:36,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif',letterSpacing:'-1px'}}>W</Typography>
          </Box>
          <Typography sx={{fontSize:28,fontWeight:800,color:'#fff'}}>Wassel ERP</Typography>
          <Typography sx={{color:'rgba(255,255,255,0.4)',fontSize:11,mt:0.5,letterSpacing:2,textTransform:'uppercase'}}>
            27 {AR?'دولة':'countries'} · 69 {AR?'قطاع':'sectors'}
          </Typography>
        </Box>

        {/* Preview */}
        {form.country && step >= 0 && (
          <Box sx={{width:280,mb:3}}>
            <TaxInfo countryCode={form.country} />
          </Box>
        )}

        {selectedInd && (
          <Box sx={{width:280,bgcolor:'rgba(255,255,255,0.06)',border:`1px solid ${indColor}40`,borderRadius:3,p:2.5,mt:1}}>
            <Typography sx={{fontSize:28,mb:0.5}}>{selectedInd.icon}</Typography>
            <Typography sx={{color:'#fff',fontWeight:700,fontSize:16,mb:0.3}}>{selectedInd.label}</Typography>
            <Typography sx={{color:'rgba(255,255,255,0.5)',fontSize:12}}>{selectedInd.desc}</Typography>
          </Box>
        )}
      </Box>

      {/* RIGHT — form */}
      <Box sx={{flex:{xs:1,lg:'0 0 560px'},display:'flex',alignItems:'flex-start',justifyContent:'center',p:{xs:2,sm:3},zIndex:1,overflowY:'auto',maxHeight:'100vh'}}>
        <Grow in timeout={500}>
          <Box sx={{width:'100%',maxWidth:510,bgcolor:'rgba(255,255,255,0.97)',borderRadius:4,p:{xs:3,sm:4},boxShadow:'0 32px 100px rgba(0,0,0,0.5)',my:3}}>

            {/* Mobile: logo + lang */}
            <Box sx={{display:{xs:'flex',lg:'none'},alignItems:'center',gap:1.5,mb:3}}>
              <Box sx={{width:36,height:36,borderRadius:'10px',background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Typography sx={{fontSize:18,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif'}}>W</Typography>
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{flex:1}}>Wassel ERP</Typography>
              <LanguageSelector variant="icon"/>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>
              {AR?'إنشاء حساب جديد':'Create New Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb:2.5}}>
              {AR?`الخطوة ${step+1} من ${STEPS.length} · ${STEPS[step]}`:`Step ${step+1} of ${STEPS.length}`}
            </Typography>

            <Stepper activeStep={step} alternativeLabel sx={{mb:3}}>
              {STEPS.map((l,i)=>(
                <Step key={i} completed={step>i}>
                  <StepLabel sx={{'& .MuiStepLabel-label':{fontSize:'0.6rem'}}}>{l}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{mb:2,borderRadius:2,fontSize:'0.83rem'}} onClose={()=>setError('')}>{error}</Alert>}

            {/* ══ STEP 0: COUNTRY ══ */}
            {step===0 && (
              <Box>
                <Box sx={{display:'flex',alignItems:'center',gap:1,mb:2}}>
                  <Language sx={{color:'#1a73e8'}}/>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {AR?'اختر دولة الشركة':'Select Company Country'}
                  </Typography>
                </Box>
                <CountrySelector
                  value={form.country}
                  onChange={v=>setForm(p=>({...p,country:v,city:''}))}
                  onCountryData={(c)=>setForm(p=>({...p,country:c.code}))}
                  showVAT showCurrency required
                />
                {form.country && (
                  <Box sx={{mt:2}}>
                    <TaxInfo countryCode={form.country} />
                  </Box>
                )}
                {/* City */}
                {form.country && (
                  <Box sx={{mt:2}}>
                    <TextField label={AR?'المدينة':'City'} value={form.city} fullWidth size="small"
                      onChange={set('city')} select>
                      {(BUILT_IN_COUNTRIES.find(c=>c.code===form.country)?.cities||[]).length > 0
                        ? BUILT_IN_COUNTRIES.find(c=>c.code===form.country).cities.map(c=>
                            <MenuItem key={c} value={c}>{c}</MenuItem>)
                        : <MenuItem value="">—</MenuItem>
                      }
                    </TextField>
                    {(BUILT_IN_COUNTRIES.find(c=>c.code===form.country)?.cities||[]).length===0 && (
                      <TextField label={AR?'المدينة':'City'} value={form.city} fullWidth size="small" sx={{mt:1}}
                        onChange={set('city')} placeholder={AR?'اكتب اسم المدينة':'Enter city name'}/>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* ══ STEP 1: INDUSTRY ══ */}
            {step===1 && (
              <Box>
                <TextField size="small" fullWidth placeholder={AR?'ابحث: مطعم، مستشفى، تجارة...':'Search: restaurant, hospital...'}
                  value={search} onChange={e=>setSearch(e.target.value)} sx={{mb:2}}
                  InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18,color:'text.secondary'}}/></InputAdornment>}}/>
                <Box sx={{maxHeight:380,overflowY:'auto',pr:0.5}}>
                  {filteredGroups.map(g=>(
                    <Box key={g.id} sx={{mb:2}}>
                      <Box sx={{display:'flex',alignItems:'center',gap:1,mb:1}}>
                        <Typography sx={{fontSize:14}}>{g.icon}</Typography>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{textTransform:'uppercase',letterSpacing:0.8,fontSize:'0.68rem'}}>
                          {AR?g.label:g.labelEn}
                        </Typography>
                      </Box>
                      <Grid container spacing={1}>
                        {g.industries.map(ind=>(
                          <Grid item xs={6} key={ind.id}>
                            <Box onClick={()=>setForm(p=>({...p,industry:ind.id}))}
                              sx={{p:1.2,borderRadius:2,cursor:'pointer',display:'flex',alignItems:'center',gap:1,
                                border:'1.5px solid',
                                borderColor:form.industry===ind.id?g.color:'divider',
                                bgcolor:form.industry===ind.id?`${g.color}10`:'transparent',
                                transition:'all 0.15s','&:hover':{borderColor:g.color,bgcolor:`${g.color}08`}}}>
                              <Typography sx={{fontSize:18,flexShrink:0}}>{ind.icon}</Typography>
                              <Box sx={{minWidth:0}}>
                                <Typography variant="caption" fontWeight={700} display="block"
                                  sx={{color:form.industry===ind.id?g.color:'text.primary',fontSize:'0.72rem',lineHeight:1.2,
                                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                  {AR?ind.label:ind.labelEn}
                                </Typography>
                                <Typography variant="caption" color="text.secondary"
                                  sx={{fontSize:'0.62rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>
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
                    <Typography sx={{fontSize:18}}>{selectedInd?.icon}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{color:indColor}}>{selectedInd?.label}</Typography>
                    <Button size="small" onClick={()=>setForm(p=>({...p,industry:''}))} sx={{ml:'auto',fontSize:'0.7rem'}}>
                      {AR?'تغيير':'Change'}
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* ══ STEP 2: COMPANY ══ */}
            {step===2 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {/* Country + tax reminder */}
                {selectedCountry && <TaxInfo countryCode={form.country} compact/>}

                <TextField label={`${AR?'اسم الشركة / المنشأة':'Company Name'} *`} value={form.companyName} onChange={set('companyName')} fullWidth required/>
                <TextField label="Company Name (English)" value={form.companyNameEn} onChange={set('companyNameEn')} fullWidth/>
                <TextField label={AR?'رقم الهاتف':'Phone'} value={form.phone} onChange={set('phone')} fullWidth/>

                <Divider><Typography variant="caption" color="text.secondary">
                  {AR?'المعلومات القانونية':'Legal Information'}
                </Typography></Divider>

                {/* Saudi-specific */}
                {form.country==='SA' ? (
                  <>
                    <TextField
                      label={AR?'رقم السجل التجاري الموحد (10 أرقام)':'CR Number (10 digits)'}
                      value={form.commercialReg}
                      onChange={e=>setForm(p=>({...p,commercialReg:e.target.value.replace(/[^\d]/g,'').slice(0,10)}))}
                      fullWidth inputProps={{maxLength:10,inputMode:'numeric',dir:'ltr'}}
                      helperText={form.commercialReg.length>0&&form.commercialReg.length!==10?`${form.commercialReg.length}/10 — يجب أن يكون 10 أرقام`:''}
                      error={form.commercialReg.length>0&&form.commercialReg.length!==10}
                      InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>,sx:{fontFamily:'monospace',letterSpacing:2}}}/>
                    <TextField
                      label={AR?'الرقم الضريبي VAT (15 رقم يبدأ بـ 3)':'VAT Number (15 digits, starts 3)'}
                      value={form.vatNumber}
                      onChange={e=>setForm(p=>({...p,vatNumber:e.target.value.replace(/[^\d]/g,'').slice(0,15)}))}
                      fullWidth inputProps={{maxLength:15,inputMode:'numeric',dir:'ltr'}}
                      helperText={form.vatNumber.length>0&&!/^3\d{14}$/.test(form.vatNumber)?`${form.vatNumber.length}/15 — يجب أن يبدأ بـ 3`:''}
                      error={form.vatNumber.length>0&&!/^3\d{14}$/.test(form.vatNumber)}
                      InputProps={{startAdornment:<InputAdornment position="start">🧾</InputAdornment>,sx:{fontFamily:'monospace',letterSpacing:1.5}}}/>
                  </>
                ) : (
                  <>
                    <TextField label={AR?'رقم التسجيل التجاري':'Business Registration No.'} value={form.commercialReg} onChange={set('commercialReg')} fullWidth InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>}}/>
                    <TextField label={`${AR?'الرقم الضريبي':'Tax/VAT Number'} (${selectedCountry?.currency})`} value={form.vatNumber} onChange={set('vatNumber')} fullWidth InputProps={{startAdornment:<InputAdornment position="start">🧾</InputAdornment>}}/>
                  </>
                )}
              </Box>
            )}

            {/* ══ STEP 3: ADMIN ══ */}
            {step===3 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                <TextField label={`${AR?'الاسم الكامل':'Full Name'} *`} value={form.name} onChange={set('name')} fullWidth required InputProps={{startAdornment:<InputAdornment position="start">👤</InputAdornment>}}/>
                <TextField label={`${AR?'البريد الإلكتروني':'Email'} *`} type="email" value={form.email} onChange={set('email')} fullWidth required InputProps={{startAdornment:<InputAdornment position="start">📧</InputAdornment>}}/>
                <TextField label={AR?'رقم الجوال':'Mobile'} value={form.adminPhone} onChange={set('adminPhone')} fullWidth InputProps={{startAdornment:<InputAdornment position="start">📱</InputAdornment>}}/>
                <Box>
                  <TextField label={`${AR?'كلمة المرور':'Password'} *`} type={showPw?'text':'password'} value={form.password} onChange={set('password')} fullWidth required
                    InputProps={{
                      startAdornment:<InputAdornment position="start">🔒</InputAdornment>,
                      endAdornment:<InputAdornment position="end">
                        <Box onClick={()=>setShowPw(v=>!v)} sx={{cursor:'pointer',display:'flex',color:'text.secondary'}}>
                          {showPw?<Visibility sx={{fontSize:18}}/>:<VisibilityOff sx={{fontSize:18}}/>}
                        </Box>
                      </InputAdornment>
                    }}/>
                  {form.password && <StrBar v={pwStrength(form.password)}/>}
                </Box>
                <TextField label={`${AR?'تأكيد كلمة المرور':'Confirm Password'} *`} type={showPw?'text':'password'} value={form.confirmPw} onChange={set('confirmPw')} fullWidth required
                  error={!!form.confirmPw&&form.password!==form.confirmPw}
                  helperText={form.confirmPw&&form.password!==form.confirmPw?'⚠ '+( AR?'غير متطابقة':'Not matching'):''}
                  InputProps={{startAdornment:<InputAdornment position="start">🔐</InputAdornment>}}/>
              </Box>
            )}

            {/* ══ STEP 4: PLAN ══ */}
            {step===4 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {PLANS.map(pl=>(
                  <Box key={pl.id} onClick={()=>setForm(p=>({...p,plan:pl.id}))}
                    sx={{p:2,borderRadius:2.5,cursor:'pointer',border:'2px solid',
                      borderColor:form.plan===pl.id?pl.color:'divider',
                      bgcolor:form.plan===pl.id?`${pl.color}0f`:'transparent',
                      transition:'all 0.18s','&:hover':{borderColor:pl.color}}}>
                    <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
                        <Typography sx={{fontSize:22}}>{pl.icon}</Typography>
                        <Box>
                          <Typography fontWeight={700} sx={{color:form.plan===pl.id?pl.color:'text.primary'}}>{pl.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{pl.users} {AR?'مستخدم':'users'}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{textAlign:'right'}}>
                        <Typography fontWeight={800} sx={{color:pl.color}}>{AR?pl.price:pl.priceEn}</Typography>
                        <Typography variant="caption" color="text.secondary">{pl.period}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* ══ STEP 5: REVIEW ══ */}
            {step===5 && (
              <Box>
                <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2.5,mb:2}}>
                  <Typography variant="body2" fontWeight={700} gutterBottom>{AR?'ملخص الحساب':'Account Summary'}</Typography>
                  {[
                    [selectedCountry?.flag+' '+(AR?'الدولة':'Country'), AR?selectedCountry?.name:selectedCountry?.nameEn],
                    [selectedInd?.icon+' '+(AR?'القطاع':'Sector'), AR?selectedInd?.label:selectedInd?.labelEn],
                    ['🏢 '+(AR?'الشركة':'Company'), form.companyName],
                    ['📍 '+(AR?'المدينة':'City'), form.city],
                    ...(form.commercialReg?[['🔢 '+(AR?'السجل التجاري':'CR'), form.commercialReg]]: []),
                    ...(form.vatNumber?[['🧾 '+(AR?'الرقم الضريبي':'VAT'), form.vatNumber]]:[]),
                    ['📦 '+(AR?'الخطة':'Plan'), PLANS.find(p=>p.id===form.plan)?.label],
                    ['👤 '+(AR?'المسؤول':'Admin'), form.name],
                    ['📧 Email', form.email],
                  ].map(([k,v])=>(
                    <Box key={k} sx={{display:'flex',justifyContent:'space-between',py:0.7,borderBottom:'1px solid #eee'}}>
                      <Typography variant="caption" color="text.secondary">{k}</Typography>
                      <Typography variant="caption" fontWeight={600}>{v||'—'}</Typography>
                    </Box>
                  ))}
                </Box>
                {/* Tax reminder */}
                <TaxInfo countryCode={form.country} compact/>
              </Box>
            )}

            {/* Navigation */}
            <Box sx={{display:'flex',gap:1.5,mt:3}}>
              {step>0 && (
                <Button variant="outlined" onClick={()=>{setError('');setStep(s=>s-1);}} sx={{flex:1,py:1.3,borderRadius:2,fontWeight:600}}>
                  ← {AR?'السابق':'Back'}
                </Button>
              )}
              {step<5 ? (
                <Button variant="contained" onClick={next}
                  sx={{flex:2,py:1.3,fontWeight:700,borderRadius:2,
                    background:`linear-gradient(135deg,${indColor||'#1a73e8'},${indColor||'#1a73e8'}cc)`,
                    boxShadow:`0 4px 16px ${indColor||'#1a73e8'}35`}}>
                  {AR?'التالي':'Next'} →
                </Button>
              ) : (
                <Button variant="contained" onClick={submit} disabled={loading}
                  sx={{flex:2,py:1.3,fontWeight:700,borderRadius:2,
                    background:'linear-gradient(135deg,#34a853,#2d7a3a)',
                    boxShadow:'0 4px 16px rgba(52,168,83,0.35)'}}>
                  {loading?<CircularProgress size={22} color="inherit"/>:(AR?'🚀 إطلاق الحساب':'🚀 Create Account')}
                </Button>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{mt:2.5}}>
              {AR?'لديك حساب؟':'Have an account?'}{' '}
              <Link to="/login" style={{color:'#1a73e8',fontWeight:700,textDecoration:'none'}}>
                {AR?'سجّل دخولك':'Sign In'}
              </Link>
            </Typography>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
