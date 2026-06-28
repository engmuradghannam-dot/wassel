import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Phone, Email } from '@mui/icons-material';
import axios from 'axios';
import Layout from '../../components/Layout';

const empty = { name: '', nameEn: '', email: '', phone: '', address: '', country: 'SA', taxNumber: '', contactPerson: '', paymentTerms: 30, notes: '' };

const SuppliersPage = () => {
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
    try { const r = await axios.get('/api/suppliers', { headers }); if (r.data.success) setItems(r.data.data); }
    catch { } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(empty); setEditId(null); setDialog(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditId(item._id); setDialog(true); };
  const closeDialog = () => { setDialog(false); setForm(empty); setEditId(null); };

  const handleSave = async () => {
    try {
      if (editId) await axios.put(`/api/suppliers/${editId}`, form, { headers });
      else await axios.post('/api/suppliers', form, { headers });
      setSnack({ open: true, msg: editId ? 'تم التحديث' : 'تمت الإضافة', sev: 'success' });
      closeDialog(); fetch();
    } catch (err) { setSnack({ open: true, msg: err.response?.data?.message || 'خطأ', sev: 'error' }); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/suppliers/${id}`, { headers });
      setSnack({ open: true, msg: 'تم الحذف', sev: 'success' });
      setDelConfirm(null); fetch();
    } catch { setSnack({ open: true, msg: 'فشل الحذف', sev: 'error' }); }
  };

  const filtered = items.filter(i => i.name?.includes(search) || i.email?.includes(search) || i.phone?.includes(search));

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>الموردون</Typography>
            <Typography variant="body2" color="text.secondary">{items.length} مورد</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetch}><Refresh /></IconButton>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd} sx={{ bgcolor: '#1a73e8', borderRadius: 2 }}>مورد جديد</Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <TextField fullWidth size="small" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell>اسم المورد</TableCell>
                <TableCell>جهة الاتصال</TableCell>
                <TableCell>الهاتف</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>شروط الدفع</TableCell>
                <TableCell>الدولة</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>لا يوجد موردون</TableCell></TableRow>
              ) : filtered.map(item => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.nameEn && <Typography variant="caption" color="text.secondary">{item.nameEn}</Typography>}
                  </TableCell>
                  <TableCell>{item.contactPerson || '—'}</TableCell>
                  <TableCell>
                    {item.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Phone sx={{ fontSize: 14 }} />{item.phone}</Box>}
                  </TableCell>
                  <TableCell>
                    {item.email && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Email sx={{ fontSize: 14 }} />{item.email}</Box>}
                  </TableCell>
                  <TableCell><Chip size="small" label={`${item.paymentTerms} يوم`} /></TableCell>
                  <TableCell>{item.country || '—'}</TableCell>
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
          <DialogTitle fontWeight={600}>{editId ? 'تعديل مورد' : 'إضافة مورد جديد'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الاسم بالعربي" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الاسم بالإنجليزي" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="جهة الاتصال" value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الهاتف" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="البريد الإلكتروني" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الرقم الضريبي" value={form.taxNumber} onChange={e => setForm(p => ({ ...p, taxNumber: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="شروط الدفع (أيام)" type="number" value={form.paymentTerms} onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الدولة" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="العنوان" multiline rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="ملاحظات" multiline rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>إلغاء</Button>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#1a73e8' }}>حفظ</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!delConfirm} onClose={() => setDelConfirm(null)}>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent><Typography>هل أنت متأكد من حذف هذا المورد؟</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDelConfirm(null)}>إلغاء</Button>
            <Button color="error" variant="contained" onClick={() => handleDelete(delConfirm)}>حذف</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default SuppliersPage;
