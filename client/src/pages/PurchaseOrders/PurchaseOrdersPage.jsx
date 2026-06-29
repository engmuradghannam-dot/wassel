import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, CircularProgress, Snackbar,
  Alert, TextField, InputAdornment, Tooltip, Avatar, Divider,
  Autocomplete, Tabs, Tab, Badge
} from '@mui/material';
import {
  Add, Visibility, Search, Refresh, Delete, ShoppingCart,
  Close, Save, AddCircle, Business, Receipt, Phone, CheckCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const EMPTY_FORM = {
  supplier: null,
  notes: '',
  expectedDelivery: '',
  items: [{ name:'', qty:1, unit:'', unitPrice:0, taxRate:15 }]
};

const STATUS_COLOR = { draft:'default', pending:'warning', approved:'info', received:'success', partial:'warning', cancelled:'error' };

export default function PurchaseOrdersPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [orders,    setOrders]    = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dialog,    setDialog]    = useState(false);
  const [viewItem,  setViewItem]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [search,    setSearch]    = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [snack,     setSnack]     = useState('');

  // ── Load ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordR, supR] = await Promise.all([
        api.get('/api/purchase-orders'),
        api.get('/api/suppliers'),
      ]);
      if (ordR.data.success) setOrders(ordR.data.data || []);
      if (supR.data.success) setSuppliers(supR.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  // ── Items ─────────────────────────────────────────────────────
  const addItem    = () => setForm(p => ({ ...p, items:[...p.items, { name:'', qty:1, unit:'', unitPrice:0, taxRate:15 }] }));
  const removeItem = idx => setForm(p => ({ ...p, items: p.items.filter((_,i) => i!==idx) }));
  const setItem    = (idx, k, v) => setForm(p => ({ ...p, items: p.items.map((it,i) => i===idx ? {...it,[k]:v} : it) }));

  // ── Totals ────────────────────────────────────────────────────
  const totals = form.items.reduce((acc, it) => {
    const sub = +(it.qty||0) * +(it.unitPrice||0);
    const tax = sub * (+(it.taxRate||0)/100);
    return { sub: acc.sub+sub, tax: acc.tax+tax, total: acc.total+sub+tax };
  }, { sub:0, tax:0, total:0 });

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.supplier?._id) { setError(AR?'يرجى اختيار المورد':'Please select a supplier'); return; }
    if (!form.items[0]?.name) { setError(AR?'أضف بنداً واحداً على الأقل':'Add at least one item'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/api/purchase-orders', {
        supplier: form.supplier._id,
        notes: form.notes,
        expectedDate: form.expectedDelivery || undefined,
        items: form.items.filter(i=>i.name).map(i=>({
          name: i.name, quantity: +i.qty, unit: i.unit,
          unitPrice: +i.unitPrice, taxRate: +i.taxRate,
          total: +i.qty * +i.unitPrice,
        })),
      });
      setSnack(AR?'تم إنشاء أمر الشراء بنجاح':'Purchase Order created');
      setDialog(false); setForm(EMPTY_FORM); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const fmt  = n => (+n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const CUR  = AR?'ر.س':'SAR';
  const SL   = { draft:AR?'مسودة':'Draft', pending:AR?'معلق':'Pending', approved:AR?'معتمد':'Approved', received:AR?'مستلم':'Received', partial:AR?'جزئي':'Partial', cancelled:AR?'ملغى':'Cancelled' };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber?.toLowerCase().includes(q) ||
      o.supplier?.name?.toLowerCase().includes(q) ||
      o.supplier?.commercialReg?.includes(q) ||
      o.supplier?.vatNumber?.includes(q) ||
      o.supplier?.phone?.includes(q);
  });

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <ShoppingCart sx={{ fontSize:32, color:'#f57c00' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'أوامر الشراء':'Purchase Orders'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {orders.length} {AR?'أمر':'orders'} · {orders.filter(o=>o.status==='pending').length} {AR?'معلق':'pending'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>}
              onClick={() => { setForm(EMPTY_FORM); setError(''); setDialog(true); }}
              sx={{ bgcolor:'#f57c00','&:hover':{bgcolor:'#e65100'}, borderRadius:2 }}>
              {AR?'+ أمر شراء جديد':'+ New PO'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        <TextField size="small"
          placeholder={AR?'بحث برقم الأمر أو اسم المورد أو السجل أو الرقم الضريبي...':'Search by PO#, supplier, CR, VAT...'}
          value={search} onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:480 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الأمر':'PO #'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المورد':'Supplier'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'السجل التجاري':'CR No.'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الرقم الضريبي':'VAT No.'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'التاريخ':'Date'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الإجمالي':'Total'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell align="center" sx={{ fontWeight:700 }}>{'—'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:5 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:5, color:'text.secondary' }}>
                  {AR?'لا توجد أوامر شراء':'No purchase orders found'}
                </TableCell></TableRow>
              ) : filtered.map(o => (
                <TableRow key={o._id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontFamily:'monospace', color:'#f57c00' }}>{o.orderNumber}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Avatar sx={{ width:30, height:30, bgcolor:'#f57c0018', color:'#f57c00', fontSize:12, fontWeight:700 }}>{o.supplier?.name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{o.supplier?.name||'—'}</Typography>
                        {o.supplier?.phone && <Typography variant="caption" color="text.secondary">📞 {o.supplier.phone}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{o.supplier?.commercialReg||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{o.supplier?.vatNumber||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{o.createdAt?new Date(o.createdAt).toLocaleDateString(AR?'ar-SA':'en-GB'):'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} color="#f57c00">{fmt(o.totalAmount||o.total)} {CUR}</Typography></TableCell>
                  <TableCell><Chip label={SL[o.status]||o.status} color={STATUS_COLOR[o.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/></TableCell>
                  <TableCell align="center">
                    <Tooltip title={AR?'عرض':'View'}>
                      <IconButton size="small" onClick={()=>setViewItem(o)} sx={{ color:'#1a73e8' }}><Visibility sx={{ fontSize:16 }}/></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ══ NEW PO DIALOG ══ */}
        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5, fontWeight:800 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <ShoppingCart sx={{ color:'#f57c00' }}/>
                {AR?'أمر شراء جديد':'New Purchase Order'}
              </Box>
              <IconButton onClick={()=>setDialog(false)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt:3 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

            <Grid container spacing={2} sx={{ mb:2 }}>
              {/* ── SUPPLIER AUTOCOMPLETE ── */}
              <Grid item xs={12}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={s => typeof s==='string'?s:(s.name||'')}
                  filterOptions={(opts, state) => {
                    const q = state.inputValue.toLowerCase();
                    if (!q) return opts;
                    return opts.filter(s =>
                      s.name?.toLowerCase().includes(q) ||
                      s.nameEn?.toLowerCase().includes(q) ||
                      s.commercialReg?.includes(q) ||
                      s.vatNumber?.includes(q) ||
                      s.phone?.includes(q) ||
                      s.email?.toLowerCase().includes(q) ||
                      s.code?.toLowerCase().includes(q)
                    );
                  }}
                  value={form.supplier}
                  onChange={(_, val) => setForm(p => ({ ...p, supplier: val }))}
                  noOptionsText={suppliers.length===0
                    ? (AR?'⚠ لا يوجد موردون — أضف من قسم الموردين أولاً':'No suppliers — add from Suppliers section first')
                    : (AR?'لا نتائج':'No results')}
                  renderOption={(props, opt) => (
                    <Box component="li" {...props} sx={{ py:1.5 }}>
                      <Avatar sx={{ width:34, height:34, bgcolor:'#f57c0018', color:'#f57c00', fontSize:13, fontWeight:700, mr:1.5, flexShrink:0 }}>{opt.name?.[0]}</Avatar>
                      <Box sx={{ flex:1 }}>
                        <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                        <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap', mt:0.3 }}>
                          {opt.commercialReg && <Typography variant="caption" color="text.secondary">🏢 {opt.commercialReg}</Typography>}
                          {opt.vatNumber     && <Typography variant="caption" color="text.secondary">🧾 {opt.vatNumber}</Typography>}
                          {opt.phone         && <Typography variant="caption" color="text.secondary">📞 {opt.phone}</Typography>}
                        </Box>
                      </Box>
                    </Box>
                  )}
                  renderInput={params => (
                    <TextField {...params} label={`${AR?'المورد':'Supplier'} *`} required
                      placeholder={AR?'ابحث بالاسم أو السجل التجاري أو الرقم الضريبي أو الهاتف...':'Search by name, CR, VAT or phone...'}
                      InputProps={{ ...params.InputProps,
                        startAdornment:<><InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment>{params.InputProps.startAdornment}</>
                      }}/>
                  )}
                />
              </Grid>

              {/* ── SUPPLIER INFO CARD (auto-filled, read-only) ── */}
              {form.supplier && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p:2, borderRadius:2, bgcolor:'#fff8f0', borderColor:'#f57c0040' }}>
                    <Typography variant="caption" color="#f57c00" fontWeight={700} display="block" sx={{ mb:1 }}>
                      {AR?'معلومات المورد (تعبأ تلقائياً)':'Supplier Info (auto-filled)'}
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label={AR?'اسم المورد':'Supplier Name'}
                          value={form.supplier.name||''} disabled
                          InputProps={{ startAdornment:<InputAdornment position="start"><Business sx={{ fontSize:16, color:'#f57c00' }}/></InputAdornment> }}/>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small"
                          label={AR?'رقم السجل التجاري':'Commercial Reg. No.'}
                          value={form.supplier.commercialReg||'—'} disabled
                          inputProps={{ style:{ fontFamily:'monospace', letterSpacing:1 } }}
                          InputProps={{ startAdornment:<InputAdornment position="start">🏢</InputAdornment> }}/>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small"
                          label={AR?'الرقم الضريبي (VAT)':'VAT Number'}
                          value={form.supplier.vatNumber||'—'} disabled
                          inputProps={{ style:{ fontFamily:'monospace', letterSpacing:1 } }}
                          InputProps={{ startAdornment:<InputAdornment position="start"><Receipt sx={{ fontSize:16, color:'#f57c00' }}/></InputAdornment> }}/>
                      </Grid>
                      {form.supplier.phone && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label={AR?'الهاتف':'Phone'}
                            value={form.supplier.phone} disabled
                            InputProps={{ startAdornment:<InputAdornment position="start"><Phone sx={{ fontSize:16 }}/></InputAdornment> }}/>
                        </Grid>
                      )}
                      {form.supplier.paymentTerms && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small"
                            label={AR?'شروط الدفع':'Payment Terms'}
                            value={`${form.supplier.paymentTerms} ${AR?'يوم':'days'}`} disabled/>
                        </Grid>
                      )}
                      {form.supplier.email && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label="Email"
                            value={form.supplier.email} disabled/>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label={AR?'تاريخ التسليم المتوقع':'Expected Delivery Date'}
                  type="date" value={form.expectedDelivery}
                  onChange={e=>setForm(p=>({...p,expectedDelivery:e.target.value}))}
                  InputLabelProps={{ shrink:true }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label={AR?'ملاحظات':'Notes'}
                  value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
              </Grid>
            </Grid>

            {/* ── ITEMS TABLE ── */}
            <Box sx={{ mb:1.5 }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{AR?'البنود':'Line Items'}</Typography>
                <Button size="small" startIcon={<AddCircle/>} onClick={addItem} sx={{ color:'#f57c00' }}>
                  {AR?'إضافة بند':'Add Item'}
                </Button>
              </Box>

              {/* Header row */}
              <Box sx={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1.5fr 1fr 1fr 36px',
                gap:1, px:0.5, mb:0.5 }}>
                {[AR?'المنتج / الخدمة':'Product/Service', AR?'الكمية':'Qty', AR?'الوحدة':'Unit',
                  AR?'سعر الوحدة':'Unit Price', AR?'ض.ق.م %':'VAT%', AR?'الإجمالي':'Total',''].map((h,i)=>(
                  <Typography key={i} variant="caption" color="text.secondary" fontWeight={700} noWrap>{h}</Typography>
                ))}
              </Box>

              {form.items.map((it, idx) => {
                const lineTotal = +(it.qty||0) * +(it.unitPrice||0) * (1 + (+(it.taxRate||0)/100));
                return (
                  <Box key={idx} sx={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1.5fr 1fr 1fr 36px',
                    gap:1, mb:1, alignItems:'center' }}>
                    <TextField size="small" placeholder={AR?'اسم المنتج أو الخدمة':'Item name'} value={it.name}
                      onChange={e=>setItem(idx,'name',e.target.value)}/>
                    <TextField size="small" type="number" value={it.qty}
                      onChange={e=>setItem(idx,'qty',+e.target.value)} inputProps={{ min:1 }}/>
                    <TextField size="small" placeholder={AR?'قطعة':'pcs'} value={it.unit}
                      onChange={e=>setItem(idx,'unit',e.target.value)}/>
                    <TextField size="small" type="number" value={it.unitPrice}
                      onChange={e=>setItem(idx,'unitPrice',+e.target.value)} inputProps={{ min:0 }}
                      InputProps={{ endAdornment:<InputAdornment position="end" sx={{ fontSize:'0.65rem' }}>{CUR}</InputAdornment> }}/>
                    <TextField size="small" type="number" value={it.taxRate}
                      onChange={e=>setItem(idx,'taxRate',+e.target.value)} inputProps={{ min:0,max:100 }}
                      InputProps={{ endAdornment:<InputAdornment position="end">%</InputAdornment> }}/>
                    <Typography variant="body2" fontWeight={600} color="#f57c00" sx={{ textAlign:'center', pt:1 }}>
                      {fmt(lineTotal)}
                    </Typography>
                    <IconButton size="small" onClick={()=>removeItem(idx)} disabled={form.items.length===1}
                      sx={{ color:'#e53935', mt:0.5 }}>
                      <Delete sx={{ fontSize:15 }}/>
                    </IconButton>
                  </Box>
                );
              })}
            </Box>

            {/* Totals */}
            <Box sx={{ ml:'auto', maxWidth:320 }}>
              <Paper variant="outlined" sx={{ p:2, borderRadius:2, bgcolor:'#fafafa' }}>
                {[
                  [AR?'المجموع قبل الضريبة:':'Subtotal:', fmt(totals.sub)],
                  [AR?'ضريبة القيمة المضافة:':'VAT:', fmt(totals.tax)],
                ].map(([l,v])=>(
                  <Box key={l} sx={{ display:'flex', justifyContent:'space-between', mb:0.8 }}>
                    <Typography variant="body2" color="text.secondary">{l}</Typography>
                    <Typography variant="body2" fontWeight={600}>{v} {CUR}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my:1 }}/>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography fontWeight={800}>{AR?'الإجمالي:':'Total:'}</Typography>
                  <Typography fontWeight={800} color="#f57c00" fontSize="1.1rem">{fmt(totals.total)} {CUR}</Typography>
                </Box>
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:'#f57c00','&:hover':{bgcolor:'#e65100'} }}>
              {AR?'إنشاء أمر الشراء':'Create PO'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ══ VIEW DIALOG ══ */}
        {viewItem && (
          <Dialog open maxWidth="sm" fullWidth onClose={()=>setViewItem(null)} PaperProps={{ sx:{ borderRadius:3 } }}>
            <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5 }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Box>
                  <Typography fontWeight={800}>{AR?'أمر الشراء':'Purchase Order'}: {viewItem.orderNumber}</Typography>
                  <Chip label={SL[viewItem.status]} color={STATUS_COLOR[viewItem.status]} size="small" sx={{ mt:0.5 }}/>
                </Box>
                <IconButton onClick={()=>setViewItem(null)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt:2 }}>
              {/* Supplier block */}
              <Paper variant="outlined" sx={{ p:2, borderRadius:2, mb:2, bgcolor:'#fff8f0', borderColor:'#f57c0040' }}>
                <Typography variant="caption" color="#f57c00" fontWeight={700} display="block" sx={{ mb:1 }}>
                  {AR?'معلومات المورد':'Supplier Details'}
                </Typography>
                <Grid container spacing={1}>
                  {[
                    [AR?'الاسم':'Name', viewItem.supplier?.name],
                    [AR?'السجل التجاري':'CR No.', viewItem.supplier?.commercialReg],
                    [AR?'الرقم الضريبي':'VAT No.', viewItem.supplier?.vatNumber],
                    [AR?'الهاتف':'Phone', viewItem.supplier?.phone],
                    [AR?'البريد':'Email', viewItem.supplier?.email],
                  ].filter(([,v])=>v).map(([l,v])=>(
                    <Grid item xs={6} key={l}>
                      <Typography variant="caption" color="text.secondary" display="block">{l}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily:/No\.|رقم/.test(l)?'monospace':'inherit' }}>{v}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Items */}
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor:'#f5f5f5' }}>
                  <TableCell fontWeight={700}>{AR?'المنتج':'Item'}</TableCell>
                  <TableCell align="center">{AR?'الكمية':'Qty'}</TableCell>
                  <TableCell align="right">{AR?'السعر':'Price'}</TableCell>
                  <TableCell align="right">{AR?'الإجمالي':'Total'}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {(viewItem.items||[]).map((it,i)=>(
                    <TableRow key={i}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell align="center">{it.quantity} {it.unit||''}</TableCell>
                      <TableCell align="right">{fmt(it.unitPrice)} {CUR}</TableCell>
                      <TableCell align="right" sx={{ fontWeight:600 }}>{fmt(it.total||it.quantity*it.unitPrice)} {CUR}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ mt:2, p:2, bgcolor:'#f8f9fa', borderRadius:2 }}>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                  <Typography variant="body2" color="text.secondary">{AR?'قبل الضريبة:':'Subtotal:'}</Typography>
                  <Typography variant="body2">{fmt(viewItem.subtotal)} {CUR}</Typography>
                </Box>
                <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                  <Typography variant="body2" color="text.secondary">{AR?'الضريبة:':'VAT:'}</Typography>
                  <Typography variant="body2">{fmt(viewItem.taxAmount)} {CUR}</Typography>
                </Box>
                <Divider sx={{ my:1 }}/>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography fontWeight={800}>{AR?'الإجمالي:':'Total:'}</Typography>
                  <Typography fontWeight={800} color="#f57c00">{fmt(viewItem.totalAmount||viewItem.total)} {CUR}</Typography>
                </Box>
              </Box>

              {viewItem.notes && (
                <Box sx={{ mt:1.5, p:1.5, bgcolor:'#f5f5f5', borderRadius:2 }}>
                  <Typography variant="caption" color="text.secondary">{AR?'ملاحظات:':'Notes:'}</Typography>
                  <Typography variant="body2">{viewItem.notes}</Typography>
                </Box>
              )}
            </DialogContent>
          </Dialog>
        )}

        <Snackbar open={!!snack} autoHideDuration={3500} onClose={()=>setSnack('')}
          anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
