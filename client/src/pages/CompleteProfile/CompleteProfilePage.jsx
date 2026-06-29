import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Grow, Paper, Chip, InputAdornment, MenuItem, Tooltip,
  LinearProgress, Divider
} from '@mui/material';
import { Business, Receipt, Category, CheckCircle, Info, Lock } from '@mui/icons-material';
import api from '../../services/api';
import LanguageSelector from '../../components/LanguageSelector';

const INDUSTRY_LABELS = {
  trading_general:'تجارة عامة', retail:'تجزئة', wholesale:'جملة', ecommerce:'تجارة إلكترونية',
  restaurant:'مطعم', cafe:'كافيه', catering:'تموين', hotel:'فندق', furnished_apartments:'شقق مفروشة',
  hospital:'مستشفى', polyclinic:'مستوصف', clinic:'عيادة', dental:'أسنان', pharmacy:'صيدلية',
  medical_lab:'مختبر', radiology:'أشعة', physiotherapy:'علاج طبيعي', optometry:'بصريات', veterinary:'بيطري',
  university:'جامعة', school:'مدرسة', kindergarten:'روضة', training_center:'تدريب', language_institute:'لغات',
  driving_school:'قيادة', quran_institute:'تحفيظ قرآن',
  salon_ladies:'صالون نسائي', salon_gents:'صالون رجالي', spa:'سبا', gym:'نادي رياضي', medical_spa:'تجميل طبي',
  construction_general:'مقاولات', mep:'كهرباء وسباكة', interior_design:'تصميم داخلي',
  real_estate:'تطوير عقاري', property_management:'إدارة أملاك', real_estate_broker:'وساطة عقارية',
  freight:'شحن وجمارك', delivery:'توصيل', warehouse_storage:'مستودعات', transportation:'نقل ركاب',
  manufacturing:'تصنيع', food_production:'صناعات غذائية',
  consulting:'استشارات', law_firm:'محاماة', accounting_firm:'محاسبة', it_company:'تقنية',
  engineering:'هندسة', hr_company:'استقدام', security_company:'حراسة', cleaning:'نظافة',
  maintenance:'صيانة', advertising:'إعلان',
  exchange:'صرافة', insurance:'تأمين', investment:'استثمار',
  car_dealership:'وكالة سيارات', car_workshop:'ورشة سيارات',
  agriculture:'زراعة', events:'فعاليات', media:'إعلام', sport_club:'نادي رياضي', amusement:'ترفيه',
  ngo:'جمعية خيرية', waqf:'وقف', telecom:'اتصالات', oil_gas:'نفط وغاز', other:'أخرى'
};

const INDUSTRY_GROUPS = [
  { group:'التجارة', types:['trading_general','retail','wholesale','ecommerce'] },
  { group:'الضيافة والغذاء', types:['restaurant','cafe','catering','hotel','furnished_apartments'] },
  { group:'الصحة والطب', types:['hospital','polyclinic','clinic','dental','pharmacy','medical_lab','radiology','physiotherapy','optometry','veterinary'] },
  { group:'التعليم والتدريب', types:['university','school','kindergarten','training_center','language_institute','driving_school','quran_institute'] },
  { group:'التجميل والعافية', types:['salon_ladies','salon_gents','spa','gym','medical_spa'] },
  { group:'الإنشاء والعقارات', types:['construction_general','mep','interior_design','real_estate','property_management','real_estate_broker'] },
  { group:'النقل واللوجستيك', types:['freight','delivery','warehouse_storage','transportation'] },
  { group:'التصنيع', types:['manufacturing','food_production'] },
  { group:'الخدمات المهنية', types:['consulting','law_firm','accounting_firm','it_company','engineering','hr_company','security_company','cleaning','maintenance','advertising'] },
  { group:'المالية والتأمين', types:['exchange','insurance','investment'] },
  { group:'السيارات', types:['car_dealership','car_workshop'] },
  { group:'الزراعة والفعاليات', types:['agriculture','events','media','sport_club','amusement'] },
  { group:'غير ربحي وأخرى', types:['ngo','waqf','telecom','oil_gas','other'] },
];

const validateCR  = (v) => /^\d{10}$/.test(v?.replace(/\s|-/g,''));
const validateVAT = (v) => /^3\d{14}$/.test(v?.replace(/\s/g,''));

export default function CompleteProfilePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const missing   = location.state?.missing || 'commercialReg';

  const [loading, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [company, setCompany] = useState(null);

  const [form, setForm] = useState({
    commercialReg: '', vatNumber: '', industry: ''
  });

  useEffect(() => {
    api.get('/api/company').then(r => {
      if (r.data.success) {
        const co = r.data.data;
        setCompany(co);
        setForm({
          commercialReg: co.commercialReg || '',
          vatNumber:     co.vatNumber || '',
          industry:      co.industry || ''
        });
      }
    }).catch(()=>{});
  }, []);

  const crValid  = validateCR(form.commercialReg);
  const vatValid = validateVAT(form.vatNumber);
  const indValid = !!form.industry;
  const allValid = crValid && vatValid && indValid;

  const progress = [crValid, vatValid, indValid].filter(Boolean).length;

  const handleSave = async () => {
    if (!allValid) { setError('يرجى إكمال جميع الحقول بشكل صحيح'); return; }
    setSaving(true); setError('');
    try {
      await api.put('/api/company', {
        commercialReg: form.commercialReg.replace(/\s|-/g,''),
        vatNumber:     form.vatNumber.replace(/\s/g,''),
        industry:      form.industry
      });

      // Update localStorage
      localStorage.setItem('userIndustry', form.industry);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      setError(e.response?.data?.message || 'فشل الحفظ. يرجى المحاولة مرة أخرى.');
    } finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <Box sx={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg, #060d1a 0%, #1a3a5c 100%)',
      position:'relative', overflow:'hidden', p:2
    }}>
      {/* Language selector */}
      <Box sx={{ position:'absolute', top:16, right:16, zIndex:10 }}>
        <LanguageSelector onDark />
      </Box>

      {/* Orbs */}
      {[{s:400,x:-100,y:-80,c:'rgba(26,115,232,0.12)'},{s:350,x:'70%',y:'60%',c:'rgba(108,71,255,0.09)'}].map((o,i)=>(
        <Box key={i} sx={{ position:'absolute',width:o.s,height:o.s,left:o.x,top:o.y,borderRadius:'50%',
          background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`,pointerEvents:'none' }}/>
      ))}
      <Box sx={{ position:'absolute',inset:0,opacity:0.025,pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
        backgroundSize:'60px 60px' }}/>

      <Grow in timeout={500}>
        <Paper elevation={0} sx={{
          width:'100%', maxWidth:520, borderRadius:4,
          p:{ xs:3, sm:4.5 },
          bgcolor:'rgba(255,255,255,0.97)',
          boxShadow:'0 32px 100px rgba(0,0,0,0.5)'
        }}>
          {/* Logo + title */}
          <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:3 }}>
            <Box sx={{ width:48,height:48,borderRadius:'12px',background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',
              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Typography sx={{ fontSize:24,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif' }}>W</Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>Wassel ERP</Typography>
              <Typography variant="caption" color="text.secondary">إكمال بيانات الشركة</Typography>
            </Box>
          </Box>

          {/* Alert */}
          <Alert severity="warning" icon={<Lock/>} sx={{ mb:3, borderRadius:2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              يجب إكمال البيانات للوصول إلى النظام
            </Typography>
            <Typography variant="caption">
              الرقم الموحد للسجل التجاري، الرقم الضريبي، والقطاع — مطلوبة لجميع الشركات وفق أنظمة هيئة الزكاة والضريبة والجمارك (ZATCA)
            </Typography>
          </Alert>

          {/* Progress */}
          <Box sx={{ mb:3 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
              <Typography variant="caption" color="text.secondary">اكتمال الملف</Typography>
              <Typography variant="caption" fontWeight={700} color={allValid?'success.main':'warning.main'}>
                {progress}/3
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress/3*100}
              sx={{ height:6, borderRadius:3,
                '& .MuiLinearProgress-bar':{ bgcolor: allValid?'#34a853':'#f57c00', borderRadius:3 } }}/>
          </Box>

          {error && <Alert severity="error" sx={{ mb:2.5, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb:2.5, borderRadius:2 }}>✅ تم الحفظ بنجاح! جارٍ التحويل...</Alert>}

          <Box sx={{ display:'flex', flexDirection:'column', gap:2.5 }}>

            {/* Commercial Registration */}
            <Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8 }}>
                <Business sx={{ fontSize:18, color:'#1a73e8' }}/>
                <Typography variant="body2" fontWeight={700}>الرقم الموحد للسجل التجاري *</Typography>
                <Tooltip title="رقم السجل التجاري مكوّن من 10 أرقام — يمكن الحصول عليه من Maroof أو السجل التجاري الورقي">
                  <Info sx={{ fontSize:16, color:'text.disabled', cursor:'help' }}/>
                </Tooltip>
                {crValid && <CheckCircle sx={{ fontSize:16, color:'#34a853', ml:'auto' }}/>}
              </Box>
              <TextField
                value={form.commercialReg}
                onChange={e => setForm(p=>({...p, commercialReg: e.target.value.replace(/[^\d]/g,'').slice(0,10)}))}
                placeholder="مثال: 1234567890"
                fullWidth size="small"
                error={form.commercialReg.length > 0 && !crValid}
                helperText={form.commercialReg.length>0 && !crValid ? '⚠ يجب أن يكون 10 أرقام' : form.commercialReg.length>0&&crValid?'✓ صحيح':'10 أرقام'}
                inputProps={{ maxLength:10, inputMode:'numeric', dir:'ltr' }}
                InputProps={{
                  startAdornment:<InputAdornment position="start"><Business sx={{ fontSize:18, color:crValid?'#34a853':'text.secondary' }}/></InputAdornment>,
                  sx:{ fontFamily:'monospace', fontSize:'1.1rem', letterSpacing:2,
                       borderColor:crValid?'#34a853':undefined }
                }}
                sx={{ '& .MuiOutlinedInput-root':{ borderRadius:2,
                  '&.Mui-focused fieldset':{borderColor:crValid?'#34a853':'#1a73e8'},
                  '& fieldset':{borderColor:crValid?'#34a853 !important':undefined} } }}
              />
              <Box sx={{ display:'flex', gap:1, mt:0.8, flexWrap:'wrap' }}>
                <Typography variant="caption" color="text.disabled">مصادر التحقق:</Typography>
                {[
                  { label:'Maroof', url:'https://maroof.sa' },
                  { label:'وزارة التجارة', url:'https://mc.gov.sa' },
                ].map(s=>(
                  <Chip key={s.label} label={s.label} size="small" clickable
                    onClick={()=>window.open(s.url,'_blank')}
                    sx={{ fontSize:'0.65rem', height:18 }}/>
                ))}
              </Box>
            </Box>

            {/* VAT Number */}
            <Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8 }}>
                <Receipt sx={{ fontSize:18, color:'#f57c00' }}/>
                <Typography variant="body2" fontWeight={700}>الرقم الضريبي (VAT) *</Typography>
                <Tooltip title="رقم تسجيل ضريبة القيمة المضافة، 15 رقماً يبدأ بـ 3. من بوابة ZATCA">
                  <Info sx={{ fontSize:16, color:'text.disabled', cursor:'help' }}/>
                </Tooltip>
                {vatValid && <CheckCircle sx={{ fontSize:16, color:'#34a853', ml:'auto' }}/>}
              </Box>
              <TextField
                value={form.vatNumber}
                onChange={e=>setForm(p=>({...p,vatNumber:e.target.value.replace(/[^\d]/g,'').slice(0,15)}))}
                placeholder="مثال: 300000000000003"
                fullWidth size="small"
                error={form.vatNumber.length>0&&!vatValid}
                helperText={form.vatNumber.length>0&&!vatValid?`⚠ يجب أن يبدأ بـ 3 ويكون 15 رقماً (${form.vatNumber.length}/15)`:form.vatNumber.length>0&&vatValid?'✓ صحيح':'15 رقماً يبدأ بـ 3'}
                inputProps={{ maxLength:15, inputMode:'numeric', dir:'ltr' }}
                InputProps={{
                  startAdornment:<InputAdornment position="start"><Receipt sx={{ fontSize:18, color:vatValid?'#34a853':'text.secondary' }}/></InputAdornment>,
                  sx:{ fontFamily:'monospace', fontSize:'1rem', letterSpacing:1.5 }
                }}
                sx={{ '& .MuiOutlinedInput-root':{ borderRadius:2,
                  '& fieldset':{borderColor:vatValid?'#34a853 !important':undefined} } }}
              />
              <Box sx={{ display:'flex', gap:1, mt:0.8 }}>
                <Typography variant="caption" color="text.disabled">للتحقق:</Typography>
                <Chip label="بوابة ZATCA" size="small" clickable
                  onClick={()=>window.open('https://zatca.gov.sa','_blank')}
                  sx={{ fontSize:'0.65rem',height:18 }}/>
              </Box>
            </Box>

            {/* Industry / Sector */}
            <Box>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8 }}>
                <Category sx={{ fontSize:18, color:'#7b1fa2' }}/>
                <Typography variant="body2" fontWeight={700}>القطاع الاقتصادي *</Typography>
                <Tooltip title="يُحدد القطاع الوحداتِ والواجهةَ المناسبة لنشاطك التجاري">
                  <Info sx={{ fontSize:16, color:'text.disabled', cursor:'help' }}/>
                </Tooltip>
                {indValid && <CheckCircle sx={{ fontSize:16, color:'#34a853', ml:'auto' }}/>}
              </Box>
              <TextField select fullWidth size="small" value={form.industry}
                onChange={set('industry')}
                sx={{ '& .MuiOutlinedInput-root':{ borderRadius:2,
                  '& fieldset':{borderColor:indValid?'#34a853 !important':undefined} } }}>
                <MenuItem value="" disabled><em>اختر القطاع...</em></MenuItem>
                {INDUSTRY_GROUPS.map(grp => [
                  <MenuItem key={`g-${grp.group}`} disabled sx={{ fontWeight:700, fontSize:'0.8rem', color:'text.secondary', bgcolor:'#f5f5f5' }}>
                    — {grp.group} —
                  </MenuItem>,
                  ...grp.types.map(t => (
                    <MenuItem key={t} value={t} sx={{ pl:3 }}>
                      {INDUSTRY_LABELS[t] || t}
                    </MenuItem>
                  ))
                ])}
              </TextField>
            </Box>
          </Box>

          <Divider sx={{ my:3 }}/>

          {/* Summary if all valid */}
          {allValid && (
            <Box sx={{ p:2, bgcolor:'#f1f8e9', borderRadius:2, mb:2.5, border:'1px solid #c5e1a5' }}>
              <Typography variant="caption" fontWeight={700} color="#2e7d32" gutterBottom display="block">
                ✓ ملخص البيانات
              </Typography>
              {[
                ['السجل التجاري', form.commercialReg],
                ['الرقم الضريبي', form.vatNumber],
                ['القطاع', INDUSTRY_LABELS[form.industry]||form.industry],
              ].map(([k,v])=>(
                <Box key={k} sx={{ display:'flex',justifyContent:'space-between',py:0.4 }}>
                  <Typography variant="caption" color="text.secondary">{k}</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ fontFamily:k!=='القطاع'?'monospace':'inherit' }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          )}

          <Button
            fullWidth variant="contained" size="large"
            onClick={handleSave} disabled={!allValid || loading || success}
            sx={{
              py:1.5, fontWeight:700, borderRadius:2, fontSize:'0.95rem',
              background: allValid ? 'linear-gradient(135deg,#1a73e8,#1557b0)' : undefined,
              boxShadow: allValid ? '0 4px 20px rgba(26,115,232,0.4)' : undefined,
            }}>
            {loading ? <CircularProgress size={22} color="inherit"/> :
             success ? '✓ تم الحفظ' :
             allValid ? 'حفظ وإكمال الدخول →' : 'أكمل البيانات المطلوبة'}
          </Button>

          <Typography variant="caption" color="text.disabled" display="block" textAlign="center" sx={{ mt:2 }}>
            🔒 بياناتك محمية ومشفّرة وفق معايير ZATCA
          </Typography>
        </Paper>
      </Grow>
    </Box>
  );
}
