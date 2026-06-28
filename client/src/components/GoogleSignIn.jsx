import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const GoogleSignIn = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError(null);

    // Redirect to backend Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      onSuccess?.(token);
    }

    if (errorParam) {
      setError(t('auth.googleSignInFailed'));
      onError?.(errorParam);
    }
  }, [onSuccess, onError, t]);

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="outlined"
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
        onClick={handleGoogleSignIn}
        disabled={loading}
        sx={{
          borderColor: '#4285F4',
          color: '#4285F4',
          '&:hover': {
            borderColor: '#357ABD',
            bgcolor: 'rgba(66, 133, 244, 0.04)'
          }
        }}
      >
        {loading ? t('auth.signingIn') : t('auth.signInWithGoogle')}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {t('auth.googleSignInHint')}
      </Typography>
    </Box>
  );
};

export default GoogleSignIn;
