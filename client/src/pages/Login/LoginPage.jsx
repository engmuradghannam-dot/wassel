import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Divider,
  IconButton, InputAdornment, Alert, CircularProgress,
  Fade, Grow
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../services/api';

const FEATURES = [
  { icon: '📦', title: 'المخزون والمستودعات', desc: 'تتبع دقيق لكل صنف' },
  { icon: '💰', title: 'محاسبة متكاملة', desc: 'قيود، تقارير، ضرائب VAT' },
  { icon: '🚢', title: 'لوجستيك وجمارك', desc: 'شحن دولي مع HS Codes' },
  { icon: '👥', title: 'موارد بشرية', desc: 'رواتب وWPS وGOSI' },
  { icon: '📊', title: 'مشاريع وميزانيات', desc: 'Gantt، مراحل، KPIs' },
  { icon: '🤖', title: 'WasselAI', desc: 'مساعد ذكي مدمج في كل صفحة' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [featureIdx, setFeatureIdx] = useState(0);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    if (params.get('error')) setError('فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
    if (localStorage.getItem('token')) navigate('/dashboard');
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setFeatureIdx(i => (i + 1) % FEATURES.length); setVisible(true); }, 400);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('أدخل البريد الإلكتروني وكلمة المرور'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/users/login', { email: email.trim().toLowerCase(), password });
      if (res.data.success) {
        const u = res.data.data?.user || res.data.user || {};
        localStorage.setItem('token',    res.data.token);
        localStorage.setItem('userId',   u._id   || '');
        localStorage.setItem('userName', u.name  || '');
        localStorage.setItem('userRole', u.role  || '');
        localStorage.setItem('userCompany', u.company?.name || u.company || '');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const API = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';
    window.location.href = `${API}/api/auth/google`;
  };

  const f = FEATURES[featureIdx];

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex',
      background: '#060d1a',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      {[
        { size: 500, x: -100, y: -100, color: 'rgba(26,115,232,0.12)' },
        { size: 400, x: '70%', y: '60%', color: 'rgba(108,71,255,0.10)' },
        { size: 300, x: '40%', y: '80%', color: 'rgba(52,168,83,0.07)' },
      ].map((orb, i) => (
        <Box key={i} sx={{
          position: 'absolute', width: orb.size, height: orb.size,
          left: orb.x, top: orb.y,
          background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
          borderRadius: '50%', pointerEvents: 'none'
        }} />
      ))}

      {/* Grid lines */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none'
      }} />

      {/* ── LEFT — Branding ── */}
      <Box sx={{
        display: { xs: 'none', lg: 'flex' }, flex: 1,
        flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', p: 6, position: 'relative', zIndex: 1
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
          <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
            Wassel ERP
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, mt: 0.5, letterSpacing: 2, textTransform: 'uppercase' }}>
            Enterprise Resource Planning
          </Typography>
        </Box>

        {/* Rotating feature card */}
        <Box sx={{
          width: 320, bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3, p: 3, backdropFilter: 'blur(10px)',
          transition: 'all 0.4s ease', minHeight: 110
        }}>
          <Fade in={visible} timeout={400}>
            <Box>
              <Typography sx={{ fontSize: 28, mb: 1 }}>{f.icon}</Typography>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 16, mb: 0.5 }}>{f.title}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{f.desc}</Typography>
            </Box>
          </Fade>
          {/* Dots */}
          <Box sx={{ display: 'flex', gap: 0.6, mt: 2 }}>
            {FEATURES.map((_, i) => (
              <Box key={i} onClick={() => setFeatureIdx(i)} sx={{
                width: i === featureIdx ? 20 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                bgcolor: i === featureIdx ? '#1a73e8' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s'
              }} />
            ))}
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mt: 5 }}>
          {[['24', 'وحدة إدارية'], ['100+', 'API endpoint'], ['VAT', 'ZATCA متوافق']].map(([v, l]) => (
            <Box key={v} sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{v}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── RIGHT — Form ── */}
      <Box sx={{
        flex: { xs: 1, lg: '0 0 480px' },
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 3, position: 'relative', zIndex: 1
      }}>
        <Grow in timeout={600}>
          <Box sx={{
            width: '100%', maxWidth: 420,
            bgcolor: 'rgba(255,255,255,0.97)',
            borderRadius: 4, p: { xs: 3, sm: 4.5 },
            boxShadow: '0 32px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'linear-gradient(135deg, #1a73e8, #4fc3f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Typography sx={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif' }}>W</Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>Wassel ERP</Typography>
                <Typography variant="caption" color="text.secondary">نظام إدارة الأعمال</Typography>
              </Box>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>أهلاً بعودتك</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>سجّل دخولك للمتابعة إلى نظامك</Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.85rem' }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="البريد الإلكتروني" type="email" value={email}
                onChange={e => setEmail(e.target.value)} required fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">
                    <Typography sx={{ fontSize: 16 }}>📧</Typography>
                  </InputAdornment>
                }}
              />
              <TextField
                label="كلمة المرور" type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)} required fullWidth
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">
                    <Typography sx={{ fontSize: 16 }}>🔒</Typography>
                  </InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw(v => !v)} edge="end" size="small">
                        {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                sx={{
                  py: 1.5, fontWeight: 700, fontSize: '0.95rem', borderRadius: 2, mb: 1.5,
                  background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
                  boxShadow: '0 4px 20px rgba(26,115,232,0.4)',
                  '&:hover': { background: 'linear-gradient(135deg, #1557b0 0%, #0d47a1 100%)', boxShadow: '0 6px 24px rgba(26,115,232,0.5)' },
                  transition: 'all 0.2s'
                }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : 'دخول إلى النظام →'}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>أو تسجيل الدخول بـ</Typography>
              </Divider>

              <Button fullWidth variant="outlined" size="large" onClick={handleGoogle}
                sx={{
                  py: 1.3, borderRadius: 2, fontWeight: 600, fontSize: '0.9rem',
                  borderColor: '#dadce0', color: '#3c4043',
                  '&:hover': { borderColor: '#1a73e8', bgcolor: '#f8f9ff', color: '#1a73e8' },
                  gap: 1.5
                }}>
                <Box component="img"
                  src="https://www.google.com/favicon.ico"
                  sx={{ width: 18, height: 18 }}
                  alt="Google"
                />
                Continue with Google
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2.5 }}>
              ليس لديك حساب؟{' '}
              <Link to="/register" style={{ color: '#1a73e8', fontWeight: 700, textDecoration: 'none' }}>
                ابدأ تجربتك المجانية
              </Link>
            </Typography>

            <Box sx={{
              mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider',
              display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap'
            }}>
              {['🔒 بيانات مشفّرة', '☁️ سحابي 99.9%', '🇸🇦 خوادم خليجية'].map(t => (
                <Typography key={t} variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>{t}</Typography>
              ))}
            </Box>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
