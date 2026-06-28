import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress,
  List, ListItem, ListItemText, Chip, Avatar
} from '@mui/material';
import {
  Inventory2, LocalShipping, People, ShoppingCart,
  Warning, TrendingUp
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../../components/Layout';

const StatCard = ({ icon, label, value, color, sub }) => (
  <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ color }}>{icon}</Box>
    </Box>
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1 }}>{value ?? '—'}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {sub && <Typography variant="caption" color="warning.main">{sub}</Typography>}
    </Box>
  </Paper>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/reports/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.data.success) setData(r.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    </Layout>
  );

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>لوحة التحكم</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          مرحباً {localStorage.getItem('userName')} — نظرة عامة على النظام
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Inventory2 />} label="إجمالي المنتجات" value={data?.totalItems} color="#1a73e8"
              sub={data?.lowStockItems > 0 ? `${data.lowStockItems} منتج منخفض المخزون` : null} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalShipping />} label="الموردون" value={data?.totalSuppliers} color="#34a853" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<People />} label="الموظفون" value={data?.totalEmployees} color="#fbbc04" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCart />} label="طلبات معلقة" value={data?.pendingOrders} color="#ea4335" />
          </Grid>

          {/* Inventory Value */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp sx={{ color: '#1a73e8' }} />
                <Typography variant="h6" fontWeight={600}>قيمة المخزون</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary">
                {data?.inventoryValue?.toLocaleString('ar-SA', { maximumFractionDigits: 0 }) || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">ريال سعودي</Typography>
            </Paper>
          </Grid>

          {/* Recent Orders */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>آخر أوامر الشراء</Typography>
              {data?.recentOrders?.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>لا توجد أوامر بعد</Typography>
              )}
              <List dense>
                {data?.recentOrders?.map(order => (
                  <ListItem key={order._id} sx={{ borderRadius: 2, '&:hover': { bgcolor: '#f8f9fa' } }}>
                    <ListItemText
                      primary={order.orderNumber}
                      secondary={order.supplier?.name}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {order.total?.toLocaleString('ar-SA')} ر.س
                      </Typography>
                      <Chip
                        size="small"
                        label={order.status === 'draft' ? 'مسودة' : order.status === 'pending' ? 'معلق' : order.status === 'received' ? 'مستلم' : order.status}
                        color={order.status === 'received' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Low Stock Alert */}
          {data?.lowStockItems > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff3cd', border: '1px solid #ffc107', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning sx={{ color: '#f57c00', fontSize: 28 }} />
                <Box>
                  <Typography fontWeight={600} color="#7a4f00">تنبيه: مخزون منخفض</Typography>
                  <Typography variant="body2" color="#7a4f00">
                    {data.lowStockItems} منتج وصل إلى الحد الأدنى للمخزون — راجع صفحة المخزون
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard;
