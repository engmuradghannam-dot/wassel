import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import api from '../../services/api';

const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const [status, setStatus] = useState('جارٍ التحقق من هويتك...');
  const [error, setError]   = useState('');

  useEffect(() => {
    const token = params.get('token');
    const err   = params.get('error');

    if (err || !token) {
      setError('فشل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
      return;
    }

    localStorage.setItem('token', token);
    setStatus('تم التحقق، جارٍ تحميل بياناتك...');

    api.get('/api/auth/me')
      .then(res => {
        if (res.data.success) {
          const u = res.data.data;
          localStorage.setItem('userId',   u._id   || '');
          localStorage.setItem('userName', u.name  || '');
          localStorage.setItem('userRole', u.role  || '');
          localStorage.setItem('userCompany', u.company?.name || '');
        }
        setStatus('مرحباً! جارٍ التوجيه...');
        setTimeout(() => navigate('/dashboard'), 600);
      })
      .catch(() => {
        setStatus('مرحباً! جارٍ التوجيه...');
        setTimeout(() => navigate('/dashboard'), 600);
      });
  }, []);

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#060d1a', gap: 3
    }}>
      {/* Logo */}
      <Box sx={{
        width: 64, height: 64, borderRadius: '16px',
        background: 'linear-gradient(135deg, #1a73e8, #4fc3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 40px rgba(26,115,232,0.4)'
      }}>
        <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif' }}>W</Typography>
      </Box>

      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>Wassel ERP</Typography>

      {error ? (
        <Box sx={{ textAlign: 'center', maxWidth: 360 }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          <Button variant="contained" onClick={() => navigate('/login')} sx={{ borderRadius: 2 }}>
            العودة لتسجيل الدخول
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress sx={{ color: '#1a73e8' }} size={44} thickness={3} />
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{status}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default AuthCallback;
