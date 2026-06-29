import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, CircularProgress, Avatar, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh } from '@mui/icons-material';
import axios from 'axios';
import Layout from '../../components/Layout';

const empty = { name: '', nameEn: '', email: '', phone: '', nationalId: '', position: '', department: '', salary: '', hireDate: '', nationality: 'سعودي', gender: 'male', status: 'active', iqama: '', iqamaExpiry: '' };

const EmployeesPage = () => {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [delConfirm, setDelConfirm] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetch = async () => {
    setLoading(true);
    try { const r = await axios.get('/api/employees', { headers }); if (r.data.success) setItems(r.data.data); }
    catch { } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(empty); setEditId(null); setDialog(true); };
  const openEdit = (item) => { setForm({ ...item, hireDate: item.hireDate?.split('T')[0] || '', iqamaExpiry: item.iqamaExpiry?.split('T')[0] || '' }); setEditId(item._id); setDialog(true); };
  const closeDialog = () => { setDialog(false); setForm(empty); setEditId(null); };

  const handleSave = async () => {
    try {
      if (editId) await axios.put(`/api/employees/${editId}`, form, { headers });
      else await axios.post('/api/employees', form, { headers });
      setSnack({ open: true, msg: editId ? 'تم التحديث' : 'تمت الإضافة', sev: 'success' });
      closeDialog(); fetch();
    } catch (err) { setSnack({ open: true, msg: err.response?.data?.message || 'خطأ', sev: 'error' }); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/employees/${id}`, { headers });
      setSnack({ open: true, msg: 'تم الحذف', sev: 'success' });
      setDelConfirm(null); fetch();
    } catch { setSnack({ open: true, msg: 'فشل الحذف', sev: 'error' }); }
  };

  const statusColor = { active: 'success', inactive: 'warning', terminated: 'error' };
  const statusLabel = { active: 'نشط', inactive: 'غير نشط', terminated: 'منتهي' };

  const filtered = items.filter(i => i.name?.includes(search) || i.position?.includes(search) || i.department?.includes(search));

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>الموظفون</Typography>
            <Typography variant="body2" color="text.secondary">{items.filter(i => i.status === 'active').length} موظف نشط</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetch}><Refresh /></IconButton>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd} sx={{ bgcolor: '#1a73e8', borderRadius: 2 }}>إضافة موظف</Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <TextField fullWidth size="small" placeholder="بحث بالاسم أو المنصب أو القسم..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell>الموظف</TableCell>
                <TableCell>المنصب</TableCell>
                <TableCell>القسم</TableCell>
                <TableCell>الهاتف</TableCell>
                <TableCell>الراتب</TableCell>
                <TableCell>الجنسية</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>لا يوجد موظفون</TableCell></TableRow>
              ) : filtered.map(item => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#1a73e8', fontSize: 14 }}>{item.name?.[0]}</Avatar>
                      <Box>
                        <Typography fontWeight={500}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.employeeId}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{item.position || '—'}</TableCell>
                  <TableCell>{item.department || '—'}</TableCell>
                  <TableCell>{item.phone || '—'}</TableCell>
                  <TableCell>{item.salary ? `${item.salary?.toLocaleString()} ر.س` : '—'}</TableCell>
                  <TableCell>{item.nationality || '—'}</TableCell>
                  <TableCell><Chip size="small" label={statusLabel[item.status] || item.status} color={statusColor[item.status] || 'default'} /></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(item)} sx={{ color: '#1a73e8' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDelConfirm(item._id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialog} onClose={closeDialog} maxWidth="md" fullWidth>
          <DialogTitle fontWeight={600}>{editId ? 'تعديل موظف' : 'إضافة موظف جديد'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الاسم بالعربي" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الاسم بالإنجليزي" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="البريد الإلكتروني" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الهاتف" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="رقم الهوية / الإقامة" value={form.nationalId} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="المنصب" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="القسم" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الراتب (ر.س)" type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="تاريخ التعيين" type="date" value={form.hireDate} onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الجنسية" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>الجنس</InputLabel>
                  <Select label="الجنس" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                    <MenuItem value="male">ذكر</MenuItem>
                    <MenuItem value="female">أنثى</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>الحالة</InputLabel>
                  <Select label="الحالة" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <MenuItem value="active">نشط</MenuItem>
                    <MenuItem value="inactive">غير نشط</MenuItem>
                    <MenuItem value="terminated">منتهي</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#1a73e8' }}>{t('common.save')}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!delConfirm} onClose={() => setDelConfirm(null)}>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent><Typography>هل أنت متأكد؟</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDelConfirm(null)}>{t('common.cancel')}</Button>
            <Button color="error" variant="contained" onClick={() => handleDelete(delConfirm)}>{t('common.delete')}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default EmployeesPage;
