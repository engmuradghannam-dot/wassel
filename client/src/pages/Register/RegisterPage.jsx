import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  InputAdornment, IconButton, Alert, CircularProgress, Link
} from '@mui/material';
import {
  Email, Lock, Person, Business, Visibility, VisibilityOff
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'الاسم مطلوب';
    if (!form.email.trim()) return 'البريد الإلكتروني مطلوب';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'البريد الإلكتروني غير صالح';
    if (!form.password) return 'كلمة المرور مطلوبة';
    if (form.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (form.password !== form.confirmPassword) return 'كلمتا المرور غير متطابقتين';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/users/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.data._id);
        localStorage.setItem('userName', res.data.data.name);
        localStorage.setItem('userRole', res.data.data.role);
        setSuccess('تم إنشاء الحساب بنجاح! جاري التحويل...');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
      py: 4
    }}>
      <Paper elevation={8} sx={{ width: '100%', maxWidth: 460, p: 4, borderRadius: 3 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: 2, bgcolor: '#1a73e8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 1.5
          }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>و</Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">إنشاء حساب جديد</Typography>
          <Typography variant="body2" color="text.secondary">نظام وصّل ERP — ابدأ رحلتك الآن</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="الاسم الكامل" margin="normal" required
            value={form.name} onChange={handleChange('name')}
            InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <TextField
            fullWidth label="اسم الشركة" margin="normal"
            value={form.companyName} onChange={handleChange('companyName')}
            InputProps={{ startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} /> }}
            helperText="اختياري — يمكنك تعديله لاحقاً"
          />
          <TextField
            fullWidth label="البريد الإلكتروني" type="email" margin="normal" required
            value={form.email} onChange={handleChange('email')}
            InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <TextField
            fullWidth label="كلمة المرور" margin="normal" required
            type={showPass ? 'text' : 'password'}
            value={form.password} onChange={handleChange('password')}
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: (
                <IconButton onClick={() => setShowPass(v => !v)} edge="end">
                  {showPass ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
            helperText="6 أحرف على الأقل"
          />
          <TextField
            fullWidth label="تأكيد كلمة المرور" margin="normal" required
            type={showPass ? 'text' : 'password'}
            value={form.confirmPassword} onChange={handleChange('confirmPassword')}
            InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />

          <Button
            fullWidth type="submit" variant="contained" size="large"
            disabled={loading}
            sx={{ mt: 2.5, py: 1.5, borderRadius: 2, fontWeight: 600, fontSize: 16, bgcolor: '#1a73e8', '&:hover': { bgcolor: '#1557b0' } }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            لديك حساب بالفعل؟{' '}
            <Link component={RouterLink} to="/login" underline="hover" color="primary" fontWeight={600}>
              سجّل دخولك
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
