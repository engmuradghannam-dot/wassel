import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, CircularProgress, Snackbar,
  Alert, TextField, InputAdornment, Tooltip, Avatar, Divider,
  Autocomplete, Tab, Tabs, MenuItem
} from '@mui/material';
import {
  Add, Visibility, Search, Refresh, Delete, Receipt, Close,
  Save, AddCircle, Business, Phone, SwapHoriz, CheckCircle,
  Description, PictureAsPdf
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

// ── Constants ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  type: 'quotation',
  customer: null,
  validUntil: '',
  deliveryDate: '',
  notes: '',
  items: [{ description:'', qty:1, unit:'', unitPrice:0, discount:0, taxRate:15 }]
};

// ══════════════════════════════════════════════════════════════════════════
export default function SalesOrdersPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [activeTab,  setActiveTab]  = useState(0);  // 0=quotations 1=invoices
  const [orders,     setOrders]     = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [dialog,     setDialog]     = useState(false);
  const [viewItem,   setViewItem]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [search,     setSearch]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [converting, setConverting] = useState(null); // id being converted
  const [error,      setError]      = useState('');
  const [snack,      setSnack]      = useState({ open:false, msg:'', sev:'success' });

  const showSnack = (msg, sev='success') => setSnack({ open:true, msg, sev });

  // ── Load ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const type = activeTab === 0 ? 'quotation' : 'invoice';
      const [ordR, cusR] = await Promise.all([
        api.get(`/api/sales-orders?type=${type}`),
        api.get('/api/customers'),
      ]);
      if (ordR.data.success) setOrders(ordR.data.data || []);
      if (cusR.data.success) setCustomers(cusR.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [activeTab, t]);

  useEffect(() => { load(); }, [load]);

  // ── Items ─────────────────────────────────────────────────────
  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { description:'', qty:1, unit:'', unitPrice:0, discount:0, taxRate:15 }] }));
  const removeItem = i  => setForm(p => ({ ...p, items: p.items.filter((_,idx) => idx !== i) }));
  const setItem    = (i, k, v) => setForm(p => ({ ...p, items: p.items.map((it,idx) => idx===i ? {...it,[k]:v} : it) }));

  // ── Totals ────────────────────────────────────────────────────
  const totals = form.items.reduce((acc, it) => {
    const base = +(it.qty||0) * +(it.unitPrice||0) * (1 - (+(it.discount||0)/100));
    const tax  = base * (+(it.taxRate||0)/100);
    return { sub: acc.sub+base, tax: acc.tax+tax, total: acc.total+base+tax };
  }, { sub:0, tax:0, total:0 });

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.customer?._id) {
      setError(AR ? 'يرجى اختيار العميل' : 'Please select a customer');
      return;
    }
    if (!form.items[0]?.description) {
      setError(AR ? 'أضف بنداً واحداً على الأقل' : 'Add at least one item');
      return;
    }
    setSaving(true); setError('');
    try {
      const type = activeTab === 0 ? 'quotation' : 'invoice';
      await api.post('/api/sales-orders', {
        type,
        customer:     form.customer._id,
        validUntil:   form.validUntil   || undefined,
        deliveryDate: form.deliveryDate || undefined,
        notes:        form.notes,
        items: form.items.filter(i => i.description).map(i => ({
          description: i.description,
          quantity:    +i.qty,
          unit:        i.unit,
          unitPrice:   +i.unitPrice,
          discount:    +i.discount,
          taxRate:     +i.taxRate,
        })),
      });
      showSnack(AR
        ? (type==='quotation' ? 'تم إنشاء عرض السعر بنجاح' : 'تم إنشاء الفاتورة بنجاح')
        : (type==='quotation' ? 'Quotation created' : 'Invoice created'));
      setDialog(false); setForm(EMPTY_FORM); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  // ── Convert quotation → invoice ────────────────────────────────
  const convertToInvoice = async (id) => {
    if (!window.confirm(AR ? 'تحويل عرض السعر إلى فاتورة؟' : 'Convert this quotation to an invoice?')) return;
    setConverting(id);
    try {
      const r = await api.put(`/api/sales-orders/${id}/convert-to-invoice`);
      showSnack(r.data.message || (AR ? 'تم التحويل إلى فاتورة بنجاح' : 'Converted to invoice'));
      load();
    } catch (e) { showSnack(e.response?.data?.message || t('common.error'), 'error'); }
    finally { setConverting(null); }
  };

  // ── Labels ────────────────────────────────────────────────────
  const fmt = n => (+n||0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
  const CUR = AR ? 'ر.س' : 'SAR';

  const STATUS_LABEL_AR = { draft:'مسودة', sent:'مُرسل', confirmed:'مؤكد', processing:'قيد التنفيذ', delivered:'مُسلَّم', cancelled:'ملغى', returned:'مُعاد' };
  const STATUS_LABEL_EN = { draft:'Draft', sent:'Sent', confirmed:'Confirmed', processing:'Processing', delivered:'Delivered', cancelled:'Cancelled', returned:'Returned' };
  const STATUS_COLOR    = { draft:'default', sent:'info', confirmed:'primary', processing:'warning', delivered:'success', cancelled:'error', returned:'default' };
  const SL = AR ? STATUS_LABEL_AR : STATUS_LABEL_EN;

  const PAY_COLOR  = { unpaid:'error', partial:'warning', paid:'success', overdue:'error' };
  const PAY_LABEL  = { unpaid:AR?'غير مدفوع':'Unpaid', partial:AR?'جزئي':'Partial', paid:AR?'مدفوع':'Paid', overdue:AR?'متأخر':'Overdue' };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber?.toLowerCase().includes(q) ||
           o.invoiceNumber?.toLowerCase().includes(q) ||
           o.customer?.name?.toLowerCase().includes(q) ||
           o.customer?.commercialReg?.includes(q) ||
           o.customer?.vatNumber?.includes(q) ||
           o.customer?.phone?.includes(q);
  });

  const tabColor = activeTab === 0 ? '#7b1fa2' : '#1a73e8';

  // ══════════════════════════════════════════════════════════════
  return (
    <Layout>
      <Box sx={{ p:3 }}>

        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Description sx={{ fontSize:32, color:tabColor }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {AR ? 'المبيعات والفواتير' : 'Sales & Invoices'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {orders.length} {AR ? (activeTab===0?'عرض سعر':'فاتورة') : (activeTab===0?'quotation':'invoice')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>}
              onClick={() => { setForm({...EMPTY_FORM, type: activeTab===0?'quotation':'invoice'}); setError(''); setDialog(true); }}
              sx={{ bgcolor:tabColor, '&:hover':{filter:'brightness(0.9)'}, borderRadius:2 }}>
              {activeTab===0 ? (AR?'+ عرض سعر جديد':'+ New Quotation') : (AR?'+ فاتورة جديدة':'+ New Invoice')}
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_,v)=>setActiveTab(v)}
          sx={{ mb:2, '& .MuiTab-root':{ fontWeight:700 },
            '& .Mui-selected':{ color:tabColor },
            '& .MuiTabs-indicator':{ bgcolor:tabColor } }}>
          <Tab label={
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Description sx={{ fontSize:18 }}/>
              {AR ? 'عروض الأسعار' : 'Quotations'}
            </Box>
          }/>
          <Tab label={
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Receipt sx={{ fontSize:18 }}/>
              {AR ? 'الفواتير' : 'Invoices'}
            </Box>
          }/>
        </Tabs>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        <TextField size="small"
          placeholder={AR
            ? 'بحث برقم العرض أو اسم العميل أو السجل التجاري أو الرقم الضريبي...'
            : 'Search by number, customer name, CR, VAT...'}
          value={search} onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:500 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?(activeTab===0?'رقم العرض':'رقم الفاتورة'):(activeTab===0?'Quote#':'Invoice#')}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'العميل':'Customer'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'السجل التجاري':'CR No.'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الرقم الضريبي':'VAT No.'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'التاريخ':'Date'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الإجمالي':'Total'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                {activeTab===1 && <TableCell sx={{ fontWeight:700 }}>{AR?'الدفع':'Payment'}</TableCell>}
                <TableCell align="center" sx={{ fontWeight:700 }}>{'—'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py:5 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py:5, color:'text.secondary' }}>
                  {activeTab===0
                    ? (AR?'لا توجد عروض أسعار — ابدأ بإنشاء عرض سعر جديد':'No quotations found')
                    : (AR?'لا توجد فواتير':'No invoices found')}
                </TableCell></TableRow>
              ) : filtered.map(o => (
                <TableRow key={o._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily:'monospace', color:tabColor }}>
                      {o.invoiceNumber || o.orderNumber || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Avatar sx={{ width:28, height:28, bgcolor:`${tabColor}18`, color:tabColor, fontSize:12, fontWeight:700 }}>
                        {o.customer?.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{o.customer?.name||'—'}</Typography>
                        {o.customer?.phone && <Typography variant="caption" color="text.secondary">📞 {o.customer.phone}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{o.customer?.commercialReg||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{o.customer?.vatNumber||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{o.createdAt?new Date(o.createdAt).toLocaleDateString(AR?'ar-SA':'en-GB'):'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} color={tabColor}>{fmt(o.total)} {CUR}</Typography></TableCell>
                  <TableCell><Chip label={SL[o.status]||o.status} color={STATUS_COLOR[o.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/></TableCell>
                  {activeTab===1 && (
                    <TableCell><Chip label={PAY_LABEL[o.paymentStatus]||o.paymentStatus} color={PAY_COLOR[o.paymentStatus]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/></TableCell>
                  )}
                  <TableCell align="center">
                    <Tooltip title={AR?'عرض التفاصيل':'View'}>
                      <IconButton size="small" onClick={()=>setViewItem(o)} sx={{ color:'#1a73e8' }}>
                        <Visibility sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                    {/* Convert button — only for quotations */}
                    {activeTab===0 && o.status !== 'cancelled' && (
                      <Tooltip title={AR?'تحويل إلى فاتورة':'Convert to Invoice'}>
                        <IconButton size="small"
                          onClick={() => convertToInvoice(o._id)}
                          disabled={converting === o._id}
                          sx={{ color:'#34a853', ml:0.5 }}>
                          {converting===o._id
                            ? <CircularProgress size={14}/>
                            : <SwapHoriz sx={{ fontSize:16 }}/>}
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ══ NEW QUOTATION/INVOICE DIALOG ══ */}
        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="md" fullWidth
          PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5, fontWeight:800 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                {activeTab===0 ? <Description sx={{ color:'#7b1fa2' }}/> : <Receipt sx={{ color:'#1a73e8' }}/>}
                <Typography fontWeight={800}>
                  {activeTab===0 ? (AR?'عرض سعر جديد':'New Quotation') : (AR?'فاتورة جديدة':'New Invoice')}
                </Typography>
              </Box>
              <IconButton onClick={()=>setDialog(false)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt:3 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

            <Grid container spacing={2} sx={{ mb:2 }}>
              {/* Customer Autocomplete */}
              <Grid item xs={12}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={c => typeof c==='string'?c:(c.name||'')}
                  filterOptions={(opts, state) => {
                    const q = state.inputValue.toLowerCase();
                    if (!q) return opts;
                    return opts.filter(c =>
                      c.name?.toLowerCase().includes(q) ||
                      c.nameEn?.toLowerCase().includes(q) ||
                      c.commercialReg?.includes(q) ||
                      c.vatNumber?.includes(q) ||
                      c.phone?.includes(q) ||
                      c.mobile?.includes(q) ||
                      c.code?.toLowerCase().includes(q)
                    );
                  }}
                  value={form.customer}
                  onChange={(_, val) => setForm(p => ({ ...p, customer: val }))}
                  noOptionsText={customers.length===0
                    ? (AR?'⚠ لا يوجد عملاء — أضف من قسم العملاء أولاً':'No customers — add from Customers section')
                    : (AR?'لا نتائج':'No results')}
                  renderOption={(props, opt) => (
                    <Box component="li" {...props} sx={{ py:1.5 }}>
                      <Avatar sx={{ width:34, height:34, bgcolor:`${tabColor}18`, color:tabColor, fontSize:13, fontWeight:700, mr:1.5, flexShrink:0 }}>
                        {opt.name?.[0]}
                      </Avatar>
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
                    <TextField {...params} label={`${AR?'العميل':'Customer'} *`} required
                      placeholder={AR?'ابحث بالاسم أو السجل التجاري أو الرقم الضريبي أو الهاتف...':'Search by name, CR, VAT or phone...'}
                      InputProps={{ ...params.InputProps,
                        startAdornment:<><InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment>{params.InputProps.startAdornment}</>
                      }}/>
                  )}
                />
              </Grid>

              {/* Customer info card — auto-filled */}
              {form.customer && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p:2, borderRadius:2, bgcolor: activeTab===0?'#f9f0ff':'#f0f5ff', borderColor:`${tabColor}40` }}>
                    <Typography variant="caption" color={tabColor} fontWeight={700} display="block" sx={{ mb:1.2 }}>
                      {AR?'معلومات العميل (تعبأ تلقائياً عند اختيار الاسم)':'Customer Info (auto-filled when name is selected)'}
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small" label={AR?'اسم العميل':'Customer Name'}
                          value={form.customer.name||''} disabled
                          InputProps={{ startAdornment:<InputAdornment position="start"><Business sx={{ fontSize:16, color:tabColor }}/></InputAdornment> }}/>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small"
                          label={AR?'رقم السجل التجاري':'Commercial Reg. No.'}
                          value={form.customer.commercialReg||form.customer.taxNumber||'—'} disabled
                          inputProps={{ style:{ fontFamily:'monospace', letterSpacing:1 } }}
                          InputProps={{ startAdornment:<InputAdornment position="start">🏢</InputAdornment> }}/>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth size="small"
                          label={AR?'الرقم الضريبي (VAT)':'VAT Number'}
                          value={form.customer.vatNumber||'—'} disabled
                          inputProps={{ style:{ fontFamily:'monospace', letterSpacing:1 } }}
                          InputProps={{ startAdornment:<InputAdornment position="start"><Receipt sx={{ fontSize:16, color:tabColor }}/></InputAdornment> }}/>
                      </Grid>
                      {form.customer.phone && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label={AR?'الهاتف':'Phone'}
                            value={form.customer.phone} disabled
                            InputProps={{ startAdornment:<InputAdornment position="start"><Phone sx={{ fontSize:16 }}/></InputAdornment> }}/>
                        </Grid>
                      )}
                      {form.customer.paymentTerms && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label={AR?'شروط الدفع':'Payment Terms'}
                            value={`${form.customer.paymentTerms} ${AR?'يوم':'days'}`} disabled/>
                        </Grid>
                      )}
                      {form.customer.address && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label={AR?'العنوان':'Address'}
                            value={form.customer.address} disabled/>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              )}

              {/* Dates */}
              <Grid item xs={12} sm={activeTab===0?4:6}>
                <TextField fullWidth size="small"
                  label={AR?(activeTab===0?'صالح حتى تاريخ':'تاريخ الاستحقاق'):(activeTab===0?'Valid Until':'Due Date')}
                  type="date" value={activeTab===0?form.validUntil:form.deliveryDate}
                  onChange={e=>setForm(p=>({...p, [activeTab===0?'validUntil':'deliveryDate']:e.target.value}))}
                  InputLabelProps={{ shrink:true }}/>
              </Grid>
              {activeTab===0 && (
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small"
                    label={AR?'تاريخ التسليم المتوقع':'Expected Delivery'}
                    type="date" value={form.deliveryDate}
                    onChange={e=>setForm(p=>({...p,deliveryDate:e.target.value}))}
                    InputLabelProps={{ shrink:true }}/>
                </Grid>
              )}
              <Grid item xs={12} sm={activeTab===0?4:6}>
                <TextField fullWidth size="small" label={AR?'ملاحظات':'Notes'}
                  value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
              </Grid>
            </Grid>

            {/* Items */}
            <Box>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
                <Typography variant="subtitle2" fontWeight={700}>{AR?'البنود':'Line Items'}</Typography>
                <Button size="small" startIcon={<AddCircle/>} onClick={addItem} sx={{ color:tabColor }}>
                  {AR?'إضافة بند':'Add Item'}
                </Button>
              </Box>

              {/* Column headers */}
              <Box sx={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1.4fr 0.8fr 0.8fr 1fr 36px',
                gap:1, px:0.5, mb:0.5 }}>
                {[AR?'المنتج / الخدمة':'Product/Service', AR?'الكمية':'Qty', AR?'الوحدة':'Unit',
                  AR?'سعر الوحدة':'Unit Price', AR?'خصم%':'Disc%', AR?'ض%':'VAT%', AR?'الإجمالي':'Total', ''].map((h,i)=>(
                  <Typography key={i} variant="caption" color="text.secondary" fontWeight={700} noWrap>{h}</Typography>
                ))}
              </Box>

              {form.items.map((it, idx) => {
                const lineTotal = +(it.qty||0) * +(it.unitPrice||0) * (1-(+(it.discount||0)/100)) * (1+(+(it.taxRate||0)/100));
                return (
                  <Box key={idx} sx={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 1.4fr 0.8fr 0.8fr 1fr 36px',
                    gap:1, mb:1, alignItems:'center' }}>
                    <TextField size="small" placeholder={AR?'وصف المنتج أو الخدمة':'Description'} value={it.description}
                      onChange={e=>setItem(idx,'description',e.target.value)}/>
                    <TextField size="small" type="number" value={it.qty}
                      onChange={e=>setItem(idx,'qty',+e.target.value)} inputProps={{ min:1 }}/>
                    <TextField size="small" placeholder={AR?'قطعة':'pcs'} value={it.unit}
                      onChange={e=>setItem(idx,'unit',e.target.value)}/>
                    <TextField size="small" type="number" value={it.unitPrice}
                      onChange={e=>setItem(idx,'unitPrice',+e.target.value)} inputProps={{ min:0 }}
                      InputProps={{ endAdornment:<InputAdornment position="end" sx={{ fontSize:'0.6rem' }}>{CUR}</InputAdornment> }}/>
                    <TextField size="small" type="number" value={it.discount}
                      onChange={e=>setItem(idx,'discount',+e.target.value)} inputProps={{ min:0,max:100 }}
                      InputProps={{ endAdornment:<InputAdornment position="end">%</InputAdornment> }}/>
                    <TextField size="small" type="number" value={it.taxRate}
                      onChange={e=>setItem(idx,'taxRate',+e.target.value)} inputProps={{ min:0,max:100 }}
                      InputProps={{ endAdornment:<InputAdornment position="end">%</InputAdornment> }}/>
                    <Typography variant="body2" fontWeight={600} color={tabColor} sx={{ textAlign:'center', pt:1 }}>
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

            {/* Totals summary */}
            <Box sx={{ ml:'auto', maxWidth:340, mt:1 }}>
              <Paper variant="outlined" sx={{ p:2, borderRadius:2, bgcolor:'#fafafa' }}>
                {[
                  [AR?'المجموع قبل الخصم والضريبة:':'Subtotal before tax:', fmt(totals.sub)],
                  [AR?'ضريبة القيمة المضافة (VAT):':'VAT:', fmt(totals.tax)],
                ].map(([l,v])=>(
                  <Box key={l} sx={{ display:'flex', justifyContent:'space-between', mb:0.8 }}>
                    <Typography variant="body2" color="text.secondary">{l}</Typography>
                    <Typography variant="body2" fontWeight={600}>{v} {CUR}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my:1 }}/>
                <Box sx={{ display:'flex', justifyContent:'space-between' }}>
                  <Typography fontWeight={800}>{AR?'الإجمالي الشامل:':'Grand Total:'}</Typography>
                  <Typography fontWeight={800} color={tabColor} fontSize="1.1rem">{fmt(totals.total)} {CUR}</Typography>
                </Box>
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:tabColor, '&:hover':{filter:'brightness(0.9)'} }}>
              {activeTab===0 ? (AR?'إنشاء عرض السعر':'Create Quotation') : (AR?'إنشاء الفاتورة':'Create Invoice')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ══ VIEW DIALOG ══ */}
        {viewItem && (
          <Dialog open maxWidth="sm" fullWidth onClose={()=>setViewItem(null)} PaperProps={{ sx:{ borderRadius:3 } }}>
            <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5 }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Box>
                  <Typography fontWeight={800}>
                    {viewItem.type==='quotation'?(AR?'عرض السعر':'Quotation'):(AR?'الفاتورة':'Invoice')}: {viewItem.invoiceNumber||viewItem.orderNumber}
                  </Typography>
                  <Box sx={{ display:'flex', gap:0.8, mt:0.5 }}>
                    <Chip label={SL[viewItem.status]} color={STATUS_COLOR[viewItem.status]} size="small"/>
                    {viewItem.paymentStatus && <Chip label={PAY_LABEL[viewItem.paymentStatus]} color={PAY_COLOR[viewItem.paymentStatus]} size="small"/>}
                    {viewItem.type==='quotation' && (
                      <Button size="small" variant="outlined" color="success"
                        startIcon={<SwapHoriz/>}
                        onClick={() => { setViewItem(null); convertToInvoice(viewItem._id); }}
                        sx={{ fontSize:'0.7rem', py:0.2 }}>
                        {AR?'تحويل لفاتورة':'→ Invoice'}
                      </Button>
                    )}
                  </Box>
                </Box>
                <IconButton onClick={()=>setViewItem(null)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt:2 }}>
              {/* PDF export action */}
              <Box sx={{ display:'flex', justifyContent:'flex-end', mb:1.5 }}>
                <Button size="small" variant="outlined" startIcon={<PictureAsPdf sx={{ fontSize:16, color:'#d32f2f' }}/>}
                  component="a"
                  href={`${api.defaults.baseURL}/api/sales-orders/${viewItem._id}/pdf`}
                  target="_blank" rel="noreferrer"
                  sx={{ color:'#d32f2f', borderColor:'#d32f2f40' }}>
                  {AR?'تصدير PDF':'Export PDF'}
                </Button>
              </Box>

              {/* Customer info */}
              <Paper variant="outlined" sx={{ p:2, borderRadius:2, mb:2, bgcolor:activeTab===0?'#f9f0ff':'#f0f5ff', borderColor:`${tabColor}40` }}>
                <Typography variant="caption" color={tabColor} fontWeight={700} display="block" sx={{ mb:1 }}>
                  {AR?'معلومات العميل':'Customer Details'}
                </Typography>
                <Grid container spacing={1}>
                  {[
                    [AR?'الاسم':'Name', viewItem.customer?.name],
                    [AR?'السجل التجاري':'CR No.', viewItem.customer?.commercialReg||viewItem.customer?.taxNumber],
                    [AR?'الرقم الضريبي':'VAT No.', viewItem.customer?.vatNumber],
                    [AR?'الهاتف':'Phone', viewItem.customer?.phone],
                    [AR?'البريد':'Email', viewItem.customer?.email],
                  ].filter(([,v])=>v).map(([l,v])=>(
                    <Grid item xs={6} key={l}>
                      <Typography variant="caption" color="text.secondary" display="block">{l}</Typography>
                      <Typography variant="body2" fontWeight={600}
                        sx={{ fontFamily:/No\.|رقم/.test(l)?'monospace':'inherit' }}>{v}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Items table */}
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
                      <TableCell>{it.description||it.name}</TableCell>
                      <TableCell align="center">{it.quantity} {it.unit||''}</TableCell>
                      <TableCell align="right">{fmt(it.unitPrice)} {CUR}</TableCell>
                      <TableCell align="right" sx={{ fontWeight:600 }}>{fmt(it.total||it.quantity*it.unitPrice)} {CUR}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
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
                  <Typography fontWeight={800} color={tabColor}>{fmt(viewItem.total)} {CUR}</Typography>
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

        <Snackbar open={snack.open} autoHideDuration={4000} onClose={()=>setSnack(p=>({...p,open:false}))}
          anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity={snack.sev} onClose={()=>setSnack(p=>({...p,open:false}))} sx={{ borderRadius:2 }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
