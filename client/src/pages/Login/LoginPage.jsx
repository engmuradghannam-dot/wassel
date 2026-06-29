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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/api/users/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.data.user._id);
        localStorage.setItem('userName', res.data.data.user.name);
        localStorage.setItem('userRole', res.data.data.user.role);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
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
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: '#f0f2f5', 
      p: 2 
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a73e8', mb: 1 }}>
            ووصّل
          </Typography>
          <Typography variant="body2" color="text.secondary">
            نظام إدارة الأعمال المتكامل
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="البريد الإلكتروني" 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)} 
            required fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">📧</InputAdornment> }}
          />
          <TextField 
            label="كلمة المرور" 
            type={showPw ? 'text' : 'password'} 
            value={password}
            onChange={e => setPassword(e.target.value)} 
            required fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">🔒</InputAdornment>,
              endAdornment: (
                <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                  {showPw ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            sx={{ mt: 1, py: 1.2, fontWeight: 600 }}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>أو</Divider>

        <Button 
          variant="outlined" 
          fullWidth 
          onClick={handleGoogle}
          startIcon={<GoogleIcon />} 
          sx={{ py: 1, fontWeight: 600 }}
        >
          تسجيل الدخول عبر Google
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            ليس لديك حساب؟{' '}
            <Link to="/register" style={{ color: '#1a73e8', fontWeight: 600, textDecoration: 'none' }}>
              سجّل الآن
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
