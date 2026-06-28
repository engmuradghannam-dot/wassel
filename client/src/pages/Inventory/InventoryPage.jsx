import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, InputAdornment, Tooltip, Alert, CircularProgress, Select,
  MenuItem, FormControl, InputLabel, Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Search, Warning, Refresh, TrendingDown } from '@mui/icons-material';
import axios from 'axios';
import Layout from '../../components/Layout';

const emptyItem = { name: '', nameEn: '', sku: '', category: '', unit: 'pcs', costPrice: '', salePrice: '', quantity: '', minQuantity: '', description: '', taxRate: 15 };

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(emptyItem);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [delConfirm, setDelConfirm] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/inventory', { headers });
      if (r.data.success) setItems(r.data.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setForm(emptyItem); setEditId(null); setDialog(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditId(item._id); setDialog(true); };
  const closeDialog = () => { setDialog(false); setForm(emptyItem); setEditId(null); };

  const handleSave = async () => {
    try {
      if (editId) {
        await axios.put(`/api/inventory/${editId}`, form, { headers });
        setSnack({ open: true, msg: 'تم تحديث المنتج', sev: 'success' });
      } else {
        await axios.post('/api/inventory', form, { headers });
        setSnack({ open: true, msg: 'تم إضافة المنتج', sev: 'success' });
      }
      closeDialog(); fetch();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.message || 'خطأ', sev: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/inventory/${id}`, { headers });
      setSnack({ open: true, msg: 'تم الحذف', sev: 'success' });
      setDelConfirm(null); fetch();
    } catch { setSnack({ open: true, msg: 'فشل الحذف', sev: 'error' }); }
  };

  const filtered = items.filter(i =>
    i.name?.includes(search) || i.sku?.includes(search) || i.category?.includes(search)
  );

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>المخزون</Typography>
            <Typography variant="body2" color="text.secondary">{items.length} منتج</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetch}><Refresh /></IconButton>
            <Button variant="contained" startIcon={<Add />} onClick={openAdd} sx={{ bgcolor: '#1a73e8', borderRadius: 2 }}>
              إضافة منتج
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <TextField
            fullWidth size="small" placeholder="بحث بالاسم أو الكود أو الفئة..."
            value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
        </Paper>

        {/* Low stock alert */}
        {items.some(i => i.quantity <= i.minQuantity) && (
          <Alert severity="warning" icon={<TrendingDown />} sx={{ mb: 2, borderRadius: 2 }}>
            {items.filter(i => i.quantity <= i.minQuantity).length} منتج وصل إلى الحد الأدنى للمخزون
          </Alert>
        )}

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell fontWeight={600}>المنتج</TableCell>
                <TableCell>الكود</TableCell>
                <TableCell>الفئة</TableCell>
                <TableCell align="center">الكمية</TableCell>
                <TableCell align="center">سعر التكلفة</TableCell>
                <TableCell align="center">سعر البيع</TableCell>
                <TableCell align="center">الحالة</TableCell>
                <TableCell align="center">إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>لا توجد منتجات</TableCell></TableRow>
              ) : filtered.map(item => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{item.name}</Typography>
                    {item.nameEn && <Typography variant="caption" color="text.secondary">{item.nameEn}</Typography>}
                  </TableCell>
                  <TableCell><Chip size="small" label={item.sku || '—'} /></TableCell>
                  <TableCell>{item.category || '—'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${item.quantity} ${item.unit}`}
                      size="small"
                      color={item.quantity <= item.minQuantity ? 'error' : item.quantity <= item.minQuantity * 2 ? 'warning' : 'success'}
                    />
                  </TableCell>
                  <TableCell align="center">{item.costPrice?.toLocaleString('ar-SA')} ر.س</TableCell>
                  <TableCell align="center">{item.salePrice?.toLocaleString('ar-SA')} ر.س</TableCell>
                  <TableCell align="center">
                    {item.quantity <= item.minQuantity && <Tooltip title="مخزون منخفض"><Warning sx={{ color: 'error.main', fontSize: 18 }} /></Tooltip>}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(item)} sx={{ color: '#1a73e8' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setDelConfirm(item._id)} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Dialog */}
        <Dialog open={dialog} onClose={closeDialog} maxWidth="md" fullWidth>
          <DialogTitle fontWeight={600}>{editId ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الاسم بالعربي" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الاسم بالإنجليزي" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="كود المنتج (SKU)" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="الفئة" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="الوحدة" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="الكمية" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="الحد الأدنى" type="number" value={form.minQuantity} onChange={e => setForm(p => ({ ...p, minQuantity: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="سعر التكلفة (ر.س)" type="number" value={form.costPrice} onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="سعر البيع (ر.س)" type="number" value={form.salePrice} onChange={e => setForm(p => ({ ...p, salePrice: e.target.value }))} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="نسبة الضريبة %" type="number" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="الوصف" multiline rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog}>إلغاء</Button>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#1a73e8' }}>حفظ</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!delConfirm} onClose={() => setDelConfirm(null)}>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent><Typography>هل أنت متأكد من حذف هذا المنتج؟</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setDelConfirm(null)}>إلغاء</Button>
            <Button color="error" variant="contained" onClick={() => handleDelete(delConfirm)}>حذف</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev} onClose={() => setSnack(p => ({ ...p, open: false }))}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default InventoryPage;
