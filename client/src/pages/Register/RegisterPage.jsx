import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Divider, Alert,
  CircularProgress, Grow, Stepper, Step, StepLabel,
  MenuItem, LinearProgress, Tooltip, InputAdornment
} from '@mui/material';
import { Check, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../services/api';

const PLANS = [
  { id: 'trial', label: 'تجريبي مجاني', desc: '30 يوم · 10 مستخدمين', color: '#34a853', icon: '🎁' },
  { id: 'starter', label: 'Starter', desc: '99 ر.س/شهر · 25 مستخدم', color: '#1a73e8', icon: '🚀' },
  { id: 'professional', label: 'Professional', desc: '299 ر.س/شهر · 100 مستخدم', color: '#9c27b0', icon: '⭐' },
];

const INDUSTRIES = [
  'تجارة عامة', 'استيراد وتصدير', 'مقاولات وإنشاءات', 'تصنيع وإنتاج',
  'خدمات مهنية', 'توزيع ولوجستيك', 'تقنية معلومات', 'تجزئة وبيع بالتجزئة', 'أخرى'
];

const pwStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
};

const StrBar = ({ v }) => {
  const colors = ['#e53935', '#f57c00', '#fbc02d', '#43a047'];
  const labels = ['ضعيفة', 'مقبولة', 'جيدة', 'قوية'];
  if (!v) return null;
  return (
    <Box sx={{ mt: 0.5 }}>
      <LinearProgress variant="determinate" value={v * 25}
        sx={{ height: 4, borderRadius: 2, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: colors[v - 1], borderRadius: 2 } }} />
      <Typography variant="caption" sx={{ color: colors[v - 1], fontSize: '0.7rem' }}>{labels[v - 1]}</Typography>
    </Box>
  );
};

const STEPS = ['معلومات الشركة', 'بيانات المسؤول', 'تأكيد وإطلاق'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm]     = useState({
    companyName: '', companyNameEn: '', industry: '', plan: 'trial',
    name: '', email: '', phone: '', password: '', confirmPw: ''
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.companyName.trim()) return 'اسم الشركة بالعربي مطلوب';
      if (!form.industry) return 'يرجى اختيار القطاع';
    }
    if (step === 1) {
      if (!form.name.trim()) return 'الاسم الكامل مطلوب';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'بريد إلكتروني غير صالح';
      if (!form.password || form.password.length < 8) return 'كلمة المرور 8 أحرف على الأقل';
      if (form.password !== form.confirmPw) return 'كلمتا المرور غير متطابقتين';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/users/register', {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        companyName: form.companyName,
        companyNameEn: form.companyNameEn || form.companyName,
        phone: form.phone,
        industry: form.industry,
        plan: form.plan
      });
      if (res.data.success) {
        const u = res.data.data?.user || {};
        localStorage.setItem('token',    res.data.token);
        localStorage.setItem('userId',   u._id   || '');
        localStorage.setItem('userName', u.name  || form.name);
        localStorage.setItem('userRole', u.role  || 'admin');
        localStorage.setItem('userCompany', form.companyName);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
      setStep(1);
    } finally { setLoading(false); }
  };

  const strength = pwStrength(form.password);

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      background: '#060d1a', position: 'relative', overflow: 'hidden'
    }}>
      {/* Orbs */}
      {[
        { s: 500, x: -120, y: -80, c: 'rgba(26,115,232,0.10)' },
        { s: 350, x: '75%', y: '50%', c: 'rgba(108,71,255,0.09)' },
      ].map((o, i) => (
        <Box key={i} sx={{
          position: 'absolute', width: o.s, height: o.s, left: o.x, top: o.y,
          background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
          borderRadius: '50%', pointerEvents: 'none'
        }} />
      ))}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none'
      }} />

      {/* ── LEFT ── */}
      <Box sx={{
        display: { xs: 'none', lg: 'flex' }, flex: 1,
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        p: 6, position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '18px', mx: 'auto', mb: 3,
            background: 'linear-gradient(135deg, #1a73e8 0%, #4fc3f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(26,115,232,0.4), 0 0 80px rgba(26,115,232,0.15)',
          }}>
            <Typography sx={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: '-1px' }}>W</Typography>
          </Box>
          <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Wassel ERP</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, mt: 0.5, letterSpacing: 2, textTransform: 'uppercase' }}>Enterprise Resource Planning</Typography>
        </Box>

        {/* What you get */}
        <Box sx={{ width: 300 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', mb: 2 }}>
            ما تحصل عليه فوراً
          </Typography>
          {[
            'وصول كامل 30 يوم مجاناً',
            'إعداد سريع خلال دقائق',
            'دعم متعدد الشركات والمستخدمين',
            'مساعد WasselAI مدمج',
            'تقارير وتحليلات آنية',
            'متوافق مع ZATCA السعودية',
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%',
                bgcolor: 'rgba(52,168,83,0.2)', border: '1px solid rgba(52,168,83,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Check sx={{ fontSize: 12, color: '#34a853' }} />
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{item}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── RIGHT — Form ── */}
      <Box sx={{
        flex: { xs: 1, lg: '0 0 520px' },
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 3, position: 'relative', zIndex: 1
      }}>
        <Grow in timeout={600}>
          <Box sx={{
            width: '100%', maxWidth: 460,
            bgcolor: 'rgba(255,255,255,0.97)',
            borderRadius: 4, p: { xs: 3, sm: 4 },
            boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
          }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #1a73e8, #4fc3f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif' }}>W</Typography>
              </Box>
              <Typography variant="h6" fontWeight={800}>Wassel ERP</Typography>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>ابدأ مجاناً</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>أنشئ حسابك وشركتك في 3 خطوات</Typography>

            {/* Stepper */}
            <Stepper activeStep={step} sx={{ mb: 3 }} alternativeLabel>
              {STEPS.map(l => (
                <Step key={l}>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>{l}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.83rem' }} onClose={() => setError('')}>{error}</Alert>}

            {/* ── Step 0: Company ── */}
            {step === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="اسم الشركة بالعربي *" value={form.companyName} onChange={set('companyName')} fullWidth required
                  InputProps={{ startAdornment: <InputAdornment position="start">🏢</InputAdornment> }} />
                <TextField label="Company Name (English)" value={form.companyNameEn} onChange={set('companyNameEn')} fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start">🌐</InputAdornment> }} />
                <TextField label="القطاع الاقتصادي *" value={form.industry} onChange={set('industry')} fullWidth required select>
                  {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </TextField>

                {/* Plan selector */}
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>اختر الخطة</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {PLANS.map(pl => (
                      <Box key={pl.id} onClick={() => setForm(p => ({ ...p, plan: pl.id }))}
                        sx={{
                          flex: 1, p: 1.5, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                          border: '2px solid',
                          borderColor: form.plan === pl.id ? pl.color : 'divider',
                          bgcolor: form.plan === pl.id ? `${pl.color}10` : 'transparent',
                          transition: 'all 0.2s'
                        }}>
                        <Typography sx={{ fontSize: 18 }}>{pl.icon}</Typography>
                        <Typography variant="caption" fontWeight={700} display="block" sx={{ color: pl.color }}>{pl.label}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{pl.desc}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {/* ── Step 1: Admin user ── */}
            {step === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="الاسم الكامل *" value={form.name} onChange={set('name')} fullWidth required
                  InputProps={{ startAdornment: <InputAdornment position="start">👤</InputAdornment> }} />
                <TextField label="البريد الإلكتروني *" type="email" value={form.email} onChange={set('email')} fullWidth required
                  InputProps={{ startAdornment: <InputAdornment position="start">📧</InputAdornment> }} />
                <TextField label="رقم الجوال (اختياري)" value={form.phone} onChange={set('phone')} fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start">📱</InputAdornment> }} />
                <Box>
                  <TextField label="كلمة المرور *" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} fullWidth required
                    helperText="8 أحرف على الأقل، يُفضّل أحرف كبيرة وأرقام ورموز"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">🔒</InputAdornment>,
                      endAdornment: <InputAdornment position="end">
                        <Box onClick={() => setShowPw(v => !v)} sx={{ cursor: 'pointer', color: 'text.secondary', fontSize: 18 }}>
                          {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </Box>
                      </InputAdornment>
                    }} />
                  {form.password && <StrBar v={strength} />}
                </Box>
                <TextField label="تأكيد كلمة المرور *" type={showPw ? 'text' : 'password'} value={form.confirmPw} onChange={set('confirmPw')} fullWidth required
                  error={!!form.confirmPw && form.password !== form.confirmPw}
                  helperText={form.confirmPw && form.password !== form.confirmPw ? 'غير متطابقة' : ''}
                  InputProps={{ startAdornment: <InputAdornment position="start">🔐</InputAdornment> }} />
              </Box>
            )}

            {/* ── Step 2: Confirm ── */}
            {step === 2 && (
              <Box>
                <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2.5, mb: 2 }}>
                  <Typography variant="body2" fontWeight={700} gutterBottom>ملخص الحساب</Typography>
                  {[
                    ['🏢 الشركة', form.companyName],
                    ['📊 القطاع', form.industry],
                    ['📦 الخطة', PLANS.find(p => p.id === form.plan)?.label],
                    ['👤 المسؤول', form.name],
                    ['📧 البريد', form.email],
                  ].map(([k, v]) => (
                    <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderBottom: '1px solid #eee' }}>
                      <Typography variant="caption" color="text.secondary">{k}</Typography>
                      <Typography variant="caption" fontWeight={600}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
                <Alert severity="success" icon="🎁" sx={{ mb: 2, borderRadius: 2, fontSize: '0.83rem' }}>
                  ستحصل على 30 يوم تجربة مجانية بدون بطاقة ائتمان
                </Alert>
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                  بالمتابعة تقبل{' '}
                  <Box component="span" sx={{ color: '#1a73e8', cursor: 'pointer' }}>شروط الاستخدام</Box>
                  {' '}و{' '}
                  <Box component="span" sx={{ color: '#1a73e8', cursor: 'pointer' }}>سياسة الخصوصية</Box>
                </Typography>
              </Box>
            )}

            {/* Buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
              {step > 0 && (
                <Button variant="outlined" onClick={() => { setError(''); setStep(s => s - 1); }}
                  sx={{ flex: 1, py: 1.3, borderRadius: 2 }}>
                  ← السابق
                </Button>
              )}
              {step < 2 ? (
                <Button variant="contained" onClick={nextStep} sx={{
                  flex: 2, py: 1.3, fontWeight: 700, borderRadius: 2,
                  background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                  boxShadow: '0 4px 16px rgba(26,115,232,0.35)',
                }}>
                  التالي →
                </Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{
                  flex: 2, py: 1.3, fontWeight: 700, borderRadius: 2,
                  background: 'linear-gradient(135deg, #34a853, #2d7a3a)',
                  boxShadow: '0 4px 16px rgba(52,168,83,0.35)',
                }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : '🚀 إطلاق الحساب'}
                </Button>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2.5 }}>
              لديك حساب؟{' '}
              <Link to="/login" style={{ color: '#1a73e8', fontWeight: 700, textDecoration: 'none' }}>
                سجّل دخولك
              </Link>
            </Typography>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
