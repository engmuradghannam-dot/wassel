import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Chip, LinearProgress, Avatar, AvatarGroup, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, CircularProgress, Snackbar,
  Tabs, Tab
} from '@mui/material';
import {
  Add, FolderOpen, Edit, People, AttachMoney,
  Schedule, CheckCircle, Refresh
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const statusConfig = {
  planning:  { label: 'تخطيط',  color: 'info' },
  active:    { label: 'نشط',    color: 'success' },
  on_hold:   { label: 'متوقف', color: 'warning' },
  completed: { label: 'مكتمل', color: 'default' },
  cancelled: { label: 'ملغى',  color: 'error' }
};

const priorityConfig = {
  low:      { label: 'منخفض',   color: '#64b5f6' },
  medium:   { label: 'متوسط',   color: '#ffb74d' },
  high:     { label: 'مرتفع',   color: '#e57373' },
  critical: { label: 'حرج',     color: '#b71c1c' }
};

const empty = {
  name: '', type: 'external', status: 'planning', priority: 'medium',
  contractValue: '', budgetCost: '', currency: 'SAR',
  startDate: '', plannedEndDate: '', description: ''
};

const ProjectsPage = () => {
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState(0);
  const [dialog, setDialog]     = useState(false);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [snack, setSnack]       = useState('');
  const [stats, setStats]       = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [projRes, empRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/employees?limit=100')
      ]);
      if (projRes.data.success) {
        setProjects(projRes.data.data || []);
        setStats(projRes.data.stats || {});
      }
      if (empRes.data.success) setEmployees(empRes.data.data || []);
    } catch (e) { setError('فشل تحميل المشاريع'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const statusList = [null, 'planning', 'active', 'on_hold', 'completed'];
  const filtered = tab === 0 ? projects : projects.filter(p => p.status === statusList[tab]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('اسم المشروع مطلوب'); return; }
    setSaving(true);
    try {
      await api.post('/api/projects', form);
      setSnack('تم إنشاء المشروع بنجاح');
      setDialog(false);
      setForm(empty);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل إنشاء المشروع');
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FolderOpen color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>إدارة المشاريع</Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.total || 0} مشروع · {stats.active || 0} نشط · قيمة إجمالية {((stats.totalValue || 0)/1000).toFixed(0)}K ر.س
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={load}><Refresh /></IconButton>
            <Button startIcon={<Add />} variant="contained" onClick={() => setDialog(true)}>
              مشروع جديد
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'الكل', value: stats.total || 0, color: '#1a73e8' },
            { label: 'نشط',  value: stats.active || 0, color: '#2e7d32' },
            { label: 'مكتمل', value: stats.completed || 0, color: '#555' },
            { label: 'إجمالي القيمة', value: `${((stats.totalValue||0)/1000).toFixed(0)}K`, color: '#f57c00' },
          ].map(s => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          {['الكل', 'تخطيط', 'نشط', 'متوقف', 'مكتمل'].map((l, i) => <Tab key={i} label={l} />)}
        </Tabs>

        {/* Projects Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <FolderOpen sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">لا توجد مشاريع</Typography>
            <Button startIcon={<Add />} onClick={() => setDialog(true)} variant="contained" sx={{ mt: 2 }}>
              إضافة أول مشروع
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map(p => {
              const sc = statusConfig[p.status] || { label: p.status, color: 'default' };
              const pc = priorityConfig[p.priority] || { label: p.priority, color: '#888' };
              const daysLeft = p.plannedEndDate
                ? Math.ceil((new Date(p.plannedEndDate) - new Date()) / 86400000)
                : null;
              return (
                <Grid item xs={12} sm={6} lg={4} key={p._id}>
                  <Card sx={{ borderRadius: 3, height: '100%', transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}>
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">{p.code}</Typography>
                          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{p.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                          <Chip label={sc.label} color={sc.color} size="small" />
                          <Chip label={pc.label} size="small" sx={{ bgcolor: `${pc.color}20`, color: pc.color, borderColor: `${pc.color}40`, border: '1px solid', fontSize: '0.65rem' }} />
                        </Box>
                      </Box>

                      {/* Progress */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">التقدم</Typography>
                          <Typography variant="caption" fontWeight={700}>{p.progressPct || 0}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate" value={p.progressPct || 0}
                          sx={{
                            height: 6, borderRadius: 3, bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: (p.progressPct || 0) >= 100 ? 'success.main'
                                : (p.progressPct || 0) >= 60 ? 'info.main' : 'warning.main'
                            }
                          }}
                        />
                      </Box>

                      {/* Metrics */}
                      <Grid container spacing={1} sx={{ mb: 1.5 }}>
                        {p.contractValue > 0 && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AttachMoney sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {(p.contractValue/1000).toFixed(0)}K ر.س
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {p.budgetCost > 0 && (
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                تكلفة: {(p.budgetCost/1000).toFixed(0)}K
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        {daysLeft !== null && (
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Schedule sx={{ fontSize: 14, color: daysLeft < 0 ? 'error.main' : daysLeft < 7 ? 'warning.main' : 'text.secondary' }} />
                              <Typography variant="caption" color={daysLeft < 0 ? 'error.main' : daysLeft < 7 ? 'warning.main' : 'text.secondary'}>
                                {daysLeft < 0 ? `متأخر ${Math.abs(daysLeft)} يوم` : `${daysLeft} يوم متبقي`}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>

                      {/* Team */}
                      {p.team?.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <People sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">{p.team.length} عضو</Typography>
                        </Box>
                      )}

                      {/* Milestones summary */}
                      {p.milestones?.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                          {p.milestones.slice(0,3).map((m, i) => (
                            <Chip key={i} label={m.name}
                              size="small"
                              color={m.status === 'completed' ? 'success' : m.status === 'delayed' ? 'error' : 'default'}
                              icon={m.status === 'completed' ? <CheckCircle sx={{ fontSize: '12px !important' }} /> : undefined}
                              sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                          ))}
                          {p.milestones.length > 3 && (
                            <Chip label={`+${p.milestones.length - 3}`} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Create Dialog */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>مشروع جديد</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <TextField label="اسم المشروع *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} fullWidth required />
              </Grid>
              <Grid item xs={6}>
                <TextField label="نوع المشروع" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} fullWidth select>
                  {['external','internal','construction','it','consulting','maintenance'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="الأولوية" value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))} fullWidth select>
                  {['low','medium','high','critical'].map(t => <MenuItem key={t} value={t}>{priorityConfig[t]?.label || t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField label="قيمة العقد (ر.س)" type="number" value={form.contractValue} onChange={e => setForm(p => ({...p, contractValue: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="الميزانية التقديرية" type="number" value={form.budgetCost} onChange={e => setForm(p => ({...p, budgetCost: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="تاريخ البدء" type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="تاريخ الانتهاء المخطط" type="date" value={form.plannedEndDate} onChange={e => setForm(p => ({...p, plannedEndDate: e.target.value}))} fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="المدير المسؤول" value={form.manager || ''} onChange={e => setForm(p => ({...p, manager: e.target.value}))} fullWidth select>
                  {employees.map(emp => <MenuItem key={emp._id} value={emp._id}>{emp.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label="وصف المشروع" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} fullWidth multiline rows={3} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'إنشاء المشروع'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </Layout>
  );
};

export default ProjectsPage;
