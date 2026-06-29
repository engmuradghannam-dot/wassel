import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Paper } from '@mui/material';
import Layout from '../../components/Layout';
export default function SalesOrdersPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb:3 }}>{AR?'طلبات البيع':'Sales Orders'}</Typography>
        <Paper sx={{ p:4, borderRadius:3, textAlign:'center' }}>
          <Typography variant="h1" sx={{ fontSize:48, mb:2 }}>🛒</Typography>
          <Typography color="text.secondary">{AR?'قريباً — قيد التطوير':'Coming Soon — Under Development'}</Typography>
        </Paper>
      </Box>
    </Layout>
  );
}
