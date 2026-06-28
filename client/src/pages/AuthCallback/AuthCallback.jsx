import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '../../services/api';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error || !token) {
      navigate('/login?error=auth_failed');
      return;
    }

    localStorage.setItem('token', token);

    api.get('/api/auth/me')
      .then(res => {
        if (res.data.success) {
          localStorage.setItem('userId', res.data.data._id);
          localStorage.setItem('userName', res.data.data.name);
          localStorage.setItem('userRole', res.data.data.role);
        }
      })
      .catch(() => {})
      .finally(() => {
        navigate('/dashboard');
      });
  }, [token, error, navigate]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <CircularProgress size={50} sx={{ mb: 2 }} />
      <Typography variant="h6">جاري تسجيل الدخول...</Typography>
    </Box>
  );
};

export default AuthCallback;
