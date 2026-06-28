import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  IconButton, Alert, CircularProgress, Link
} from '@mui/material';
import {
  Email, Lock, Person, Business, Visibility, VisibilityOff
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    companyName: '' 
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (e) => 
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'الاسم مطلوب';
    if (!form.email.trim()) return 'البريد الإلكتروني مطلوب';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'البريد الإلكتروني غير صالح';
    if (!form.companyName.trim()) return 'اسم الشركة مطلوب';
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
      const res = await api.post('/api/users/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', res.data.data.user._id);
        localStorage.setItem('userName', res.data.data.user.name);
        localStorage.setItem('userRole', res.data.data.user.role);
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
      bgcolor: '#f0f2f5', 
      p: 2 
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 460, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a73e8', mb: 1 }}>
            ووصّل
          </Typography>
          <Typography variant="body2" color="text.secondary">
            نظام وصّل ERP — إنشاء حساب جديد
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField 
            label="الاسم الكامل" 
            value={form.name} 
            onChange={handleChange('name')}
            required fullWidth 
            InputProps={{ startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} /> }}
          />
          <TextField 
            label="اسم الشركة" 
            value={form.companyName} 
            onChange={handleChange('companyName')}
            required fullWidth 
            InputProps={{ startAdornment: <Business sx={{ mr: 1, color: 'action.active' }} /> }}
            helperText="سيتم إنشاء شركة جديدة لك"
          />
          <TextField 
            label="البريد الإلكتروني" 
            type="email" 
            value={form.email} 
            onChange={handleChange('email')}
            required fullWidth 
            InputProps={{ startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} /> }}
          />
          <TextField 
            label="كلمة المرور" 
            type={showPass ? 'text' : 'password'} 
            value={form.password} 
            onChange={handleChange('password')}
            required fullWidth 
            InputProps={{
              startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
              endAdornment: (
                <IconButton onClick={() => setShowPass(v => !v)} edge="end">
                  {showPass ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
            helperText="6 أحرف على الأقل"
          />
          <TextField 
            label="تأكيد كلمة المرور" 
            type={showPass ? 'text' : 'password'} 
            value={form.confirmPassword} 
            onChange={handleChange('confirmPassword')}
            required fullWidth 
            InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} /> }}
          />

          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            disabled={loading}
            sx={{ mt: 1, py: 1.2, fontWeight: 600, fontSize: '1rem' }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'إنشاء الحساب'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>أو</Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            لديك حساب بالفعل؟{' '}
            <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
              سجّل دخولك
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
