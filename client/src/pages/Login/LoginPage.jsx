import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  InputAdornment, IconButton, Alert, CircularProgress, Chip, Link
} from '@mui/material';
import {
  Email, Lock, Visibility, VisibilityOff, Login as LoginIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // FIX: add RouterLink

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('يرجى ملء جميع الحقول'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/users/login', form);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.data._id);
        localStorage.setItem('userName', res.data.data.name);
        localStorage.setItem('userRole', res.data.data.role);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)'
    }}>
      <Paper elevation={8} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: 2, bgcolor: '#1a73e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 1.5
          }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>و</Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">وصّل ERP</Typography>
          <Typography variant="body2" color="text.secondary">نظام إدارة الأعمال المتكامل</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="البريد الإلكتروني" type="email" margin="normal"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <TextField
            fullWidth label="كلمة المرور" margin="normal"
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(v => !v)} edge="end">
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            fullWidth type="submit" variant="contained" size="large"
            disabled={loading}
            sx={{ mt: 2.5, py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16, bgcolor: '#1a73e8', '&:hover': { bgcolor: '#1557b0' } }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </Box>

        <Divider sx={{ my: 2.5 }}><Typography variant="caption" color="text.secondary">أو</Typography></Divider>

        <Button
          fullWidth variant="outlined" size="large" onClick={handleGoogle}
          sx={{ py: 1.5, borderRadius: 2, borderColor: '#dadce0', color: 'text.primary', '&:hover': { bgcolor: '#f8f9fa' } }}
          startIcon={
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
              <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
              <path fill="#FBBC05" d="M11.68 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.34-5.7z"/>
              <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.34 5.7c1.74-5.2 6.59-9.07 12.32-9.07z"/>
            </svg>
          }
        >
          الدخول عبر Google
        </Button>

        {/* FIX: Link + RouterLink now properly imported */}
        <Box sx={{ mt: 2.5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ليس لديك حساب؟{' '}
            <Link component={RouterLink} to="/register" underline="hover" color="primary" fontWeight={600}>
              سجّل الآن
            </Link>
          </Typography>
        </Box>

        <Box sx={{ mt: 1.5, textAlign: 'center' }}>
          <Chip size="small" label="WasselERP v2.0" variant="outlined" sx={{ fontSize: 11 }} />
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
