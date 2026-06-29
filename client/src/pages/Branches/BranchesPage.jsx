import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, Delete, Business, Refresh } from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const empty = { name: '', nameEn: '', code: '', address: '', phone: '', email: '', isMain: false, isActive: true };

const BranchesPage = () => {
  const { t, i18n } = useTranslation();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [snack, setSnack]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'فشل تحميل الفروع');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDialog = (branch = null) => {
    setEditing(branch);
    setForm(branch ? { ...branch } : empty);
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('اسم الفرع مطلوب'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/branches/${editing._id}`, form);
        setSnack('تم تحديث الفرع بنجاح');
      } else {
        await api.post('/api/branches', form);
        setSnack('تم إنشاء الفرع بنجاح');
      }
      setDialog(false);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل حفظ الفرع');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل تريد حذف هذا الفرع؟')) return;
    try {
      await api.delete(`/api/branches/${id}`);
      setSnack('تم حذف الفرع');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'فشل الحذف');
    }
  };

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700}>الفروع</Typography>
            <Chip label={branches.length} color="primary" size="small" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Refresh />} onClick={load} variant="outlined" size="small">{t('common.refresh')}</Button>
            <Button startIcon={<Add />} onClick={() => openDialog()} variant="contained">فرع جديد</Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : branches.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Business sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">لا توجد فروع</Typography>
            <Button startIcon={<Add />} onClick={() => openDialog()} variant="contained" sx={{ mt: 2 }}>
              إضافة أول فرع
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {['اسم الفرع', 'الكود', 'العنوان', 'الهاتف', 'البريد', 'الرئيسي', 'الحالة', 'إجراءات'].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {branches.map(b => (
                  <TableRow key={b._id} hover>
                    <TableCell><Typography fontWeight={600}>{b.name}</Typography><Typography variant="caption" color="text.secondary">{b.nameEn}</Typography></TableCell>
                    <TableCell><Chip label={b.code || '—'} size="small" /></TableCell>
                    <TableCell>{b.address || '—'}</TableCell>
                    <TableCell>{b.phone || '—'}</TableCell>
                    <TableCell>{b.email || '—'}</TableCell>
                    <TableCell>{b.isMain ? <Chip label="رئيسي" color="warning" size="small" /> : '—'}</TableCell>
                    <TableCell><Chip label={b.isActive ? 'نشط' : 'معطّل'} color={b.isActive ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => openDialog(b)} size="small"><Edit /></IconButton>
                      <IconButton color="error"   onClick={() => handleDelete(b._id)} size="small"><Delete /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Dialog */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editing ? 'تعديل الفرع' : 'فرع جديد'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="اسم الفرع *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="الاسم بالإنجليزية" value={form.nameEn || ''} onChange={e => setForm(p => ({...p, nameEn: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="كود الفرع" value={form.code || ''} onChange={e => setForm(p => ({...p, code: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="الهاتف" value={form.phone || ''} onChange={e => setForm(p => ({...p, phone: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="البريد الإلكتروني" value={form.email || ''} onChange={e => setForm(p => ({...p, email: e.target.value}))} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="العنوان" value={form.address || ''} onChange={e => setForm(p => ({...p, address: e.target.value}))} fullWidth multiline rows={2} />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel control={<Switch checked={!!form.isMain} onChange={e => setForm(p => ({...p, isMain: e.target.checked}))} color="warning" />} label="فرع رئيسي" />
              </Grid>
              <Grid item xs={6}>
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

export default BranchesPage;
