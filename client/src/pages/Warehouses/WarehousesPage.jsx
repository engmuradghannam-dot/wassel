import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, Switch, FormControlLabel,
  MenuItem
} from '@mui/material';
import { Add, Edit, Delete, Warehouse as WarehouseIcon, Refresh } from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const empty = { name: '', nameEn: '', code: '', type: 'main', address: '', phone: '', capacity: '', isActive: true };

const TYPES = [
  { value: 'main', label: 'رئيسي' },
  { value: 'secondary', label: 'ثانوي' },
  { value: 'transit', label: 'عبور' },
  { value: 'returns', label: 'مرتجعات' },
];

const WarehousesPage = () => {
  const { t, i18n } = useTranslation();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [dialog, setDialog]         = useState(false);
  const [editing, setEditing]       = useState(null);
  const [seeding, setSeeding]       = useState(false);
  const [form, setForm]             = useState(empty);
  const [saving, setSaving]         = useState(false);
  const [snack, setSnack]           = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/warehouses');
      setWarehouses(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'فشل تحميل المستودعات');
    } finally { setLoading(false); }
  };

  const handleSeedDemo = async () => {
    setSeeding(true); setError('');
    try {
      const r = await api.post('/api/setup/seed-demo-data');
      const d = r.data.data || {};
      const parts = [];
      if (d.branches)  parts.push(`${d.branches} فرع`);
      if (d.warehouses) parts.push(`${d.warehouses} مستودع`);
      if (d.inventory) parts.push(`${d.inventory} صنف مخزون`);
      if (d.projects) parts.push(`${d.projects} مشروع`);
      setError(parts.length
        ? `تم إنشاء: ${parts.join('، ')}. حدّث الصفحة.`
        : (d.skipped?.[0] || 'البيانات موجودة مسبقاً بالفعل'));
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل توليد البيانات التجريبية');
    } finally { setSeeding(false); }
  };

  useEffect(() => { load(); }, []);

  const openDialog = (w = null) => {
    setEditing(w);
    setForm(w ? { ...w } : empty);
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('اسم المستودع مطلوب'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/warehouses/${editing._id}`, form);
        setSnack('تم تحديث المستودع بنجاح');
      } else {
        await api.post('/api/warehouses', form);
        setSnack('تم إنشاء المستودع بنجاح');
      }
      setDialog(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل حفظ المستودع');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المستودع؟')) return;
    try {
      await api.delete(`/api/warehouses/${id}`);
      setSnack('تم حذف المستودع');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل الحذف');
    }
  };

  const typeLabel = (v) => TYPES.find(t => t.value === v)?.label || v;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarehouseIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700}>المستودعات</Typography>
            <Chip label={warehouses.length} color="primary" size="small" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} onClick={load} variant="outlined" size="small">{t('common.refresh')}</Button>
            <Button startIcon={<Add />} onClick={() => openDialog()} variant="contained">مستودع جديد</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : warehouses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <WarehouseIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">لا توجد مستودعات</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 2 }}>
              <Button startIcon={<Add />} onClick={() => openDialog()} variant="contained">
                إضافة أول مستودع
              </Button>
              <Button onClick={handleSeedDemo} disabled={seeding} variant="outlined"
                startIcon={seeding ? <CircularProgress size={16}/> : undefined}>
                {seeding ? 'جارٍ التوليد...' : 'توليد فروع ومستودعات ومخزون تجريبي'}
              </Button>
            </Box>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {['اسم المستودع', 'الكود', 'النوع', 'العنوان', 'الهاتف', 'الطاقة', 'الحالة', 'إجراءات'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map(w => (
                  <TableRow key={w._id} hover>
                    <TableCell><Typography fontWeight={600}>{w.name}</Typography><Typography variant="caption" color="text.secondary">{w.nameEn}</Typography></TableCell>
                    <TableCell><Chip label={w.code || '—'} size="small" /></TableCell>
                    <TableCell><Chip label={typeLabel(w.type)} color="info" size="small" /></TableCell>
                    <TableCell>{w.address || '—'}</TableCell>
                    <TableCell>{w.phone || '—'}</TableCell>
                    <TableCell>{w.capacity ? `${w.capacity} وحدة` : '—'}</TableCell>
                    <TableCell><Chip label={w.isActive ? 'نشط' : 'معطّل'} color={w.isActive ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => openDialog(w)} size="small"><Edit /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(w._id)} size="small"><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'تعديل المستودع' : 'مستودع جديد'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="اسم المستودع *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="الاسم بالإنجليزية" value={form.nameEn || ''} onChange={e => setForm(p => ({...p, nameEn: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="كود المستودع" value={form.code || ''} onChange={e => setForm(p => ({...p, code: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="نوع المستودع" value={form.type || 'main'} onChange={e => setForm(p => ({...p, type: e.target.value}))} fullWidth select>
                  {TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="الهاتف" value={form.phone || ''} onChange={e => setForm(p => ({...p, phone: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="الطاقة الاستيعابية (وحدة)" type="number" value={form.capacity || ''} onChange={e => setForm(p => ({...p, capacity: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="العنوان" value={form.address || ''} onChange={e => setForm(p => ({...p, address: e.target.value}))} fullWidth multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} color="success" />} label="نشط" />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={20} /> : 'حفظ'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </Layout>
  );
};

export default WarehousesPage;
