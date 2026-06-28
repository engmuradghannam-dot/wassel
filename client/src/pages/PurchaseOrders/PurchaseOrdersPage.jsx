import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, CircularProgress, Snackbar, Alert, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Visibility, Delete, Search, Refresh, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import Layout from '../../components/Layout';

const statusColor = { draft: 'default', pending: 'warning', approved: 'info', received: 'success', partial: 'warning', cancelled: 'error' };
const statusLabel = { draft: 'مسودة', pending: 'معلق', approved: 'معتمد', received: 'مستلم', partial: 'جزئي', cancelled: 'ملغي' };

const PurchaseOrdersPage = () => {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(null);
  const [form, setForm] = useState({ supplier: '', notes: '', items: [{ name: '', quantity: 1, unitPrice: 0, taxRate: 15 }] });
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetch = async () => {
    setLoading(true);
    try {
      const [ordersR, suppR] = await Promise.all([
        axios.get('/api/purchase-orders', { headers }),
        axios.get('/api/suppliers', { headers })
      ]);
      if (ordersR.data.success) setItems(ordersR.data.data);
      if (suppR.data.success) setSuppliers(suppR.data.data);
    } catch { } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(); }, []);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { name: '', quantity: 1, unitPrice: 0, taxRate: 15 }] }));
  const updateItem = (idx, field, val) => setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const calcTotal = (items) => {
    const sub = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
    const tax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate / 100)), 0);
    return { sub, tax, total: sub + tax };
  };

  const handleSave = async () => {
    if (!form.supplier || form.items.length === 0) { setSnack({ open: true, msg: 'يرجى اختيار المورد وإضافة منتج', sev: 'warning' }); return; }
    try {
      await axios.post('/api/purchase-orders', form, { headers });
      setSnack({ open: true, msg: 'تم إنشاء أمر الشراء', sev: 'success' });
      setDialog(false); fetch();
    } catch (err) { setSnack({ open: true, msg: err.response?.data?.message || 'خطأ', sev: 'error' }); }
  };

  const { sub, tax, total } = calcTotal(form.items);
  const filtered = items.filter(i => i.orderNumber?.includes(search) || i.supplier?.name?.includes(search));

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>أوامر الشراء</Typography>
            <Typography variant="body2" color="text.secondary">{items.length} أمر</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetch}><Refresh /></IconButton>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)} sx={{ bgcolor: '#1a73e8', borderRadius: 2 }}>أمر شراء جديد</Button>
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
                <TableCell>رقم الأمر</TableCell>
                <TableCell>المورد</TableCell>
                <TableCell>تاريخ الطلب</TableCell>
                <TableCell align="center">الإجمالي</TableCell>
                <TableCell align="center">الحالة</TableCell>
                <TableCell align="center">عرض</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>لا توجد أوامر شراء</TableCell></TableRow>
              ) : filtered.map(item => (
                <TableRow key={item._id} hover>
                  <TableCell fontWeight={600}>{item.orderNumber}</TableCell>
                  <TableCell>{item.supplier?.name || '—'}</TableCell>
                  <TableCell>{item.orderDate ? new Date(item.orderDate).toLocaleDateString('ar-SA') : '—'}</TableCell>
                  <TableCell align="center" fontWeight={600}>{item.total?.toLocaleString('ar-SA')} ر.س</TableCell>
                  <TableCell align="center"><Chip size="small" label={statusLabel[item.status]} color={statusColor[item.status]} /></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => setViewDialog(item)} sx={{ color: '#1a73e8' }}><Visibility fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* New Order Dialog */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle fontWeight={600}>أمر شراء جديد</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={8}>
                <FormControl fullWidth required>
                  <InputLabel>المورد</InputLabel>
                  <Select label="المورد" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))}>
                    {suppliers.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="ملاحظات" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>البنود</Typography>
            {form.items.map((item, idx) => (
              <Grid container spacing={1.5} key={idx} sx={{ mb: 1 }} alignItems="center">
                <Grid item xs={4}><TextField fullWidth size="small" label="اسم المنتج" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} /></Grid>
                <Grid item xs={2}><TextField fullWidth size="small" type="number" label="الكمية" value={item.quantity} onChange={e => updateItem(idx, 'quantity', +e.target.value)} /></Grid>
                <Grid item xs={2}><TextField fullWidth size="small" type="number" label="سعر الوحدة" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', +e.target.value)} /></Grid>
                <Grid item xs={2}><TextField fullWidth size="small" type="number" label="الضريبة %" value={item.taxRate} onChange={e => updateItem(idx, 'taxRate', +e.target.value)} /></Grid>
                <Grid item xs={2}>
                  <Typography fontWeight={600} variant="body2">{((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)).toLocaleString('ar-SA')} ر.س</Typography>
                </Grid>
              </Grid>
            ))}
            <Button size="small" startIcon={<Add />} onClick={addItem}>إضافة بند</Button>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Grid container>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">المجموع قبل الضريبة:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}><Typography fontWeight={600}>{sub.toLocaleString('ar-SA')} ر.س</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">الضريبة:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}><Typography fontWeight={600}>{tax.toLocaleString('ar-SA')} ر.س</Typography></Grid>
                <Grid item xs={6}><Typography fontWeight={700}>الإجمالي:</Typography></Grid>
                <Grid item xs={6} sx={{ textAlign: 'left' }}><Typography fontWeight={700} color="primary">{total.toLocaleString('ar-SA')} ر.س</Typography></Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialog(false)}>إلغاء</Button>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#1a73e8' }}>إنشاء الأمر</Button>
          </DialogActions>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewDialog} onClose={() => setViewDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle fontWeight={600}>{viewDialog?.orderNumber}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>المورد: {viewDialog?.supplier?.name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>الحالة: <Chip size="small" label={statusLabel[viewDialog?.status]} color={statusColor[viewDialog?.status]} /></Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>المنتج</TableCell><TableCell align="center">الكمية</TableCell><TableCell align="center">السعر</TableCell><TableCell align="center">الإجمالي</TableCell></TableRow></TableHead>
                <TableBody>
                  {viewDialog?.items?.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell align="center">{it.quantity}</TableCell>
                      <TableCell align="center">{it.unitPrice?.toLocaleString()} ر.س</TableCell>
                      <TableCell align="center">{it.total?.toLocaleString()} ر.س</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="h6" fontWeight={700} color="primary">{viewDialog?.total?.toLocaleString('ar-SA')} ر.س</Typography>
            </Box>
          </DialogContent>
          <DialogActions><Button onClick={() => setViewDialog(null)}>إغلاق</Button></DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack.sev}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default PurchaseOrdersPage;
