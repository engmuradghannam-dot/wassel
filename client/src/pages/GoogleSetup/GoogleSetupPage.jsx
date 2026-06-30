
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Stepper, Step, StepLabel, MenuItem, Grid, Paper, Divider,
  InputAdornment, Grow
} from '@mui/material';
import { Check, Search, Language } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import CountrySelector, { BUILT_IN_COUNTRIES } from '../../components/CountrySelector';
import TaxInfo from '../../components/TaxInfo';
import LanguageSelector from '../../components/LanguageSelector';
import FileUploader from '../../components/FileUploader';

// Re-use same groups/plans from RegisterPage
const GROUPS = [
  { id:'trade', label:'التجارة', labelEn:'Trade', icon:'🛒', color:'#1a73e8', industries:[
    {id:'trading_general',icon:'🏪',label:'تجارة عامة',labelEn:'General Trading'},
    {id:'retail',icon:'🛍️',label:'تجزئة',labelEn:'Retail'},
    {id:'wholesale',icon:'📦',label:'جملة',labelEn:'Wholesale'},
    {id:'ecommerce',icon:'🛒',label:'تجارة إلكترونية',labelEn:'E-Commerce'},
  ]},
  { id:'hospitality', label:'الضيافة', labelEn:'Hospitality', icon:'🏨', color:'#ff6d00', industries:[
    {id:'restaurant',icon:'🍽️',label:'مطعم',labelEn:'Restaurant'},
    {id:'cafe',icon:'☕',label:'كافيه',labelEn:'Café'},
    {id:'hotel',icon:'🏨',label:'فندق',labelEn:'Hotel'},
    {id:'catering',icon:'🍱',label:'تموين',labelEn:'Catering'},
  ]},
  { id:'health', label:'الصحة', labelEn:'Healthcare', icon:'🏥', color:'#e53935', industries:[
    {id:'hospital',icon:'🏥',label:'مستشفى',labelEn:'Hospital'},
    {id:'clinic',icon:'🩺',label:'عيادة',labelEn:'Clinic'},
    {id:'dental',icon:'🦷',label:'أسنان',labelEn:'Dental'},
    {id:'pharmacy',icon:'💊',label:'صيدلية',labelEn:'Pharmacy'},
  ]},
  { id:'education', label:'التعليم', labelEn:'Education', icon:'🎓', color:'#283593', industries:[
    {id:'university',icon:'🎓',label:'جامعة',labelEn:'University'},
    {id:'school',icon:'🏫',label:'مدرسة',labelEn:'School'},
    {id:'training_center',icon:'📚',label:'مركز تدريب',labelEn:'Training'},
  ]},
  { id:'beauty', label:'التجميل', labelEn:'Beauty', icon:'💅', color:'#ad1457', industries:[
    {id:'salon_ladies',icon:'💅',label:'صالون نسائي',labelEn:'Ladies Salon'},
    {id:'salon_gents',icon:'💈',label:'صالون رجالي',labelEn:'Gents Salon'},
    {id:'gym',icon:'🏋️',label:'نادي رياضي',labelEn:'Gym'},
    {id:'spa',icon:'🧖',label:'سبا',labelEn:'Spa'},
  ]},
  { id:'construction', label:'الإنشاء والعقارات', labelEn:'Construction', icon:'🏗️', color:'#e65100', industries:[
    {id:'construction_general',icon:'🏗️',label:'مقاولات',labelEn:'Contractor'},
    {id:'real_estate',icon:'🏘️',label:'عقارات',labelEn:'Real Estate'},
    {id:'interior_design',icon:'🛋️',label:'تصميم داخلي',labelEn:'Interior'},
  ]},
  { id:'services', label:'الخدمات', labelEn:'Services', icon:'💼', color:'#283593', industries:[
    {id:'consulting',icon:'💼',label:'استشارات',labelEn:'Consulting'},
    {id:'law_firm',icon:'⚖️',label:'محاماة',labelEn:'Law Firm'},
    {id:'it_company',icon:'💻',label:'تقنية',labelEn:'IT'},
    {id:'accounting_firm',icon:'📊',label:'محاسبة',labelEn:'Accounting'},
  ]},
  { id:'other', label:'أخرى', labelEn:'Other', icon:'🏢', color:'#546e7a', industries:[
    {id:'manufacturing',icon:'🏭',label:'تصنيع',labelEn:'Manufacturing'},
    {id:'events',icon:'🎉',label:'فعاليات',labelEn:'Events'},
    {id:'ngo',icon:'❤️',label:'جمعية خيرية',labelEn:'NGO'},
    {id:'logistics',icon:'🚚',label:'لوجستيك',labelEn:'Logistics'},
    {id:'other',icon:'🏢',label:'أخرى',labelEn:'Other'},
  ]},
];

const PLANS = [
  {id:'trial',label:'تجريبي مجاني',labelEn:'Free Trial',price:'مجاناً',priceEn:'Free',period:'30 يوم',users:10,icon:'🎁',color:'#34a853'},
  {id:'starter',label:'Starter',labelEn:'Starter',price:'99 ر.س',priceEn:'$26',period:'/شهر',users:25,icon:'🚀',color:'#1a73e8'},
  {id:'professional',label:'Professional',labelEn:'Professional',price:'299 ر.س',priceEn:'$79',period:'/شهر',users:100,icon:'⭐',color:'#9c27b0'},
];

const STEPS = ['الدولة','القطاع','الشركة','الخطة','إطلاق'];

export default function GoogleSetupPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const AR = ['ar','ur'].includes(i18n.language);
  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [success, setSuccess] = useState(false);
  const [regDocuments, setRegDocuments] = useState([]);
  const [form, setForm] = useState({
    country:'SA', city:'الرياض', industry:'',
    companyName:'', companyNameEn:'', phone:'',
    commercialReg:'', vatNumber:'', plan:'trial'
  });

  const selectedCountry = useMemo(()=>BUILT_IN_COUNTRIES.find(c=>c.code===form.country)||BUILT_IN_COUNTRIES[0],[form.country]);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const selectedInd = useMemo(()=>{
    for(const g of GROUPS) for(const ind of g.industries) if(ind.id===form.industry) return {...ind,groupColor:g.color};
    return null;
  },[form.industry]);

  const filteredGroups = useMemo(()=>{
    if(!search) return GROUPS;
    const q=search.toLowerCase();
    return GROUPS.map(g=>({...g,industries:g.industries.filter(i=>i.label.includes(q)||i.labelEn.toLowerCase().includes(q))})).filter(g=>g.industries.length>0);
  },[search]);

  const validate=()=>{
    if(step===0&&!form.country) return 'يرجى اختيار الدولة';
    if(step===1&&!form.industry) return AR?'يرجى اختيار القطاع':'Please select your sector';
    if(step===2&&!form.companyName.trim()) return AR?'اسم الشركة مطلوب':'Company name required';
    return null;
  };
  const next=()=>{ const e=validate(); if(e){setError(e);return;} setError(''); setStep(s=>s+1); };

  const handleSubmit=async()=>{
    setLoading(true); setError('');
    try{
      const res=await api.post('/api/users/setup-company',{
        companyName:form.companyName, companyNameEn:form.companyNameEn||form.companyName,
        industry:form.industry, plan:form.plan, phone:form.phone,
        city:form.city, country:form.country,
        commercialReg:form.commercialReg.replace(/[\s-]/g,''),
        vatNumber:form.vatNumber.replace(/\s/g,''),
      });
      if(res.data.success){
        const u=res.data.data?.user||{};
        if (res.data.token) localStorage.setItem('token', res.data.token);
        localStorage.setItem('userRole',u.role||'owner');
        localStorage.setItem('userIndustry',form.industry);
        localStorage.setItem('userCompany',form.companyName);
        localStorage.setItem('userCountry',form.country);
        setSuccess(true);
      }
    }catch(err){ setError(err.response?.data?.message||t('common.error')); }
    finally{ setLoading(false); }
  };

  const indColor=selectedInd?.groupColor||'#1a73e8';
  const userName=localStorage.getItem('userName')||'';

  if(success) return (
    <Box sx={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#060d1a',p:3}}>
      <Grow in timeout={600}>
        <Paper sx={{borderRadius:4,p:{xs:3,sm:5},maxWidth:520,width:'100%',textAlign:'center',boxShadow:'0 32px 100px rgba(0,0,0,0.5)'}}>
          <Typography sx={{fontSize:64,mb:2}}>✅</Typography>
          <Typography variant="h5" fontWeight={800} gutterBottom>{AR?`مرحباً ${userName.split(' ')[0]}!`:`Welcome ${userName.split(' ')[0]}!`}</Typography>
          <Typography color="text.secondary" sx={{mb:3}}>{AR?`تم إنشاء شركة "${form.companyName}" بنجاح. أنت الآن مالك الشركة.`:`Company "${form.companyName}" created. You are now the Owner.`}</Typography>

          <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2,mb:3,textAlign:AR?'right':'left'}}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{display:'block',mb:0.5}}>
              {AR?'📎 رفع المستندات الرسمية (اختياري)':'📎 Upload Official Documents (optional)'}
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

          <Box sx={{display:'flex',flexDirection:'column',gap:1.5}}>
            <Button variant="contained" size="large" fullWidth onClick={()=>navigate('/roles')} sx={{py:1.5,fontWeight:700,borderRadius:2,background:'linear-gradient(135deg,#7b1fa2,#9c27b0)'}}>
              🔐 {AR?'إعداد الأدوار والصلاحيات':'Setup Roles & Permissions'}
            </Button>
            <Button variant="contained" size="large" fullWidth onClick={()=>navigate('/employees')} sx={{py:1.5,fontWeight:700,borderRadius:2,background:'linear-gradient(135deg,#34a853,#2d7a3a)'}}>
              👤 {AR?'إضافة الموظفين':'Add Employees'}
            </Button>
            <Button variant="outlined" size="large" fullWidth onClick={()=>navigate('/dashboard')} sx={{py:1.5,fontWeight:700,borderRadius:2}}>
              📊 {AR?'الذهاب للوحة التحكم':'Go to Dashboard'}
            </Button>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );

  return (
    <Box sx={{minHeight:'100vh',display:'flex',background:'#060d1a',overflow:'hidden',position:'relative'}}>
      <Box sx={{position:'absolute',top:16,right:AR?'auto':20,left:AR?20:'auto',zIndex:10}}>
        <LanguageSelector onDark/>
      </Box>

      <Box sx={{display:{xs:'none',lg:'flex'},flex:1,flexDirection:'column',justifyContent:'center',alignItems:'center',p:6,zIndex:1}}>
        <Box sx={{width:72,height:72,borderRadius:'18px',mb:3,background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(26,115,232,0.4)'}}>
          <Typography sx={{fontSize:36,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif'}}>W</Typography>
        </Box>
        <Typography sx={{fontSize:26,fontWeight:800,color:'#fff',mb:1}}>Wassel ERP</Typography>
        <Typography sx={{color:'rgba(255,255,255,0.5)',fontSize:12,textAlign:'center',mb:3}}>{AR?`مرحباً ${userName}!\nأكمل إعداد شركتك`:`Welcome ${userName}!\nComplete your company setup`}</Typography>
        {form.country&&<Box sx={{width:290,mb:2}}><TaxInfo countryCode={form.country}/></Box>}
        {selectedInd&&(
          <Box sx={{width:290,bgcolor:'rgba(255,255,255,0.06)',border:`1px solid ${indColor}40`,borderRadius:3,p:2.5}}>
            <Typography sx={{fontSize:28,mb:0.5}}>{selectedInd.icon}</Typography>
            <Typography sx={{color:'#fff',fontWeight:700,fontSize:16}}>{AR?selectedInd.label:selectedInd.labelEn}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{flex:{xs:1,lg:'0 0 520px'},display:'flex',alignItems:'flex-start',justifyContent:'center',p:{xs:2,sm:3},zIndex:1,overflowY:'auto',maxHeight:'100vh'}}>
        <Grow in timeout={500}>
          <Box sx={{width:'100%',maxWidth:480,bgcolor:'rgba(255,255,255,0.97)',borderRadius:4,p:{xs:3,sm:4},boxShadow:'0 32px 100px rgba(0,0,0,0.5)',my:3}}>

            <Box sx={{display:'flex',alignItems:'center',gap:2,mb:3,p:1.5,bgcolor:'#f0f5ff',borderRadius:2,border:'1px solid #1a73e830'}}>
              <Typography sx={{fontSize:22}}>🔐</Typography>
              <Box>
                <Typography variant="body2" fontWeight={700}>{AR?'تسجيل الدخول بـ Google':'Signed in with Google'}</Typography>
                <Typography variant="caption" color="text.secondary">{userName}</Typography>
              </Box>
            </Box>

            <Typography variant="h6" fontWeight={800} gutterBottom>{AR?'إعداد شركتك':'Setup Your Company'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb:2}}>{AR?`الخطوة ${step+1} من ${STEPS.length}`:`Step ${step+1} of ${STEPS.length}`}</Typography>

            <Stepper activeStep={step} alternativeLabel sx={{mb:3}}>
              {STEPS.map((l,i)=><Step key={i} completed={step>i}><StepLabel sx={{'& .MuiStepLabel-label':{fontSize:'0.62rem'}}}>{l}</StepLabel></Step>)}
            </Stepper>

            {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

            {step===0&&(
              <Box>
                <Box sx={{display:'flex',alignItems:'center',gap:1,mb:2}}><Language sx={{color:'#1a73e8'}}/><Typography variant="subtitle1" fontWeight={700}>{AR?'اختر دولة الشركة':'Select Company Country'}</Typography></Box>
                <CountrySelector value={form.country} onChange={v=>setForm(p=>({...p,country:v,city:''}))} showVAT showCurrency required/>
                {form.country&&<Box sx={{mt:2}}><TaxInfo countryCode={form.country}/></Box>}
                {form.country&&(
                  <TextField label={AR?'المدينة':'City'} value={form.city} fullWidth size="small" onChange={set('city')} select sx={{mt:2}}>
                    {(BUILT_IN_COUNTRIES.find(c=>c.code===form.country)?.cities||[]).map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                )}
              </Box>
            )}

            {step===1&&(
              <Box>
                <TextField size="small" fullWidth placeholder={AR?'ابحث عن قطاعك...':'Search your sector...'} value={search} onChange={e=>setSearch(e.target.value)} sx={{mb:2}}
                  InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18}}/></InputAdornment>}}/>
                <Box sx={{maxHeight:360,overflowY:'auto'}}>
                  {filteredGroups.map(g=>(
                    <Box key={g.id} sx={{mb:2}}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{textTransform:'uppercase',letterSpacing:0.8,fontSize:'0.65rem',display:'block',mb:0.8}}>{g.icon} {AR?g.label:g.labelEn}</Typography>
                      <Grid container spacing={0.8}>
                        {g.industries.map(ind=>(
                          <Grid item xs={6} key={ind.id}>
                            <Box onClick={()=>setForm(p=>({...p,industry:ind.id}))}
                              sx={{p:1.2,borderRadius:2,cursor:'pointer',display:'flex',alignItems:'center',gap:1,border:'1.5px solid',borderColor:form.industry===ind.id?g.color:'divider',bgcolor:form.industry===ind.id?`${g.color}10`:'transparent',transition:'all .15s','&:hover':{borderColor:g.color}}}>
                              <Typography sx={{fontSize:18,flexShrink:0}}>{ind.icon}</Typography>
                              <Typography variant="caption" fontWeight={700} sx={{color:form.industry===ind.id?g.color:'text.primary',fontSize:'0.72rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{AR?ind.label:ind.labelEn}</Typography>
                              {form.industry===ind.id&&<Check sx={{fontSize:14,color:g.color,flexShrink:0,ml:'auto'}}/>}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {step===2&&(
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {selectedCountry&&<TaxInfo countryCode={form.country} compact/>}
                <TextField label={`${AR?'اسم الشركة / المنشأة':'Company Name'} *`} value={form.companyName} onChange={set('companyName')} fullWidth required/>
                <TextField label="Company Name (English)" value={form.companyNameEn} onChange={set('companyNameEn')} fullWidth/>
                <TextField label={AR?'رقم الهاتف':'Phone'} value={form.phone} onChange={set('phone')} fullWidth/>
                <Divider><Typography variant="caption" color="text.secondary">{AR?'المعلومات القانونية (اختياري)':'Legal Info (optional)'}</Typography></Divider>
                <TextField label={form.country==='SA'?(AR?'رقم السجل التجاري (10 أرقام)':'CR Number'):(AR?'رقم التسجيل':'Business Reg.')} value={form.commercialReg} onChange={e=>setForm(p=>({...p,commercialReg:form.country==='SA'?e.target.value.replace(/[^\d]/g,'').slice(0,10):e.target.value}))} fullWidth InputProps={{startAdornment:<InputAdornment position="start">🏢</InputAdornment>}}/>
                <TextField label={form.country==='SA'?(AR?'الرقم الضريبي (15 رقم يبدأ بـ 3)':'VAT Number'):(AR?'الرقم الضريبي':'Tax Number')} value={form.vatNumber} onChange={e=>setForm(p=>({...p,vatNumber:form.country==='SA'?e.target.value.replace(/[^\d]/g,'').slice(0,15):e.target.value}))} fullWidth InputProps={{startAdornment:<InputAdornment position="start">🧾</InputAdornment>}}/>
              </Box>
            )}

            {step===3&&(
              <Box sx={{display:'flex',flexDirection:'column',gap:2}}>
                {PLANS.map(pl=>(
                  <Box key={pl.id} onClick={()=>setForm(p=>({...p,plan:pl.id}))}
                    sx={{p:2,borderRadius:2.5,cursor:'pointer',border:'2px solid',borderColor:form.plan===pl.id?pl.color:'divider',bgcolor:form.plan===pl.id?`${pl.color}0f`:'transparent',transition:'all .18s','&:hover':{borderColor:pl.color}}}>
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

            {step===4&&(
              <Box sx={{bgcolor:'#f8f9fa',borderRadius:2,p:2.5}}>
                <Typography variant="body2" fontWeight={700} gutterBottom>{AR?'مراجعة نهائية':'Final Review'}</Typography>
                {[
                  [selectedCountry?.flag+' '+(AR?'الدولة':'Country'), AR?selectedCountry?.name:selectedCountry?.nameEn],
                  [selectedInd?.icon+' '+(AR?'القطاع':'Sector'), AR?selectedInd?.label:selectedInd?.labelEn],
                  ['🏢 '+(AR?'الشركة':'Company'), form.companyName],
                  ['📍 '+(AR?'المدينة':'City'), form.city],
                  ...(form.commercialReg?[['🔢 CR', form.commercialReg]]:[]),
                  ['📦 '+(AR?'الخطة':'Plan'), PLANS.find(p=>p.id===form.plan)?.label],
                  ['🔐 '+(AR?'دورك':'Your Role'), AR?'مالك الشركة':'Company Owner'],
                ].map(([k,v])=>(
                  <Box key={k} sx={{display:'flex',justifyContent:'space-between',py:0.7,borderBottom:'1px solid #eee','&:last-child':{borderBottom:0}}}>
                    <Typography variant="caption" color="text.secondary">{k}</Typography>
                    <Typography variant="caption" fontWeight={700}>{v||'—'}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{display:'flex',gap:1.5,mt:3}}>
              {step>0&&<Button variant="outlined" onClick={()=>{setError('');setStep(s=>s-1);}} sx={{flex:1,py:1.3,borderRadius:2,fontWeight:600}}>← {AR?'السابق':'Back'}</Button>}
              {step<4?(
                <Button variant="contained" onClick={next} sx={{flex:2,py:1.3,fontWeight:700,borderRadius:2,background:`linear-gradient(135deg,${indColor},${indColor}cc)`}}>
                  {AR?'التالي':'Next'} →
                </Button>
              ):(
                <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{flex:2,py:1.3,fontWeight:700,borderRadius:2,background:'linear-gradient(135deg,#34a853,#2d7a3a)'}}>
                  {loading?<CircularProgress size={22} color="inherit"/>:(AR?'🚀 إطلاق الشركة':'🚀 Launch Company')}
                </Button>
              )}
            </Box>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
