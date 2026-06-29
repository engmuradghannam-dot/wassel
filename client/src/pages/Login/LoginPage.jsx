import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  IconButton, InputAdornment, Alert, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Google as GoogleIcon } from '@mui/icons-material';
import api from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('يرجى إدخال البريد الإلكتروني وكلمة المرور'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/users/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token',    res.data.token);
        localStorage.setItem('userId',   res.data.data.user._id);
        localStorage.setItem('userName', res.data.data.user.name);
        localStorage.setItem('userRole', res.data.data.user.role);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل الدخول. تأكد من البيانات.');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 50%, #0d1b2a 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background grid pattern */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Left side — branding */}
      <Box sx={{
        display: { xs: 'none', lg: 'flex' },
        flex: 1, flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        p: 6, position: 'relative', zIndex: 1
      }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          {/* Logo */}
          <Box sx={{
            width: 80, height: 80, borderRadius: 3,
            background: 'linear-gradient(135deg, #1a73e8, #4fc3f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 3, boxShadow: '0 8px 32px rgba(26,115,232,0.4)'
          }}>
            <Typography sx={{ fontSize: 40, fontWeight: 900, color: 'white', fontFamily: 'Arial' }}>W</Typography>
          </Box>

          <Typography variant="h2" fontWeight={800} sx={{ mb: 1, letterSpacing: '-1px' }}>
            Wassel ERP
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.7, mb: 4, fontWeight: 300 }}>
            Enterprise Resource Planning System
          </Typography>

          {/* Features */}
          {[
            { icon: '📦', text: 'إدارة المخزون والمستودعات' },
            { icon: '💰', text: 'محاسبة مالية متكاملة' },
            { icon: '🚢', text: 'لوجستيك وشحن دولي' },
            { icon: '👥', text: 'موارد بشرية ورواتب' },
            { icon: '🤖', text: 'مساعد AI ذكي مدمج' },
          ].map((f, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, opacity: 0.85 }}>
              <Typography sx={{ fontSize: 20 }}>{f.icon}</Typography>
              <Typography variant="body1">{f.text}</Typography>
            </Box>
          ))}

          <Typography variant="caption" sx={{ opacity: 0.4, mt: 4, display: 'block' }}>
            © 2026 Wassel ERP · All rights reserved
          </Typography>
        </Box>
      </Box>

      {/* Right side — login form */}
      <Box sx={{
        flex: { xs: 1, lg: 0.6 }, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        p: 3, position: 'relative', zIndex: 1
      }}>
        <Paper elevation={0} sx={{
          p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 440,
          borderRadius: 4, bgcolor: 'rgba(255,255,255,0.97)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)'
        }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              background: 'linear-gradient(135deg, #1a73e8, #4fc3f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Typography sx={{ fontSize: 22, fontWeight: 900, color: 'white' }}>W</Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>Wassel ERP</Typography>
              <Typography variant="caption" color="text.secondary">نظام إدارة الأعمال</Typography>
            </Box>
          </Box>

          <Typography variant="h5" fontWeight={700} gutterBottom>تسجيل الدخول</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            أدخل بيانات حسابك للمتابعة
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="البريد الإلكتروني" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">📧</InputAdornment> }}
            />
            <TextField
              label="كلمة المرور" type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} required fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">🔒</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit" variant="contained" size="large" disabled={loading} fullWidth
              sx={{ py: 1.4, fontWeight: 700, fontSize: '1rem', borderRadius: 2,
                background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                boxShadow: '0 4px 16px rgba(26,115,232,0.35)',
                '&:hover': { background: 'linear-gradient(135deg, #1557b0, #0d47a1)' }
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'دخول إلى النظام'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }}><Typography variant="caption" color="text.secondary">أو</Typography></Divider>

          <Button
            variant="outlined" fullWidth size="large" onClick={handleGoogle}
            startIcon={<GoogleIcon />}
            sx={{ py: 1.2, borderRadius: 2, fontWeight: 600, borderColor: 'divider',
              '&:hover': { borderColor: '#1a73e8', bgcolor: '#f8f9ff' }
            }}
          >
            تسجيل الدخول عبر Google
          </Button>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ليس لديك حساب؟{' '}
              <Link to="/register" style={{ color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>
                سجّل مجاناً
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
