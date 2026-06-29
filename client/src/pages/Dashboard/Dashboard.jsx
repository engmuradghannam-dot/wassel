import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress,
  Chip, Avatar, LinearProgress, Divider, Button,
  List, ListItem, ListItemText, ListItemAvatar, IconButton,
  Card, CardContent, CardHeader, Tooltip
} from '@mui/material';
import {
  Inventory2, LocalShipping, People, ShoppingCart,
  Warning, TrendingUp, TrendingDown, AccountBalance,
  Business, FolderOpen, Refresh, ArrowForward,
  CheckCircle, Schedule, Cancel, AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';

const KPICard = ({ icon, label, value, sub, color, trend, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: 3, height: '100%',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : {},
      borderLeft: `4px solid ${color}`
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
            {value ?? '—'}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {sub}
            </Typography>
          )}
        </Box>
        <Box sx={{ bgcolor: `${color}18`, p: 1.2, borderRadius: 2, color }}>
          {icon}
        </Box>
      </Box>
      {trend !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
          {trend >= 0
            ? <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
            : <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />}
          <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'}>
            {Math.abs(trend)}% عن الشهر السابق
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }) => {
  const map = {
    active:    { label: 'نشط',    color: 'success' },
    planning:  { label: 'تخطيط', color: 'info' },
    on_hold:   { label: 'متوقف', color: 'warning' },
    completed: { label: 'مكتمل', color: 'default' },
    pending:   { label: 'معلق',  color: 'warning' },
    approved:  { label: 'معتمد', color: 'success' },
    draft:     { label: 'مسودة', color: 'default' },
    received:  { label: 'مستلم', color: 'success' },
    cancelled: { label: 'ملغى',  color: 'error' },
  };
  const s = map[status] || { label: status, color: 'default' };
  return <Chip label={s.label} color={s.color} size="small" sx={{ fontSize: '0.7rem' }} />;
};

const Dashboard = () => {
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token   = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const results = await Promise.allSettled([
        api.get('/api/reports/dashboard', { headers }),
        api.get('/api/inventory?limit=5', { headers }),
        api.get('/api/purchase-orders?status=pending&limit=5', { headers }),
        api.get('/api/employees?limit=1', { headers }),
        api.get('/api/suppliers?limit=1', { headers }),
        api.get('/api/projects?status=active&limit=5', { headers }),
      ]);

      const [dashR, invR, posR, empR, suppR, projR] = results.map(r =>
        r.status === 'fulfilled' ? r.value.data : null
      );

      setData({
        stats: dashR?.data || {},
        lowStock: (invR?.data || []).filter(i => i.quantity <= i.minQuantity).slice(0,5),
        pendingPOs: posR?.data?.slice(0,5) || [],
        empCount:  empR?.count || 0,
        suppCount: suppR?.count || 0,
        projects:  projR?.data?.slice(0,4) || [],
        projStats: projR?.stats || {}
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const user    = localStorage.getItem('userName') || 'المستخدم';
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  if (loading) return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary">جارٍ تحميل لوحة التحكم...</Typography>
      </Box>
    </Layout>
  );

  const s = data?.stats || {};

  return (
    <Layout>
      <Box sx={{ p: 3 }}>

        {/* ─── Header ──────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {greeting()}، {user} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {lastUpdated && ` • آخر تحديث: ${lastUpdated.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`}
            </Typography>
          </Box>
          <IconButton onClick={load} color="primary" title="تحديث">
            <Refresh />
          </IconButton>
        </Box>

        {/* ─── KPI Cards ───────────────────────────────────────── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <KPICard
              icon={<Inventory2 />} color="#1a73e8"
              label="أصناف المخزون" value={s.inventory?.total ?? '—'}
              sub={s.inventory?.lowStock ? `${s.inventory.lowStock} تحت الحد` : undefined}
              onClick={() => navigate('/inventory')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPICard
              icon={<ShoppingCart />} color="#f57c00"
              label="أوامر الشراء" value={s.pendingPOs ?? '—'}
              sub="معلقة للاعتماد"
              onClick={() => navigate('/purchase-orders')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPICard
              icon={<People />} color="#2e7d32"
              label="الموظفون" value={data?.empCount ?? s.employees ?? '—'}
              sub="موظف نشط"
              onClick={() => navigate('/employees')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPICard
              icon={<LocalShipping />} color="#7b1fa2"
              label="الموردون" value={data?.suppCount ?? s.suppliers ?? '—'}
              sub="مورد نشط"
              onClick={() => navigate('/suppliers')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPICard
              icon={<FolderOpen />} color="#00838f"
              label="المشاريع النشطة" value={data?.projStats?.active ?? data?.projects?.length ?? '—'}
              sub={`إجمالي: ${data?.projStats?.total || 0}`}
              onClick={() => navigate('/projects')}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <KPICard
              icon={<AccountBalance />} color="#c62828"
              label="إجمالي المشتريات" value={s.totalPurchases
                ? `${(s.totalPurchases/1000).toFixed(0)}K`
                : '—'}
              sub="ر.س"
              onClick={() => navigate('/accounting')}
            />
          </Grid>
        </Grid>

        {/* ─── Middle Row ──────────────────────────────────────── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>

          {/* Projects */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardHeader
                title={<Typography fontWeight={700}>المشاريع النشطة</Typography>}
                action={
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/projects')}>
                    عرض الكل
                  </Button>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1 }}>
                {(data?.projects || []).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <FolderOpen sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography color="text.secondary" mt={1}>لا توجد مشاريع نشطة</Typography>
                    <Button size="small" onClick={() => navigate('/projects')} sx={{ mt: 1 }}>
                      إضافة مشروع
                    </Button>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {(data?.projects || []).map((p, i) => (
                      <React.Fragment key={p._id}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#00838f18', color: '#00838f', fontSize: 14, fontWeight: 700 }}>
                              {p.progressPct || 0}%
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={600}>{p.name}</Typography>}
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={p.progressPct || 0}
                                  sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: p.progressPct >= 100 ? 'success.main' : p.progressPct >= 50 ? 'info.main' : 'warning.main'
                                    }
                                  }}
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                                  <StatusBadge status={p.status} />
                                  {p.plannedEndDate && (
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(p.plannedEndDate).toLocaleDateString('ar-SA')}
                                    </Typography>
                                  )}
                                  {p.contractValue > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      {p.contractValue.toLocaleString()} ر.س
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {i < (data?.projects || []).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Pending POs */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardHeader
                title={<Typography fontWeight={700}>أوامر الشراء المعلقة</Typography>}
                action={
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/purchase-orders')}>
                    عرض الكل
                  </Button>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1 }}>
                {(data?.pendingPOs || []).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
                    <Typography color="text.secondary" mt={1}>لا توجد أوامر معلقة</Typography>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {(data?.pendingPOs || []).map((po, i) => (
                      <React.Fragment key={po._id}>
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#f57c0018', color: '#f57c00', fontSize: 12 }}>
                              <ShoppingCart sx={{ fontSize: 18 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={600}>{po.orderNumber || `PO-${i+1}`}</Typography>
                                <Typography variant="body2" fontWeight={700} color="#f57c00">
                                  {po.total?.toLocaleString()} ر.س
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                <StatusBadge status={po.status} />
                                {po.expectedDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    متوقع: {new Date(po.expectedDate).toLocaleDateString('ar-SA')}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        {i < (data?.pendingPOs || []).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ─── Bottom Row ──────────────────────────────────────── */}
        <Grid container spacing={2.5}>

          {/* Low Stock Alerts */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" sx={{ fontSize: 20 }} />
                    <Typography fontWeight={700}>تنبيهات المخزون المنخفض</Typography>
                    {(data?.lowStock || []).length > 0 && (
                      <Chip label={(data?.lowStock || []).length} color="warning" size="small" />
                    )}
                  </Box>
                }
                action={
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/inventory')}>
                    المخزون
                  </Button>
                }
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1 }}>
                {(data?.lowStock || []).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    <Typography color="text.secondary" mt={1} variant="body2">جميع الأصناف بمستويات كافية</Typography>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {(data?.lowStock || []).map((item, i) => (
                      <React.Fragment key={item._id}>
                        <ListItem disablePadding sx={{ py: 0.8 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#c6282818', color: '#c62828', fontSize: 12 }}>
                              <Inventory2 sx={{ fontSize: 16 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={500}>{item.name}</Typography>}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.3 }}>
                                <Chip label={`${item.quantity} ${item.unit || 'وحدة'}`} size="small" color="error" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                                <Typography variant="caption" color="text.secondary">
                                  الحد الأدنى: {item.minQuantity}
                                </Typography>
                              </Box>
                            }
                          />
                          <Tooltip title="إنشاء أمر شراء">
                            <IconButton size="small" color="primary" onClick={() => navigate('/purchase-orders')}>
                              <ShoppingCart sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </ListItem>
                        {i < (data?.lowStock || []).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardHeader
                title={<Typography fontWeight={700}>الإجراءات السريعة</Typography>}
                sx={{ pb: 0 }}
              />
              <CardContent>
                <Grid container spacing={1.5}>
                  {[
                    { label: 'مورد جديد',    icon: <LocalShipping />,  path: '/suppliers',      color: '#7b1fa2' },
                    { label: 'أمر شراء',     icon: <ShoppingCart />,   path: '/purchase-orders', color: '#f57c00' },
                    { label: 'صنف مخزون',    icon: <Inventory2 />,     path: '/inventory',      color: '#1a73e8' },
                    { label: 'موظف جديد',    icon: <People />,         path: '/employees',      color: '#2e7d32' },
                    { label: 'مشروع جديد',   icon: <FolderOpen />,     path: '/projects',       color: '#00838f' },
                    { label: 'المحاسبة',     icon: <AccountBalance />, path: '/accounting',     color: '#c62828' },
                    { label: 'الفروع',       icon: <Business />,       path: '/branches',       color: '#5c35a0' },
                    { label: 'المستودعات',   icon: <LocalShipping />,  path: '/warehouses',     color: '#00695c' },
                  ].map(a => (
                    <Grid item xs={6} sm={3} key={a.path}>
                      <Paper
                        onClick={() => navigate(a.path)}
                        sx={{
                          p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: 2,
                          transition: 'all 0.2s', border: '1px solid transparent',
                          '&:hover': {
                            bgcolor: `${a.color}10`,
                            borderColor: `${a.color}40`,
                            transform: 'translateY(-1px)'
                          }
                        }}
                      >
                        <Box sx={{ color: a.color, mb: 0.5 }}>{a.icon}</Box>
                        <Typography variant="caption" fontWeight={600} display="block">{a.label}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Box>
    </Layout>
  );
};

export default Dashboard;
