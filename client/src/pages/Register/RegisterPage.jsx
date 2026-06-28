import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  InputAdornment, IconButton, Alert, CircularProgress,
  Stepper, Step, StepLabel, Link
} from '@mui/material';
import {
  Email, Lock, Visibility, VisibilityOff, Business,
  Person, ArrowForward, CheckCircle
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const steps = ['معلومات الحساب', 'معلومات الشركة', 'التأكيد'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setError('');
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!form.name || !form.email || !form.password) {
        setError('يرجى ملء جميع الحقول المطلوبة');
        return false;
      }
      if (form.password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('كلمتا المرور غير متطابقتين');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('البريد الإلكتروني غير صالح');
        return false;
      }
    }
    if (activeStep === 1) {
      if (!form.companyName) {
        setError('يرجى إدخال اسم الشركة');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(p => p + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep(p => p - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <TextField
              fullWidth
              label="الاسم الكامل"
              value={form.name}
              onChange={handleChange('name')}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="كلمة المرور"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(v => !v)} edge="end">
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="تأكيد كلمة المرور"
              type={showConfirmPass ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPass(v => !v)} edge="end">
                      {showConfirmPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="اسم الشركة"
              value={form.companyName}
              onChange={handleChange('companyName')}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business color="action" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="رقم الهاتف (اختياري)"
              value={form.phone}
              onChange={handleChange('phone')}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                )
              }}
            />
          </>
        );
      case 2:
        return (
          <Box textAlign="center" py={3}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              تأكيد البيانات
            </Typography>
            <Typography color="text.secondary">
              الاسم: {form.name}
            </Typography>
            <Typography color="text.secondary">
              البريد: {form.email}
            </Typography>
            <Typography color="text.secondary">
              الشركة: {form.companyName}
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          borderRadius: 3
        }}
      >
        {/* Logo */}
        <Box textAlign="center" mb={3}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            وصّل
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إنشاء حساب جديد لشركتك
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3, direction: 'rtl' }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            تم إنشاء الحساب بنجاح! جاري التوجيه...
          </Alert>
        )}

        <form onSubmit={activeStep === 2 ? handleSubmit : (e) => e.preventDefault()}>
          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              variant="outlined"
            >
              السابق
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || success}
                endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
                sx={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #764ba2, #667eea)'
                  }
                }}
              >
                {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                sx={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #764ba2, #667eea)'
                  }
                }}
              >
                التالي
              </Button>
            )}
          </Box>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">أو</Typography>
        </Divider>

        <Box textAlign="center">
          <Typography variant="body2">
            لديك حساب بالفعل؟{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              تسجيل الدخول
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
