import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, CircularProgress, Snackbar, Alert, TextField, MenuItem,
  InputAdornment, Tooltip, Avatar, Divider, Autocomplete
} from '@mui/material';
import {
  Add, Visibility, Search, Refresh, Delete,
  ShoppingCart, Close, Save, AddCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const EMPTY_FORM = {
  supplier: '', supplierObj: null,
  notes: '',
  expectedDelivery: '',
  items: [{ name:'', quantity:1, unitPrice:0, taxRate:15, unit:'', total:0 }]
};

export default function PurchaseOrdersPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [orders,    setOrders]    = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dialog,    setDialog]    = useState(false);
  const [viewDialog,setViewDialog]= useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [search,    setSearch]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [snack,     setSnack]     = useState('');

  // ── Load data ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersR, suppR] = await Promise.all([
        api.get('/api/purchase-orders'),
        api.get('/api/suppliers')
      ]);
      if (ordersR.data.success) setOrders(ordersR.data.data || []);
      if (suppR.data.success)   setSuppliers(suppR.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || t('common.error'));
    } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  // ── Items management ───────────────────────────────────────────
  const addItem = () => setForm(p => ({
    ...p, items: [...p.items, { name:'', quantity:1, unitPrice:0, taxRate:15, unit:'', total:0 }]
  }));

  const updateItem = (idx, field, val) => setForm(p => ({
    ...p,
    items: p.items.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [field]: val };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    })
  }));

  const removeItem = (idx) => setForm(p => ({
    ...p, items: p.items.filter((_, i) => i !== idx)
  }));

  // ── Totals ─────────────────────────────────────────────────────
  const calcTotals = (items) => {
    const subtotal = items.reduce((s, i) => s + (+(i.quantity||0) * +(i.unitPrice||0)), 0);
    const tax      = items.reduce((s, i) => s + (+(i.quantity||0) * +(i.unitPrice||0) * ((+(i.taxRate||0)) / 100)), 0);
    return { subtotal, tax, total: subtotal + tax };
  };

  const { subtotal, tax, total } = calcTotals(form.items);

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.supplier) { setError(AR ? 'يرجى اختيار المورد' : 'Please select a supplier'); return; }
    if (form.items.length === 0 || !form.items[0].name) {
      setError(AR ? 'يرجى إضافة بند واحد على الأقل' : 'Add at least one item');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = {
        supplier:         form.supplier,
        notes:            form.notes,
        expectedDelivery: form.expectedDelivery || undefined,
        items:            form.items.filter(i => i.name.trim()),
      };
      await api.post('/api/purchase-orders', payload);
      setSnack(t('common.success') || 'تم إنشاء أمر الشراء');
      setDialog(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      setError(e.response?.data?.message || t('common.error'));
    } finally { setSaving(false); }
  };

  // ── i18n labels ────────────────────────────────────────────────
  const STATUS_LABEL = {
    draft:    AR ? 'مسودة'   : 'Draft',
    pending:  AR ? 'معلق'    : 'Pending',
    approved: AR ? 'معتمد'   : 'Approved',
    received: AR ? 'مستلم'   : 'Received',
    partial:  AR ? 'جزئي'    : 'Partial',
    cancelled:AR ? 'ملغى'    : 'Cancelled',
  };
  const STATUS_COLOR = {
    draft:'default', pending:'warning', approved:'info',
    received:'success', partial:'warning', cancelled:'error'
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber?.toLowerCase().includes(q) ||
           o.supplier?.name?.toLowerCase().includes(q) ||
           o.supplier?.commercialReg?.includes(q) ||
           o.supplier?.vatNumber?.includes(q) ||
           o.supplier?.phone?.includes(q);
  });

  const fmt = (n) => (+n || 0).toLocaleString(AR ? 'ar-SA' : 'en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const CUR = AR ? 'ر.س' : 'SAR';

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <ShoppingCart sx={{ fontSize:32, color:'#f57c00' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {t('purchases.title') || (AR ? 'أوامر الشراء' : 'Purchase Orders')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {orders.length} {AR ? 'أمر' : 'orders'} ·{' '}
                {orders.filter(o=>o.status==='pending').length} {AR ? 'معلق' : 'pending'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>}
              onClick={() => { setForm(EMPTY_FORM); setError(''); setDialog(true); }}
              sx={{ bgcolor:'#f57c00','&:hover':{bgcolor:'#e65100'}, borderRadius:2 }}>
              {AR ? '+ أمر شراء جديد' : '+ New Purchase Order'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        <TextField size="small"
          placeholder={AR ? 'بحث برقم الأمر، المورد، السجل التجاري، الرقم الضريبي...' : 'Search by order#, supplier, CR, VAT...'}
          value={search} onChange={e=>setSearch(e.target.value)}
          sx={{ mb:2, width:450 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الأمر':'Order#'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المورد':'Supplier'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'التاريخ':'Date'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المجموع':'Total'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{AR?'عرض':'View'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py:4 }}>
                  <CircularProgress size={28}/>
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py:4, color:'text.secondary' }}>
                  {AR ? 'لا توجد أوامر شراء' : 'No purchase orders'}
                </TableCell></TableRow>
              ) : filtered.map(order => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily:'monospace' }}>
                      {order.orderNumber || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Avatar sx={{ width:28, height:28, bgcolor:'#f57c0020', color:'#f57c00', fontSize:12, fontWeight:700 }}>
                        {order.supplier?.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{order.supplier?.name || '—'}</Typography>
                        {order.supplier?.commercialReg && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>
                            {order.supplier.commercialReg}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(AR?'ar-SA':'en-GB') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#f57c00">
                      {fmt(order.totalAmount)} {CUR}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABEL[order.status] || order.status}
                      color={STATUS_COLOR[order.status] || 'default'}
                      size="small" sx={{ fontSize:'0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={AR?'عرض التفاصيل':'View Details'}>
                      <IconButton size="small" onClick={() => setViewDialog(order)} sx={{ color:'#1a73e8' }}>
                        <Visibility sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── NEW ORDER DIALOG ── */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth
          PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5, fontWeight:800 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <ShoppingCart sx={{ color:'#f57c00' }}/>
                {AR ? 'أمر شراء جديد' : 'New Purchase Order'}
              </Box>
              <IconButton onClick={() => setDialog(false)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt:3 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

            <Grid container spacing={2}>
              {/* Supplier — Autocomplete with search */}
              <Grid item xs={12} sm={8}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(s) => {
                    if (typeof s === 'string') return s;
                    let label = s.name || '';
                    if (s.commercialReg) label += ` | سجل: ${s.commercialReg}`;
                    if (s.vatNumber)     label += ` | ضريبي: ${s.vatNumber}`;
                    if (s.phone)         label += ` | ${s.phone}`;
                    return label;
                  }}
                  filterOptions={(options, state) => {
                    const q = state.inputValue.toLowerCase();
                    if (!q) return options;
                    return options.filter(s =>
                      s.name?.toLowerCase().includes(q) ||
                      s.nameEn?.toLowerCase().includes(q) ||
                      s.commercialReg?.includes(q) ||
                      s.vatNumber?.includes(q) ||
                      s.phone?.includes(q) ||
                      s.email?.toLowerCase().includes(q) ||
                      s.code?.toLowerCase().includes(q)
                    );
                  }}
                  value={form.supplierObj || null}
                  onChange={(_, newVal) => {
                    setForm(p => ({
                      ...p,
                      supplier:    newVal?._id || '',
                      supplierObj: newVal || null,
                    }));
                  }}
                  noOptionsText={suppliers.length === 0
                    ? (AR ? 'لا يوجد موردون — أضف مورداً أولاً من قسم الموردين' : 'No suppliers found — add one in Suppliers section')
                    : (AR ? 'لا نتائج' : 'No results')
                  }
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ py:1.5 }}>
                      <Avatar sx={{ width:32, height:32, bgcolor:'#f57c0020', color:'#f57c00', fontSize:13, fontWeight:700, mr:1.5, flexShrink:0 }}>
                        {option.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.name}</Typography>
                        <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                          {option.commercialReg && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>
                              🏢 {option.commercialReg}
                            </Typography>
                          )}
                          {option.vatNumber && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>
                              🧾 {option.vatNumber}
                            </Typography>
                          )}
                          {option.phone && (
                            <Typography variant="caption" color="text.secondary">
                              📞 {option.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`${AR ? 'المورد' : 'Supplier'} *`}
                      required
                      placeholder={AR ? 'ابحث بالاسم أو السجل التجاري أو الرقم الضريبي أو الهاتف...' : 'Search by name, CR, VAT, phone...'}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <Search sx={{ fontSize:18, color:'text.secondary' }}/>
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
                {/* Show selected supplier info */}
                {form.supplierObj && (
                  <Box sx={{ mt:1, p:1.2, bgcolor:'#fff8f0', borderRadius:2, border:'1px solid #f57c0030',
                    display:'flex', gap:2, flexWrap:'wrap' }}>
                    <Typography variant="caption" fontWeight={600} color="#f57c00">{form.supplierObj.name}</Typography>
                    {form.supplierObj.commercialReg && (
                      <Typography variant="caption" color="text.secondary">🏢 {form.supplierObj.commercialReg}</Typography>
                    )}
                    {form.supplierObj.vatNumber && (
                      <Typography variant="caption" color="text.secondary">🧾 {form.supplierObj.vatNumber}</Typography>
                    )}
                    {form.supplierObj.phone && (
                      <Typography variant="caption" color="text.secondary">📞 {form.supplierObj.phone}</Typography>
                    )}
                    {form.supplierObj.paymentTerms && (
                      <Typography variant="caption" color="text.secondary">
                        💳 {AR?'شروط الدفع:':'Terms:'} {form.supplierObj.paymentTerms} {AR?'يوم':'days'}
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label={AR ? 'تاريخ التسليم المتوقع' : 'Expected Delivery'}
                  type="date" fullWidth
                  value={form.expectedDelivery}
                  onChange={e => setForm(p => ({...p, expectedDelivery:e.target.value}))}
                  InputLabelProps={{ shrink:true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label={AR ? 'ملاحظات' : 'Notes'}
                  value={form.notes}
                  onChange={e => setForm(p => ({...p, notes:e.target.value}))}
                  fullWidth multiline rows={1}
                />
              </Grid>
            </Grid>

            {/* Items */}
            <Box sx={{ mt:3 }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {AR ? 'البنود (المنتجات / الخدمات)' : 'Line Items'}
                </Typography>
                <Button size="small" startIcon={<AddCircle/>} onClick={addItem}
                  sx={{ color:'#1a73e8' }}>
                  {AR ? 'إضافة بند' : 'Add Item'}
                </Button>
              </Box>

              {/* Table header */}
              <Box sx={{ display:'grid', gridTemplateColumns:'3fr 1fr 1.5fr 1fr 1fr auto',
                gap:1, px:1, mb:0.5 }}>
                {[AR?'اسم المنتج / الخدمة':'Product/Service',
                  AR?'الكمية':'Qty',
                  AR?'سعر الوحدة':'Unit Price',
                  AR?'الضريبة %':'Tax %',
                  AR?'الإجمالي':'Total',
                  ''
                ].map((h,i) => (
                  <Typography key={i} variant="caption" color="text.secondary" fontWeight={700}>{h}</Typography>
                ))}
              </Box>

              {form.items.map((item, idx) => (
                <Box key={idx} sx={{ display:'grid', gridTemplateColumns:'3fr 1fr 1.5fr 1fr 1fr auto',
                  gap:1, mb:1, alignItems:'center' }}>
                  <TextField size="small" placeholder={AR?'اسم المنتج أو الخدمة':'Product name'} value={item.name}
                    onChange={e => updateItem(idx,'name',e.target.value)}/>
                  <TextField size="small" type="number" value={item.quantity}
                    onChange={e => updateItem(idx,'quantity',+e.target.value)}
                    inputProps={{ min:1 }}/>
                  <TextField size="small" type="number" value={item.unitPrice}
                    onChange={e => updateItem(idx,'unitPrice',+e.target.value)}
                    inputProps={{ min:0 }}
                    InputProps={{ endAdornment:<InputAdornment position="end" sx={{ fontSize:'0.7rem' }}>{CUR}</InputAdornment> }}/>
                  <TextField size="small" type="number" value={item.taxRate}
                    onChange={e => updateItem(idx,'taxRate',+e.target.value)}
                    inputProps={{ min:0, max:100 }}
                    InputProps={{ endAdornment:<InputAdornment position="end">%</InputAdornment> }}/>
                  <Typography variant="body2" fontWeight={600} sx={{ textAlign:'center', color:'#f57c00' }}>
                    {fmt(item.quantity * item.unitPrice)}
                  </Typography>
                  <IconButton size="small" onClick={() => removeItem(idx)} disabled={form.items.length===1}
                    sx={{ color:'#e53935' }}>
                    <Delete sx={{ fontSize:16 }}/>
                  </IconButton>
                </Box>
              ))}

              {/* Totals */}
              <Box sx={{ mt:2, p:2, bgcolor:'#f8f9fa', borderRadius:2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                  <Typography variant="body2" color="text.secondary">{AR?'المجموع قبل الضريبة:':'Subtotal:'}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmt(subtotal)} {CUR}</Typography>
                </Box>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                  <Typography variant="body2" color="text.secondary">{AR?'الضريبة:':'Tax:'}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmt(tax)} {CUR}</Typography>
                </Box>
                <Divider sx={{ my:1 }}/>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={800}>{AR?'الإجمالي:':'Total:'}</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#f57c00">{fmt(total)} {CUR}</Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Button onClick={() => setDialog(false)}>{t('common.cancel') || 'إلغاء'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving ? <CircularProgress size={16}/> : <Save/>}
              sx={{ bgcolor:'#f57c00','&:hover':{bgcolor:'#e65100'} }}>
              {AR ? 'إنشاء الأمر' : 'Create Order'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── VIEW DIALOG ── */}
        {viewDialog && (
          <Dialog open maxWidth="sm" fullWidth onClose={() => setViewDialog(null)}
            PaperProps={{ sx:{ borderRadius:3 } }}>
            <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider' }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Box>
                  {AR ? 'تفاصيل أمر الشراء' : 'Purchase Order Details'}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontFamily:'monospace' }}>
                    {viewDialog.orderNumber}
                  </Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Chip label={STATUS_LABEL[viewDialog.status]} color={STATUS_COLOR[viewDialog.status]} size="small"/>
                  <IconButton onClick={() => setViewDialog(null)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt:2 }}>
              <Box sx={{ p:1.5, bgcolor:'#f8f9fa', borderRadius:2, mb:2 }}>
                <Typography variant="body2" fontWeight={700}>{AR?'المورد:':'Supplier:'}</Typography>
                <Typography variant="body2">{viewDialog.supplier?.name || '—'}</Typography>
                {viewDialog.supplier?.commercialReg && (
                  <Typography variant="caption" color="text.secondary">🏢 {viewDialog.supplier.commercialReg}</Typography>
                )}
              </Box>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor:'#f5f5f5' }}>
                  <TableCell fontWeight={700}>{AR?'المنتج':'Item'}</TableCell>
                  <TableCell align="center">{AR?'الكمية':'Qty'}</TableCell>
                  <TableCell align="right">{AR?'السعر':'Price'}</TableCell>
                  <TableCell align="right">{AR?'الإجمالي':'Total'}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {(viewDialog.items||[]).map((it,i) => (
                    <TableRow key={i}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell align="center">{it.quantity}</TableCell>
                      <TableCell align="right">{fmt(it.unitPrice)} {CUR}</TableCell>
                      <TableCell align="right" sx={{ fontWeight:600 }}>{fmt(it.total || it.quantity*it.unitPrice)} {CUR}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ mt:2, p:1.5, bgcolor:'#f8f9fa', borderRadius:2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography fontWeight={700}>{AR?'الإجمالي:':'Total:'}</Typography>
                  <Typography fontWeight={800} color="#f57c00">{fmt(viewDialog.totalAmount)} {CUR}</Typography>
                </Box>
              </Box>
            </DialogContent>
          </Dialog>
        )}

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')}
          anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
