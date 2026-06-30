import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Stepper, Step, StepLabel, MenuItem, Grid, Paper, Divider,
  InputAdornment, Chip, Grow, LinearProgress
} from '@mui/material';
import { Check, Visibility, VisibilityOff, Search, Language } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import CountrySelector, { BUILT_IN_COUNTRIES } from '../../components/CountrySelector';
import TaxInfo from '../../components/TaxInfo';
import FileUploader from '../../components/FileUploader';
import LanguageSelector from '../../components/LanguageSelector';

// ── Industry groups ─────────────────────────────────────────────────────────
const GROUPS = [
  { id:'trade',       label:'التجارة',         labelEn:'Trade',        icon:'🛒', color:'#1a73e8', industries:[
    {id:'trading_general',icon:'🏪',label:'تجارة عامة',labelEn:'General Trading'},
    {id:'retail',icon:'🛍️',label:'تجزئة',labelEn:'Retail'},
    {id:'wholesale',icon:'📦',label:'جملة وتوزيع',labelEn:'Wholesale'},
    {id:'ecommerce',icon:'🛒',label:'تجارة إلكترونية',labelEn:'E-Commerce'},
  ]},
  { id:'hospitality', label:'الضيافة والغذاء', labelEn:'Hospitality', icon:'🏨', color:'#ff6d00', industries:[
    {id:'restaurant',icon:'🍽️',label:'مطعم',labelEn:'Restaurant'},
    {id:'cafe',icon:'☕',label:'كافيه',labelEn:'Café'},
    {id:'catering',icon:'🍱',label:'تموين',labelEn:'Catering'},
    {id:'hotel',icon:'🏨',label:'فندق',labelEn:'Hotel'},
    {id:'furnished_apartments',icon:'🏠',label:'شقق مفروشة',labelEn:'Furnished Apts'},
  ]},
  { id:'health',      label:'الصحة والطب',    labelEn:'Healthcare',   icon:'🏥', color:'#e53935', industries:[
    {id:'hospital',icon:'🏥',label:'مستشفى',labelEn:'Hospital'},
    {id:'clinic',icon:'🩺',label:'عيادة',labelEn:'Clinic'},
    {id:'dental',icon:'🦷',label:'أسنان',labelEn:'Dental'},
    {id:'pharmacy',icon:'💊',label:'صيدلية',labelEn:'Pharmacy'},
    {id:'medical_lab',icon:'🔬',label:'مختبر',labelEn:'Lab'},
    {id:'physiotherapy',icon:'🏃',label:'علاج طبيعي',labelEn:'Physio'},
    {id:'optometry',icon:'👓',label:'بصريات',labelEn:'Optometry'},
    {id:'veterinary',icon:'🐾',label:'بيطري',labelEn:'Veterinary'},
  ]},
  { id:'education',   label:'التعليم',         labelEn:'Education',    icon:'🎓', color:'#283593', industries:[
    {id:'university',icon:'🎓',label:'جامعة / كلية',labelEn:'University'},
    {id:'school',icon:'🏫',label:'مدرسة',labelEn:'School'},
    {id:'kindergarten',icon:'🧒',label:'روضة / حضانة',labelEn:'Kindergarten'},
    {id:'training_center',icon:'📚',label:'مركز تدريب',labelEn:'Training Center'},
    {id:'language_institute',icon:'🌍',label:'معهد لغات',labelEn:'Language Inst.'},
    {id:'driving_school',icon:'🚗',label:'مدرسة قيادة',labelEn:'Driving School'},
  ]},
  { id:'beauty',      label:'التجميل والعافية',labelEn:'Beauty',       icon:'💅', color:'#ad1457', industries:[
    {id:'salon_ladies',icon:'💅',label:'صالون نسائي',labelEn:'Ladies Salon'},
    {id:'salon_gents',icon:'💈',label:'صالون رجالي',labelEn:'Gents Salon'},
    {id:'spa',icon:'🧖',label:'سبا ومساج',labelEn:'Spa'},
    {id:'gym',icon:'🏋️',label:'نادي رياضي',labelEn:'Gym'},
  ]},
  { id:'construction',label:'الإنشاء والعقارات',labelEn:'Construction', icon:'🏗️', color:'#e65100', industries:[
    {id:'construction_general',icon:'🏗️',label:'مقاولات',labelEn:'Contractor'},
    {id:'interior_design',icon:'🛋️',label:'تصميم داخلي',labelEn:'Interior Design'},
    {id:'real_estate',icon:'🏘️',label:'تطوير عقاري',labelEn:'Real Estate'},
    {id:'property_management',icon:'🏢',label:'إدارة أملاك',labelEn:'Prop. Mgmt'},
  ]},
  { id:'logistics',   label:'النقل واللوجستيك',labelEn:'Logistics',    icon:'🚚', color:'#1b5e20', industries:[
    {id:'freight',icon:'🚢',label:'شحن وجمارك',labelEn:'Freight'},
    {id:'delivery',icon:'🚚',label:'توصيل',labelEn:'Delivery'},
    {id:'transportation',icon:'🚌',label:'نقل ركاب',labelEn:'Transport'},
  ]},
  { id:'services',    label:'الخدمات المهنية', labelEn:'Services',     icon:'💼', color:'#283593', industries:[
    {id:'consulting',icon:'💼',label:'استشارات',labelEn:'Consulting'},
    {id:'law_firm',icon:'⚖️',label:'محاماة',labelEn:'Law Firm'},
    {id:'accounting_firm',icon:'📊',label:'محاسبة',labelEn:'Accounting Firm'},
    {id:'it_company',icon:'💻',label:'تقنية وبرمجيات',labelEn:'IT & Software'},
    {id:'engineering',icon:'📐',label:'مكتب هندسي',labelEn:'Engineering'},
    {id:'advertising',icon:'📢',label:'إعلان',labelEn:'Advertising'},
  ]},
  { id:'other',       label:'أخرى',            labelEn:'Other',        icon:'🏢', color:'#546e7a', industries:[
    {id:'manufacturing',icon:'🏭',label:'تصنيع',labelEn:'Manufacturing'},
    {id:'agriculture',icon:'🌾',label:'زراعة',labelEn:'Agriculture'},
    {id:'events',icon:'🎉',label:'فعاليات',labelEn:'Events'},
    {id:'ngo',icon:'❤️',label:'جمعية خيرية',labelEn:'NGO'},
    {id:'car_dealership',icon:'🚗',label:'وكالة سيارات',labelEn:'Car Dealer'},
    {id:'exchange',icon:'💱',label:'صرافة',labelEn:'Exchange'},
    {id:'other',icon:'🏢',label:'أخرى',labelEn:'Other'},
  ]},
];

const PLANS = [
  {id:'trial',    label:'تجريبي مجاني', labelEn:'Free Trial', price:'مجاناً',  priceEn:'Free', period:'30 يوم', users:10, icon:'🎁', color:'#34a853'},
  {id:'starter',  label:'Starter',      labelEn:'Starter',    price:'99 ر.س',  priceEn:'$26',  period:'/شهر',  users:25, icon:'🚀', color:'#1a73e8'},
  {id:'professional',label:'Professional',labelEn:'Professional',price:'299 ر.س',priceEn:'$79', period:'/شهر', users:100,icon:'⭐', color:'#9c27b0'},
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

// ══════════════════════════════════════════════════════════════════
export default function RegisterPage() {
  const navigate        = useNavigate();
  const { t, i18n }    = useTranslation();
  const AR              = ['ar','ur'].includes(i18n.language);

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false); // ← NEW: show success screen
  const [regDocuments, setRegDocuments] = useState([]); // company documents uploaded right after registration
  const [showPw,  setShowPw]  = useState(false);
  const [indSearch,setIndSearch]=useState('');
  const [form, setForm] = useState({
    country:'SA', city:'الرياض',
    industry:'', companyName:'', companyNameEn:'', phone:'',
    commercialReg:'', vatNumber:'',
    name:'', email:'', adminPhone:'', password:'', confirmPw:'',
    plan:'trial'
  });

  const selectedCountry = useMemo(()=>BUILT_IN_COUNTRIES.find(c=>c.code===form.country)||BUILT_IN_COUNTRIES[0],[form.country]);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const selectedInd = useMemo(()=>{
    for(const g of GROUPS) for(const i of g.industries) if(i.id===form.industry) return {...i,groupColor:g.color};
    return null;
  },[form.industry]);

  const filteredGroups = useMemo(()=>{
    if(!indSearch) return GROUPS;
    const q=indSearch.toLowerCase();
    return GROUPS.map(g=>({...g,industries:g.industries.filter(i=>i.label.includes(q)||i.labelEn.toLowerCase().includes(q))}))
      .filter(g=>g.industries.length>0);
  },[indSearch]);

  const validate=()=>{
    if(step===0 && !form.country) return 'يرجى اختيار الدولة';
    if(step===1 && !form.industry) return AR?'يرجى اختيار القطاع':'Please select a sector';
    if(step===2){
      if(!form.companyName.trim()) return AR?'اسم الشركة مطلوب':'Company name required';
      const cr=form.commercialReg.replace(/[\s-]/g,'');
      if(form.country==='SA'&&cr&&!/^\d{10}$/.test(cr)) return AR?'السجل التجاري 10 أرقام':'CR must be 10 digits';
      const vat=form.vatNumber.replace(/\s/g,'');
      if(form.country==='SA'&&vat&&!/^3\d{14}$/.test(vat)) return AR?'الرقم الضريبي 15 رقم يبدأ بـ 3':'VAT: 15 digits starting 3';
    }
    if(step===3){
      if(!form.name.trim()) return AR?'الاسم مطلوب':'Name required';
      if(!/\S+@\S+\.\S+/.test(form.email)) return AR?'بريد إلكتروني غير صالح':'Invalid email';
      if(!form.password||form.password.length<8) return AR?'كلمة المرور 8 أحرف على الأقل':'Min 8 chars';
      if(form.password!==form.confirmPw) return AR?'كلمتا المرور غير متطابقتين':'Passwords do not match';
    }
    return null;
  };

  const next=()=>{ const e=validate(); if(e){setError(e);return;} setError(''); setStep(s=>s+1); };

  const submit=async()=>{
    setLoading(true); setError('');
    try{
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
        localStorage.setItem('userRole',u.role||'owner');
        localStorage.setItem('userIndustry',form.industry);
        localStorage.setItem('userCompany',form.companyName);
        localStorage.setItem('userCountry',form.country);
        // Show success screen before navigating
        setSuccess(true);
      }
    } catch(err){ setError(err.response?.data?.message||t('common.error')); }
    finally{ setLoading(false); }
  };

  const indColor = selectedInd?.groupColor||'#1a73e8';

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if(success){
    return (
      <Box sx={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
        background:'#060d1a',p:3}}>
        <Grow in timeout={600}>
          <Paper sx={{borderRadius:4,p:{xs:3,sm:5},maxWidth:560,width:'100%',textAlign:'center',
            boxShadow:'0 32px 100px rgba(0,0,0,0.5)'}}>
            {/* Success icon */}
            <Box sx={{width:80,height:80,borderRadius:'50%',bgcolor:'#34a85318',
              border:'2px solid #34a853',display:'flex',alignItems:'center',justifyContent:'center',
              mx:'auto',mb:3}}>
              <Typography sx={{fontSize:40}}>✅</Typography>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>
              {AR?'تم إنشاء حسابك بنجاح!':'Account Created Successfully!'}
            </Typography>
            <Typography color="text.secondary" sx={{mb:3}}>
              {AR
                ? `مرحباً بك في Wassel ERP يا ${form.name}! شركتك "${form.companyName}" جاهزة الآن.`
                : `Welcome to Wassel ERP, ${form.name}! Your company "${form.companyName}" is ready.`}
            </Typography>

            {/* Company summary */}
            <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2,mb:3,textAlign:'right'}}>
              {[
                [selectedCountry?.flag+' '+(AR?'الدولة':'Country'), AR?selectedCountry?.name:selectedCountry?.nameEn],
                [selectedInd?.icon+' '+(AR?'القطاع':'Sector'), AR?selectedInd?.label:selectedInd?.labelEn],
                ['🏢 '+(AR?'الشركة':'Company'), form.companyName],
                ['📦 '+(AR?'الخطة':'Plan'), PLANS.find(p=>p.id===form.plan)?.label],
                ['👤 '+(AR?'الدور':'Role'), AR?'مالك الشركة (Owner)':'Company Owner'],
              ].map(([k,v])=>(
                <Box key={k} sx={{display:'flex',justifyContent:'space-between',py:0.6,
                  borderBottom:'1px solid #eee','&:last-child':{borderBottom:0}}}>
                  <Typography variant="caption" color="text.secondary">{k}</Typography>
                  <Typography variant="caption" fontWeight={700}>{v||'—'}</Typography>
                </Box>
              ))}
            </Box>

            {/* Optional: upload company documents right now */}
            <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2,mb:3,textAlign:AR?'right':'left'}}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{display:'block',mb:0.5}}>
                {AR?'📎 رفع المستندات الرسمية (اختياري — يمكنك إضافتها لاحقاً)':'📎 Upload Official Documents (optional — can be added later)'}
              </Typography>
              <FileUploader
                uploadUrl="/api/company/documents"
                deleteUrlBuilder={(fileId) => `/api/company/documents/${fileId}`}
                existingFiles={regDocuments}
                onChange={setRegDocuments}
                docTypeOptions={[
                  { value:'commercial_reg',  label:'Commercial Registration', labelAr:'السجل التجاري' },
                  { value:'vat_certificate', label:'VAT Certificate',         labelAr:'الشهادة الضريبية' },
                  { value:'license',         label:'License',                 labelAr:'رخصة' },
                  { value:'other',           label:'Other',                   labelAr:'أخرى' },
                ]}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{mb:3}}>
              {AR
                ? '🔐 باعتبارك أول مستخدم، لديك صلاحيات مالك الشركة الكاملة. يمكنك الآن:'
                : '🔐 As the first user, you have full Owner permissions. You can now:'}
            </Typography>

            {/* What to do next */}
            <Box sx={{display:'flex',flexDirection:'column',gap:1.5,mb:4}}>
              <Button variant="contained" size="large" fullWidth
                onClick={()=>navigate('/roles')}
                sx={{py:1.5,fontWeight:700,borderRadius:2,
                  background:'linear-gradient(135deg,#7b1fa2,#9c27b0)',
                  boxShadow:'0 4px 16px rgba(123,31,162,0.35)'}}>
                🔐 {AR?'إعداد الأدوار والصلاحيات':'Setup Roles & Permissions'}
              </Button>
              <Button variant="contained" size="large" fullWidth
                onClick={()=>navigate('/employees')}
                sx={{py:1.5,fontWeight:700,borderRadius:2,
                  background:'linear-gradient(135deg,#34a853,#2d7a3a)',
                  boxShadow:'0 4px 16px rgba(52,168,83,0.3)'}}>
                👤 {AR?'إضافة الموظفين وتعيين الأدوار':'Add Employees & Assign Roles'}
              </Button>
              <Button variant="outlined" size="large" fullWidth
                onClick={()=>navigate('/dashboard')}
                sx={{py:1.5,fontWeight:700,borderRadius:2}}>
                📊 {AR?'الذهاب للوحة التحكم':'Go to Dashboard'}
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary">
              {AR
                ? 'يمكنك دائماً العودة لإعداد الأدوار من قائمة الأدوار والصلاحيات في الشريط الجانبي'
                : 'You can always return to Roles & Permissions from the sidebar'}
            </Typography>
          </Paper>
        </Grow>
      </Box>
    );
  }

  // ── REGISTER FORM ──────────────────────────────────────────────────────────
  return (
    <Box sx={{minHeight:'100vh',display:'flex',background:'#060d1a',overflow:'hidden',position:'relative'}}>
      {/* bg orbs */}
      {[{s:500,x:-80,y:-80,c:'rgba(26,115,232,0.10)'},{s:400,x:'65%',y:'55%',c:'rgba(108,71,255,0.09)'}].map((o,i)=>(
        <Box key={i} sx={{position:'absolute',width:o.s,height:o.s,left:o.x,top:o.y,borderRadius:'50%',
          background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      ))}

      {/* Language selector */}
      <Box sx={{position:'absolute',top:16,right:AR?'auto':20,left:AR?20:'auto',zIndex:10}}>
        <LanguageSelector onDark/>
      </Box>

      {/* Left panel */}
      <Box sx={{display:{xs:'none',lg:'flex'},flex:1,flexDirection:'column',justifyContent:'center',alignItems:'center',p:6,zIndex:1}}>
        <Box sx={{textAlign:'center',mb:4}}>
          <Box sx={{width:72,height:72,borderRadius:'18px',mx:'auto',mb:2.5,
            background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 0 40px rgba(26,115,232,0.4)'}}>
            <Typography sx={{fontSize:36,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif'}}>W</Typography>
          </Box>
          <Typography sx={{fontSize:28,fontWeight:800,color:'#fff'}}>Wassel ERP</Typography>
          <Typography sx={{color:'rgba(255,255,255,0.4)',fontSize:11,mt:0.5,letterSpacing:2,textTransform:'uppercase'}}>
            27 {AR?'دولة':'countries'} · 69 {AR?'قطاع':'sectors'}
          </Typography>
        </Box>
        {form.country && <Box sx={{width:290,mb:3}}><TaxInfo countryCode={form.country}/></Box>}
        {selectedInd && (
          <Box sx={{width:290,bgcolor:'rgba(255,255,255,0.06)',border:`1px solid ${indColor}40`,borderRadius:3,p:2.5}}>
            <Typography sx={{fontSize:28,mb:0.5}}>{selectedInd.icon}</Typography>
            <Typography sx={{color:'#fff',fontWeight:700,fontSize:16,mb:0.3}}>{selectedInd.label}</Typography>
          </Box>
        )}
      </Box>

      {/* Right: form */}
      <Box sx={{flex:{xs:1,lg:'0 0 520px'},display:'flex',alignItems:'flex-start',justifyContent:'center',
        p:{xs:2,sm:3},zIndex:1,overflowY:'auto',maxHeight:'100vh'}}>
        <Grow in timeout={500}>
          <Box sx={{width:'100%',maxWidth:480,bgcolor:'rgba(255,255,255,0.97)',borderRadius:4,
            p:{xs:3,sm:4},boxShadow:'0 32px 100px rgba(0,0,0,0.5)',my:3}}>

            {/* Mobile logo */}
            <Box sx={{display:{xs:'flex',lg:'none'},alignItems:'center',gap:1.5,mb:3}}>
              <Box sx={{width:36,height:36,borderRadius:'10px',background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Typography sx={{fontSize:18,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif'}}>W</Typography>
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{flex:1}}>Wassel ERP</Typography>
              <LanguageSelector variant="icon"/>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>
              {AR?'إنشاء حساب جديد':'Create New Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb:2}}>
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

            {/* STEP 0: COUNTRY */}
            {step===0 && (
              <Box>
                <Box sx={{display:'flex',alignItems:'center',gap:1,mb:2}}>
                  <Language sx={{color:'#1a73e8'}}/>
                  <Typography variant="subtitle1" fontWeight={700}>{AR?'اختر دولة الشركة':'Select Company Country'}</Typography>
                </Box>
                <CountrySelector value={form.country}
                  onChange={v=>setForm(p=>({...p,country:v,city:''}))} showVAT showCurrency required/>
                {form.country && <Box sx={{mt:2}}><TaxInfo countryCode={form.country}/></Box>}
                {form.country && (
                  <Box sx={{mt:2}}>
                    <TextField label={AR?'المدينة':'City'} value={form.city} fullWidth size="small"
                      onChange={set('city')} select>
                      {(BUILT_IN_COUNTRIES.find(c=>c.code===form.country)?.cities||[]).map(c=>
                        <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                    {(BUILT_IN_COUNTRIES.find(c=>c.code===form.country)?.cities||[]).length===0 && (
                      <TextField label={AR?'المدينة':'City'} value={form.city} fullWidth size="small"
                        sx={{mt:1}} onChange={set('city')}/>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* STEP 1: INDUSTRY */}
            {step===1 && (
              <Box>
                <TextField size="small" fullWidth placeholder={AR?'ابحث: مطعم، مستشفى...':'Search: restaurant, hospital...'}
                  value={indSearch} onChange={e=>setIndSearch(e.target.value)} sx={{mb:2}}
                  InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18,color:'text.secondary'}}/></InputAdornment>}}/>
                <Box sx={{maxHeight:370,overflowY:'auto',pr:0.5}}>
                  {filteredGroups.map(g=>(
                    <Box key={g.id} sx={{mb:2}}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary"
                        sx={{textTransform:'uppercase',letterSpacing:0.8,fontSize:'0.65rem',display:'block',mb:0.8}}>
                        {g.icon} {AR?g.label:g.labelEn}
                      </Typography>
                      <Grid container spacing={0.8}>
                        {g.industries.map(ind=>(
                          <Grid item xs={6} key={ind.id}>
                            <Box onClick={()=>setForm(p=>({...p,industry:ind.id}))}
                              sx={{p:1.2,borderRadius:2,cursor:'pointer',display:'flex',alignItems:'center',gap:1,
                                border:'1.5px solid',
                                borderColor:form.industry===ind.id?g.color:'divider',
                                bgcolor:form.industry===ind.id?`${g.color}10`:'transparent',
                                transition:'all .15s','&:hover':{borderColor:g.color}}}>
                              <Typography sx={{fontSize:18,flexShrink:0}}>{ind.icon}</Typography>
                              <Box sx={{minWidth:0}}>
                                <Typography variant="caption" fontWeight={700} display="block"
                                  sx={{color:form.industry===ind.id?g.color:'text.primary',fontSize:'0.72rem',
                                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                  {AR?ind.label:ind.labelEn}
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
                  <Box sx={{mt:2,p:1.5,bgcolor:`${indColor}10`,borderRadius:2,border:`1px solid ${indColor}30`,
                    display:'flex',alignItems:'center',gap:1}}>
                    <Typography sx={{fontSize:18}}>{selectedInd?.icon}</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{color:indColor,flex:1}}>{AR?selectedInd?.label:selectedInd?.labelEn}</Typography>
                    <Button size="small" onClick={()=>setForm(p=>({...p,industry:''}))} sx={{fontSize:'0.7rem'}}>
                      {AR?'تغيير':'Change'}
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* STEP 2: COMPANY */}
            {step===2 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {selectedCountry && <TaxInfo countryCode={form.country} compact/>}
                <TextField label={`${AR?'اسم الشركة / المنشأة':'Company Name'} *`} value={form.companyName} onChange={set('companyName')} fullWidth required/>
                <TextField label="Company Name (English)" value={form.companyNameEn} onChange={set('companyNameEn')} fullWidth/>
                <TextField label={AR?'رقم الهاتف':'Phone'} value={form.phone} onChange={set('phone')} fullWidth/>
                <Divider><Typography variant="caption" color="text.secondary">{AR?'المعلومات القانونية':'Legal'}</Typography></Divider>
                {form.country==='SA' ? (
                  <>
                    <TextField
                      label={AR?'رقم السجل التجاري (10 أرقام)':'CR Number (10 digits)'}
                      value={form.commercialReg}
                      onChange={e=>setForm(p=>({...p,commercialReg:e.target.value.replace(/[^\d]/g,'').slice(0,10)}))}
                      fullWidth inputProps={{maxLength:10,dir:'ltr'}}
                      error={form.commercialReg.length>0&&form.commercialReg.length!==10}
                      helperText={form.commercialReg.length>0&&form.commercialReg.length!==10?`${form.commercialReg.length}/10`:''}
                      InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>}}/>
                    <TextField
                      label={AR?'الرقم الضريبي (15 رقم يبدأ بـ 3)':'VAT Number (starts 3, 15 digits)'}
                      value={form.vatNumber}
                      onChange={e=>setForm(p=>({...p,vatNumber:e.target.value.replace(/[^\d]/g,'').slice(0,15)}))}
                      fullWidth inputProps={{maxLength:15,dir:'ltr'}}
                      error={form.vatNumber.length>0&&!/^3\d{14}$/.test(form.vatNumber)}
                      helperText={form.vatNumber.length>0?`${form.vatNumber.length}/15`:''}
                      InputProps={{startAdornment:<InputAdornment position="start">🧾</InputAdornment>}}/>
                  </>
                ):(
                  <>
                    <TextField label={AR?'رقم التسجيل التجاري':'Business Registration'} value={form.commercialReg} onChange={set('commercialReg')} fullWidth InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>}}/>
                    <TextField label={AR?'الرقم الضريبي':'Tax/VAT Number'} value={form.vatNumber} onChange={set('vatNumber')} fullWidth InputProps={{startAdornment:<InputAdornment position="start">🧾</InputAdornment>}}/>
                  </>
                )}
              </Box>
            )}

            {/* STEP 3: ADMIN */}
            {step===3 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                <Alert severity="info" sx={{borderRadius:2,fontSize:'0.8rem'}}>
                  {AR?'📌 هذا الحساب سيكون مالك الشركة بصلاحيات كاملة':'📌 This account will be Company Owner with full permissions'}
                </Alert>
                <TextField label={`${AR?'الاسم الكامل':'Full Name'} *`} value={form.name} onChange={set('name')} fullWidth required InputProps={{startAdornment:<InputAdornment position="start">👤</InputAdornment>}}/>
                <TextField label={`${AR?'البريد الإلكتروني':'Email'} *`} type="email" value={form.email} onChange={set('email')} fullWidth required InputProps={{startAdornment:<InputAdornment position="start">📧</InputAdornment>}}/>
                <TextField label={AR?'رقم الجوال':'Mobile'} value={form.adminPhone} onChange={set('adminPhone')} fullWidth InputProps={{startAdornment:<InputAdornment position="start">📱</InputAdornment>}}/>
                <Box>
                  <TextField label={`${AR?'كلمة المرور':'Password'} *`} type={showPw?'text':'password'}
                    value={form.password} onChange={set('password')} fullWidth required
                    InputProps={{startAdornment:<InputAdornment position="start">🔒</InputAdornment>,
                      endAdornment:<InputAdornment position="end">
                        <Box onClick={()=>setShowPw(v=>!v)} sx={{cursor:'pointer',display:'flex',color:'text.secondary'}}>
                          {showPw?<Visibility sx={{fontSize:18}}/>:<VisibilityOff sx={{fontSize:18}}/>}
                        </Box>
                      </InputAdornment>}}/>
                  {form.password && <StrBar v={pwStrength(form.password)}/>}
                </Box>
                <TextField label={`${AR?'تأكيد كلمة المرور':'Confirm Password'} *`} type={showPw?'text':'password'}
                  value={form.confirmPw} onChange={set('confirmPw')} fullWidth required
                  error={!!form.confirmPw&&form.password!==form.confirmPw}
                  helperText={form.confirmPw&&form.password!==form.confirmPw?(AR?'⚠ غير متطابقة':'Not matching'):''}
                  InputProps={{startAdornment:<InputAdornment position="start">🔐</InputAdornment>}}/>
              </Box>
            )}

            {/* STEP 4: PLAN */}
            {step===4 && (
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {PLANS.map(pl=>(
                  <Box key={pl.id} onClick={()=>setForm(p=>({...p,plan:pl.id}))}
                    sx={{p:2,borderRadius:2.5,cursor:'pointer',border:'2px solid',
                      borderColor:form.plan===pl.id?pl.color:'divider',
                      bgcolor:form.plan===pl.id?`${pl.color}0f`:'transparent',
                      transition:'all .18s','&:hover':{borderColor:pl.color}}}>
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

            {/* STEP 5: REVIEW */}
            {step===5 && (
              <Box>
                <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2.5,mb:2}}>
                  <Typography variant="body2" fontWeight={700} gutterBottom>{AR?'ملخص الحساب':'Summary'}</Typography>
                  {[
                    [selectedCountry?.flag+' '+(AR?'الدولة':'Country'), AR?selectedCountry?.name:selectedCountry?.nameEn],
                    [selectedInd?.icon+' '+(AR?'القطاع':'Sector'), AR?selectedInd?.label:selectedInd?.labelEn],
                    ['🏢 '+(AR?'الشركة':'Company'), form.companyName],
                    ['📍 '+(AR?'المدينة':'City'), form.city],
                    ...(form.commercialReg?[['🔢 CR', form.commercialReg]]:[]),
                    ...(form.vatNumber?[['🧾 VAT', form.vatNumber]]:[]),
                    ['📦 '+(AR?'الخطة':'Plan'), PLANS.find(p=>p.id===form.plan)?.label],
                    ['👤 '+(AR?'المسؤول':'Admin'), form.name],
                    ['📧 Email', form.email],
                  ].map(([k,v])=>(
                    <Box key={k} sx={{display:'flex',justifyContent:'space-between',py:0.7,borderBottom:'1px solid #eee','&:last-child':{borderBottom:0}}}>
                      <Typography variant="caption" color="text.secondary">{k}</Typography>
                      <Typography variant="caption" fontWeight={600}>{v||'—'}</Typography>
                    </Box>
                  ))}
                </Box>
                <TaxInfo countryCode={form.country} compact/>
              </Box>
            )}

            {/* Navigation */}
            <Box sx={{display:'flex',gap:1.5,mt:3}}>
              {step>0&&<Button variant="outlined" onClick={()=>{setError('');setStep(s=>s-1);}} sx={{flex:1,py:1.3,borderRadius:2,fontWeight:600}}>
                ← {AR?'السابق':'Back'}
              </Button>}
              {step<5?(
                <Button variant="contained" onClick={next}
                  sx={{flex:2,py:1.3,fontWeight:700,borderRadius:2,
                    background:`linear-gradient(135deg,${indColor||'#1a73e8'},${indColor||'#1a73e8'}cc)`}}>
                  {AR?'التالي':'Next'} →
                </Button>
              ):(
                <Button variant="contained" onClick={submit} disabled={loading}
                  sx={{flex:2,py:1.3,fontWeight:700,borderRadius:2,
                    background:'linear-gradient(135deg,#34a853,#2d7a3a)'}}>
                  {loading?<CircularProgress size={22} color="inherit"/>:(AR?'🚀 إطلاق الحساب':'🚀 Create Account')}
                </Button>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{mt:2.5}}>
              {AR?'لديك حساب؟':'Have an account?'}{' '}
              <Link to="/login" style={{color:'#1a73e8',fontWeight:700,textDecoration:'none'}}>{AR?'سجّل دخولك':'Sign In'}</Link>
            </Typography>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
