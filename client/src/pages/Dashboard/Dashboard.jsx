import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Paper, Typography, CircularProgress, Card, CardContent,
  List, ListItem, Chip, IconButton, Button, Divider, LinearProgress,
  Tooltip, ListItemAvatar, Avatar
} from '@mui/material';
import {
  Inventory2, LocalShipping, People, ShoppingCart, AccountBalance,
  FolderOpen, Refresh, ArrowForward, Warning, CheckCircle,
  TrendingUp, TrendingDown
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import api from '../../services/api';

const INDUSTRY_COLORS = {
  trading_general:'#1a73e8', retail:'#00897b', wholesale:'#0288d1', ecommerce:'#f57c00',
  restaurant:'#e65100', cafe:'#795548', hotel:'#ff6d00', hospital:'#e53935',
  clinic:'#00acc1', dental:'#1976d2', pharmacy:'#00897b', salon_ladies:'#ad1457',
  salon_gents:'#1565c0', spa:'#6a1b9a', gym:'#7b1fa2', school:'#283593',
  university:'#1a237e', construction_general:'#e65100', real_estate:'#4e342e',
  freight:'#1b5e20', manufacturing:'#37474f', consulting:'#283593',
  default: '#1a73e8'
};

const KPICard = ({ label, value, sub, color, icon, onClick }) => (
  <Card onClick={onClick} sx={{
    cursor: onClick ? 'pointer' : 'default',
    borderRadius: 2.5, height: '100%',
    borderLeft: `4px solid ${color}`,
    transition: 'all 0.2s',
    '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : {}
  }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.2, mt: 0.3 }}>
            {value ?? '—'}
          </Typography>
          {sub && <Typography variant="caption" color="text.secondary" display="block" mt={0.3}>{sub}</Typography>}
        </Box>
        <Box sx={{ bgcolor: `${color}18`, p: 1, borderRadius: 1.5, color }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updated, setUpdated]   = useState(null);

  const industry = localStorage.getItem('userIndustry') || 'trading_general';
  const userName = localStorage.getItem('userName') || '';
  const company  = localStorage.getItem('userCompany') || '';
  const indColor = INDUSTRY_COLORS[industry] || INDUSTRY_COLORS.default;

  // Greeting based on hour + language
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning');
    if (h < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get('/api/inventory?limit=5'),
        api.get('/api/purchase-orders?status=pending&limit=5'),
        api.get('/api/projects?status=active&limit=4'),
        api.get('/api/employees?limit=1'),
        api.get('/api/suppliers?limit=1'),
      ]);
      const [invR, posR, projR, empR, suppR] = results.map(r =>
        r.status === 'fulfilled' ? r.value.data : null
      );
      setData({
        lowStock:     (invR?.data  || []).filter(i => i.quantity <= (i.minQuantity || 5)).slice(0, 5),
        invCount:     invR?.count  || 0,
        pendingPOs:   posR?.data?.slice(0, 5) || [],
        pendingCount: posR?.count  || 0,
        projects:     projR?.data?.slice(0, 4) || [],
        projStats:    projR?.stats || {},
        empCount:     empR?.count  || 0,
        suppCount:    suppR?.count || 0,
      });
      setUpdated(new Date());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Quick actions — labels from t()
  const ACTIONS = [
    { label: t('dashboard.newSupplier'), path: '/suppliers',      emoji: '🏭' },
    { label: t('dashboard.newPO'),       path: '/purchase-orders', emoji: '🛒' },
    { label: t('dashboard.newItem'),     path: '/inventory',       emoji: '📦' },
    { label: t('dashboard.newEmployee'), path: '/employees',       emoji: '👤' },
    { label: t('dashboard.newProject'),  path: '/projects',        emoji: '📋' },
    { label: t('dashboard.accounting'),  path: '/accounting',      emoji: '💰' },
    { label: t('dashboard.branches'),    path: '/branches',        emoji: '🏪' },
    { label: t('dashboard.warehouses'),  path: '/warehouses',      emoji: '🏭' },
  ];

  if (loading) return (
    <Layout>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: indColor }} />
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      </Box>
    </Layout>
  );

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              {company && (
                <Chip label={company} size="small"
                  sx={{ bgcolor: `${indColor}15`, color: indColor, fontWeight: 700 }} />
              )}
            </Box>
            <Typography variant="h5" fontWeight={800}>
              {greeting()}{userName ? `, ${userName}` : ''} 👋
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' :
                i18n.language === 'zh' ? 'zh-CN' :
                i18n.language === 'ru' ? 'ru-RU' :
                i18n.language === 'de' ? 'de-DE' :
                i18n.language === 'fr' ? 'fr-FR' :
                i18n.language === 'es' ? 'es-ES' :
                i18n.language === 'tr' ? 'tr-TR' :
                'en-GB',
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
              )}
              {updated && ` · ${t('dashboard.lastUpdate')}: ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </Typography>
          </Box>
          <Tooltip title={t('common.refresh')}>
            <IconButton onClick={load} sx={{ bgcolor: `${indColor}10`, '&:hover': { bgcolor: `${indColor}20` } }}>
              <Refresh sx={{ color: indColor }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── KPI Cards ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: t('dashboard.inventory'), color: '#1a73e8', icon: <Inventory2 />,
              value: data?.invCount,
              sub: data?.lowStock?.length ? `${data.lowStock.length} ${t('dashboard.lowStock')}` : undefined,
              path: '/inventory'
            },
            {
              label: t('nav.purchaseOrders'), color: '#f57c00', icon: <ShoppingCart />,
              value: data?.pendingCount, sub: t('dashboard.pendingPO'), path: '/purchase-orders'
            },
            {
              label: t('nav.employees'), color: '#34a853', icon: <People />,
              value: data?.empCount, sub: t('dashboard.employees'), path: '/employees'
            },
            {
              label: t('nav.suppliers'), color: '#7b1fa2', icon: <LocalShipping />,
              value: data?.suppCount, sub: t('dashboard.suppliers'), path: '/suppliers'
            },
            {
              label: t('dashboard.activeProjects'), color: '#00838f', icon: <FolderOpen />,
              value: data?.projStats?.active,
              sub: `${t('dashboard.totalProjects')}: ${data?.projStats?.total || 0}`,
              path: '/projects'
            },
            {
              label: t('nav.accounting'), color: indColor, icon: <AccountBalance />,
              value: '→', sub: t('common.all'), path: '/accounting'
            },
          ].map((k, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <KPICard {...k} onClick={() => navigate(k.path)} />
            </Grid>
          ))}
        </Grid>

        {/* ── Middle Row ── */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>

          {/* Active Projects */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={700}>{t('dashboard.activeProjects_label')}</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/projects')}>
                  {t('dashboard.viewAll')}
                </Button>
              </Box>
              <Box sx={{ p: 2 }}>
                {(data?.projects || []).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <FolderOpen sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {t('dashboard.noProjects')}
                    </Typography>
                    <Button size="small" onClick={() => navigate('/projects')} sx={{ mt: 1 }}>
                      {t('dashboard.addProject')}
                    </Button>
                  </Box>
                ) : data.projects.map((p, i) => (
                  <React.Fragment key={p._id}>
                    <Box sx={{ py: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        <Typography variant="caption" fontWeight={700} color={indColor}>
                          {p.progressPct || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={p.progressPct || 0}
                        sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { bgcolor: indColor } }} />
                    </Box>
                    {i < data.projects.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Pending POs */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={700}>{t('dashboard.pendingPO_label')}</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/purchase-orders')}>
                  {t('dashboard.viewAll')}
                </Button>
              </Box>
              <Box sx={{ p: 2 }}>
                {(data?.pendingPOs || []).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckCircle sx={{ fontSize: 36, color: 'success.main' }} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {t('dashboard.noPO')}
                    </Typography>
                  </Box>
                ) : data.pendingPOs.map((po, i) => (
                  <React.Fragment key={po._id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {po.orderNumber || `PO-${i + 1}`}
                        </Typography>
                        <Chip label={po.status} size="small" color="warning"
                          sx={{ fontSize: '0.65rem', height: 18, mt: 0.3 }} />
                      </Box>
                      <Typography variant="body2" fontWeight={800} color="#f57c00">
                        {(po.total || 0).toLocaleString()} {t('common.language') === 'اللغة' ? 'ر.س' : ''}
                      </Typography>
                    </Box>
                    {i < data.pendingPOs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* ── Bottom Row ── */}
        <Grid container spacing={2.5}>

          {/* Low Stock */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1,
                borderBottom: '1px solid', borderColor: 'divider' }}>
                <Warning color="warning" sx={{ fontSize: 20 }} />
                <Typography fontWeight={700}>{t('dashboard.lowStock_label')}</Typography>
                {(data?.lowStock || []).length > 0 && (
                  <Chip label={(data.lowStock || []).length} color="warning" size="small" />
                )}
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/inventory')} sx={{ ml: 'auto' }}>
                  {t('nav.inventory')}
                </Button>
              </Box>
              <Box sx={{ p: 2 }}>
                {(data?.lowStock || []).length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckCircle sx={{ fontSize: 36, color: 'success.main' }} />
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {t('dashboard.noLowStock')}
                    </Typography>
                  </Box>
                ) : data.lowStock.map((item, i) => (
                  <React.Fragment key={item._id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                      <Chip label={`${item.quantity} ${item.unit || ''}`} size="small"
                        color="error" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </Box>
                    {i < data.lowStock.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography fontWeight={700}>{t('dashboard.quickActions')}</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={1.5}>
                  {ACTIONS.map(a => (
                    <Grid item xs={6} sm={3} key={a.path + a.label}>
                      <Paper onClick={() => navigate(a.path)}
                        sx={{
                          p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: 2,
                          transition: 'all 0.18s', border: '1px solid transparent',
                          '&:hover': { bgcolor: `${indColor}08`, borderColor: `${indColor}30`, transform: 'translateY(-1px)' }
                        }}>
                        <Typography sx={{ fontSize: 20, mb: 0.3 }}>{a.emoji}</Typography>
                        <Typography variant="caption" fontWeight={600} display="block"
                          sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                          {a.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
