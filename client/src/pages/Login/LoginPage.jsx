import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  IconButton, InputAdornment, Alert, CircularProgress
} from '@mui/material';
import {
  Visibility, VisibilityOff, Login as LoginIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import api from '../../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1a73e8' }}>
      <Paper elevation={6} sx={{ p: 4, width: 420, borderRadius: 3, textAlign: 'center' }}>

        {/* Logo */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{
            width: 80, height: 80, bgcolor: '#1a73e8', borderRadius: 2,
            mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 40, fontWeight: 'bold'
          }}>و</Box>
          <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>وصّل ERP</Typography>
          <Typography variant="body2" color="text.secondary">نظام إدارة الأعمال المتكامل</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'right' }}>{error}</Alert>}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="البريد الإلكتروني *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">📧</InputAdornment> }}
          />
          <TextField
            label="كلمة المرور *"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">🔒</InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                    {showPw ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            type="submit" variant="contained" size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            sx={{ bgcolor: '#1a73e8', '&:hover': { bgcolor: '#1557b0' }, borderRadius: 2, py: 1.5 }}
          >
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>أو</Divider>

        {/* Google Login */}
        <Button
          variant="outlined" fullWidth size="large"
          onClick={handleGoogle}
          startIcon={<GoogleIcon />}
          sx={{ borderRadius: 2, py: 1.5, color: '#1a73e8', borderColor: '#1a73e8', mb: 2 }}
        >
          الدخول عبر Google
        </Button>

        {/* Register Link */}
        <Box sx={{
          mt: 1, p: 2, bgcolor: '#f8f9fa', borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            ليس لديك حساب؟
          </Typography>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            fullWidth
            sx={{
              bgcolor: '#34a853', '&:hover': { bgcolor: '#2d9248' },
              borderRadius: 2, py: 1
            }}
          >
            إنشاء حساب جديد
          </Button>
        </Box>

        <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
          WasselERP v2.0
        </Typography>
      </Paper>
    </Box>
  );
}
