import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  Tabs, Tab, Tooltip, Divider, MenuItem, Avatar
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, BusinessCenter,
  Phone, Email, AccountBalance, LocationOn, VerifiedUser,
  Close, Save, ContentCopy
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const COUNTRIES = [
  { code:'SA', name:'المملكة العربية السعودية' },
  { code:'AE', name:'الإمارات' },{ code:'KW', name:'الكويت' },
  { code:'QA', name:'قطر' },{ code:'BH', name:'البحرين' },
  { code:'OM', name:'عُمان' },{ code:'JO', name:'الأردن' },
  { code:'EG', name:'مصر' },{ code:'LB', name:'لبنان' },
  { code:'TR', name:'تركيا' },{ code:'IN', name:'الهند' },
  { code:'CN', name:'الصين' },{ code:'DE', name:'ألمانيا' },
  { code:'US', name:'الولايات المتحدة' },{ code:'GB', name:'المملكة المتحدة' },
  { code:'OTHER', name:'أخرى' },
];

const SAUDI_BANKS = [
  'مصرف الراجحي','البنك الأهلي السعودي','بنك الرياض','بنك البلاد',
  'البنك السعودي الفرنسي','بنك الجزيرة','البنك العربي الوطني',
  'بنك الإنماء','بنك ساب (SABB)','البنك السعودي للاستثمار','بنك آخر'
];

const PAYMENT_TERMS = [0,7,14,15,30,45,60,90,120];

const EMPTY = {
  name:'', nameEn:'', type:'company', code:'',
  commercialReg:'', vatNumber:'', nationalId:'', industry:'',
  contactPerson:'', contactTitle:'', email:'', phone:'', phone2:'', fax:'', website:'',
  address:'', district:'', city:'الرياض', country:'SA', zipCode:'', poBox:'',
  currency:'SAR', paymentTerms:30, creditLimit:0, discountPct:0,
  bankName:'', bankBranch:'', bankAccount:'', bankIBAN:'', bankSwift:'',
  category:'', rating:0, notes:'', isActive:true
};

// Translation keys for the page
const useTrans = (t) => ({
  title:         t('suppliers.title')         || 'الموردون',
  newSupplier:   t('suppliers.newSupplier')   || 'مورد جديد',
  supplierName:  t('suppliers.supplierName')  || 'اسم المورد',
  contactPerson: t('suppliers.contactPerson') || 'شخص التواصل',
  paymentTerms:  t('suppliers.paymentTerms')  || 'شروط الدفع',
  save:          t('common.save')             || 'حفظ',
  cancel:        t('common.cancel')           || 'إلغاء',
  edit:          t('common.edit')             || 'تعديل',
  delete:        t('common.delete')           || 'حذف',
  search:        t('common.search')           || 'بحث',
  loading:       t('common.loading')          || 'جارٍ التحميل...',
  noData:        t('common.noData')           || 'لا توجد بيانات',
  actions:       t('common.actions')          || 'إجراءات',
  active:        t('common.active')           || 'نشط',
  inactive:      t('common.inactive')         || 'غير نشط',
  phone:         t('common.phone')            || 'الهاتف',
  email:         t('common.email')            || 'البريد',
  address:       t('suppliers.address')       || 'العنوان',
  success:       t('common.success')          || 'تم بنجاح',
  error:         t('common.error')            || 'حدث خطأ',
});

const SuppliersPage = () => {
  const { t, i18n } = useTranslation();
  const tx = useTrans(t);
  const isRTL = ['ar','ur'].includes(i18n.language);

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState(0); // dialog tabs
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [snack,   setSnack]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/suppliers');
      if (r.data.success) setItems(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || tx.error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({...EMPTY}); setEditId(null); setTab(0); setError(''); setDialog(true); };
  const openEdit = (s)  => { setForm({...s});   setEditId(s._id);setTab(0); setError(''); setDialog(true); };
  const close    = () => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k => e => setForm(p => ({...p, [k]: e.target.value}));

  const validate = () => {
    if (!form.name.trim()) return t('common.required')+': '+t('suppliers.supplierName');
    if (form.commercialReg && !/^\d{10}$/.test(form.commercialReg.replace(/\s/g,''))) {
      return (i18n.language==='ar'?'السجل التجاري يجب أن يكون 10 أرقام':'CR must be 10 digits');
    }
    if (form.vatNumber && !/^3\d{14}$/.test(form.vatNumber.replace(/\s/g,''))) {
      return (i18n.language==='ar'?'الرقم الضريبي 15 رقم يبدأ بـ 3':'VAT must start with 3 and be 15 digits');
    }
    if (form.bankIBAN && !/^SA\d{22}$/i.test(form.bankIBAN.replace(/\s/g,''))) {
      return (i18n.language==='ar'?'IBAN سعودي يبدأ بـ SA ويكون 24 حرفاً':'Saudi IBAN must start with SA and be 24 chars');
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError('');
    try {
      // Clean numbers
      const payload = {
        ...form,
        commercialReg: form.commercialReg?.replace(/\s/g,''),
        vatNumber:     form.vatNumber?.replace(/\s/g,''),
        bankIBAN:      form.bankIBAN?.replace(/\s/g,''),
      };
      if (editId) await api.put(`/api/suppliers/${editId}`, payload);
      else        await api.post('/api/suppliers', payload);
      setSnack(editId ? (t('common.success')||'تم التحديث') : (t('common.success')||'تمت الإضافة'));
      close(); load();
    } catch (e) {
      setError(e.response?.data?.message || tx.error);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(i18n.language==='ar'?'هل أنت متأكد من الحذف؟':'Are you sure to delete?')) return;
    try {
      await api.delete(`/api/suppliers/${id}`);
      setSnack(t('common.success')||'تم الحذف'); load();
    } catch (e) { setError(e.response?.data?.message || tx.error); }
  };

  const filtered = items.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.nameEn?.toLowerCase().includes(q) ||
           s.code?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) ||
           s.phone?.includes(q) || s.commercialReg?.includes(q);
  });

  // ─── Dialog tab labels (i18n) ────────────────────────────────────────────
  const TABS = [
    { icon:'🏢', label: i18n.language==='ar'?'معلومات الشركة':'Company Info' },
    { icon:'📍', label: i18n.language==='ar'?'العنوان والتواصل':'Contact & Address' },
    { icon:'💰', label: i18n.language==='ar'?'المالية والدفع':'Financials' },
    { icon:'🏦', label: i18n.language==='ar'?'معلومات البنك':'Bank Info' },
  ];

  return (
    <Layout>
      <Box sx={{ p:3 }}>

        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <BusinessCenter sx={{ fontSize:32, color:'#7b1fa2' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{tx.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {i18n.language==='ar'?'مورد':'suppliers'} ·{' '}
                {items.filter(s=>s.isActive).length} {i18n.language==='ar'?'نشط': i18n.language==='en'?'active':t('common.active')||'active'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'}, borderRadius:2 }}>
              {tx.newSupplier}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        <TextField size="small" placeholder={`${tx.search}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:320 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{i18n.language==='ar'?'المورد':'Supplier'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{i18n.language==='ar'?'السجل / الضريبي':'CR / VAT'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{tx.contactPerson}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{tx.phone}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{i18n.language==='ar'?'شروط الدفع':'Payment Terms'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{i18n.language==='ar'?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{i18n.language==="ar"?"إجراءات":"Actions"}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4 }}>
                  <CircularProgress size={28}/>
                </TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4, color:'text.secondary' }}>
                  {tx.noData}
                </TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s._id} hover>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                      <Avatar sx={{ width:36, height:36, bgcolor:'#7b1fa220', color:'#7b1fa2', fontSize:14, fontWeight:700 }}>
                        {s.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                        {s.nameEn && <Typography variant="caption" color="text.secondary">{s.nameEn}</Typography>}
                        {s.code && <Typography variant="caption" color="text.secondary" display="block" sx={{ fontFamily:'monospace' }}>{s.code}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {s.commercialReg && <Typography variant="caption" display="block" sx={{ fontFamily:'monospace' }}>🏢 {s.commercialReg}</Typography>}
                    {s.vatNumber    && <Typography variant="caption" display="block" sx={{ fontFamily:'monospace' }}>🧾 {s.vatNumber}</Typography>}
                    {!s.commercialReg && !s.vatNumber && <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.contactPerson||'—'}</Typography>
                    {s.contactTitle && <Typography variant="caption" color="text.secondary">{s.contactTitle}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily:'monospace' }}>{s.phone||'—'}</Typography>
                    {s.email && <Typography variant="caption" color="text.secondary" display="block">{s.email}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={`${s.paymentTerms||30} ${i18n.language==='ar'?'يوم':'days'}`}
                      size="small" variant="outlined" sx={{ fontSize:'0.7rem' }}/>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.isActive ? tx.active : tx.inactive}
                      color={s.isActive?'success':'default'} size="small"
                      sx={{ fontSize:'0.7rem' }}/>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={tx.edit}>
                      <IconButton size="small" onClick={()=>openEdit(s)} sx={{ color:'#1a73e8' }}>
                        <Edit sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={tx.delete}>
                      <IconButton size="small" onClick={()=>handleDelete(s._id)} sx={{ color:'#e53935' }}>
                        <Delete sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ══ SUPPLIER DIALOG ══ */}
        <Dialog open={dialog} onClose={close} maxWidth="md" fullWidth
          PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle sx={{ pb:0 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Typography fontWeight={800} variant="h6">
                {editId ? `✏️ ${tx.edit}: ${form.name}` : `+ ${tx.newSupplier}`}
              </Typography>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
            {/* Tabs */}
            <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mt:1 }}>
              {TABS.map((tb,i) => (
                <Tab key={i} label={
                  <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                    <span>{tb.icon}</span>
                    <span style={{ fontSize:'0.78rem' }}>{tb.label}</span>
                  </Box>
                }/>
              ))}
            </Tabs>
          </DialogTitle>

          <DialogContent sx={{ pt:2 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

            {/* ── TAB 0: COMPANY INFO ── */}
            {tab===0 && (
              <Grid container spacing={2} sx={{ mt:0 }}>
                <Grid item xs={12} sm={6}>
                  <TextField label={`${i18n.language==='ar'?'اسم الشركة بالعربي':'Company Name (Arabic)'} *`}
                    value={form.name} onChange={set('name')} fullWidth required/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Company Name (English)" value={form.nameEn} onChange={set('nameEn')} fullWidth/>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label={i18n.language==='ar'?'نوع المورد':'Type'} value={form.type} onChange={set('type')} fullWidth select>
                    <MenuItem value="company">{i18n.language==='ar'?'شركة':'Company'}</MenuItem>
                    <MenuItem value="individual">{i18n.language==='ar'?'فرد':'Individual'}</MenuItem>
                    <MenuItem value="government">{i18n.language==='ar'?'حكومي':'Government'}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField label={i18n.language==='ar'?'الكود':'Code'} value={form.code} onChange={set('code')} fullWidth
                    helperText={i18n.language==='ar'?'يُولَّد تلقائياً إن تُرك فارغاً':'Auto-generated if empty'}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'القطاع':'Industry'} value={form.industry} onChange={set('industry')} fullWidth/>
                </Grid>

                <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">{i18n.language==='ar'?'المعلومات القانونية':'Legal Information'}</Typography></Divider></Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    label={i18n.language==='ar'?'رقم السجل التجاري (10 أرقام)':'CR Number (10 digits)'}
                    value={form.commercialReg}
                    onChange={e=>setForm(p=>({...p,commercialReg:e.target.value.replace(/[^\d]/g,'').slice(0,10)}))}
                    fullWidth inputProps={{ maxLength:10, inputMode:'numeric', dir:'ltr' }}
                    InputProps={{ startAdornment:<InputAdornment position="start">🏢</InputAdornment> }}
                    error={form.commercialReg.length>0&&form.commercialReg.length!==10}
                    helperText={form.commercialReg.length>0&&form.commercialReg.length!==10?`${form.commercialReg.length}/10`:''}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={i18n.language==='ar'?'الرقم الضريبي (15 رقم يبدأ بـ 3)':'VAT Number (15 digits, starts 3)'}
                    value={form.vatNumber}
                    onChange={e=>setForm(p=>({...p,vatNumber:e.target.value.replace(/[^\d]/g,'').slice(0,15)}))}
                    fullWidth inputProps={{ maxLength:15, inputMode:'numeric', dir:'ltr' }}
                    InputProps={{ startAdornment:<InputAdornment position="start">🧾</InputAdornment> }}
                    error={form.vatNumber.length>0&&!/^3\d{14}$/.test(form.vatNumber)}
                    helperText={form.vatNumber.length>0?`${form.vatNumber.length}/15`:''}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'رقم الهوية / الإقامة':'National/Iqama ID'} value={form.nationalId} onChange={set('nationalId')} fullWidth
                    InputProps={{ startAdornment:<InputAdornment position="start">🪪</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12}>
                  <TextField label={i18n.language==='ar'?'ملاحظات':'Notes'} value={form.notes} onChange={set('notes')} fullWidth multiline rows={2}/>
                </Grid>
              </Grid>
            )}

            {/* ── TAB 1: CONTACT & ADDRESS ── */}
            {tab===1 && (
              <Grid container spacing={2} sx={{ mt:0 }}>
                <Grid item xs={12} sm={6}>
                  <TextField label={tx.contactPerson} value={form.contactPerson} onChange={set('contactPerson')} fullWidth
                    InputProps={{ startAdornment:<InputAdornment position="start"><VerifiedUser sx={{ fontSize:18 }}/></InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={i18n.language==='ar'?'المسمى الوظيفي':'Job Title'} value={form.contactTitle} onChange={set('contactTitle')} fullWidth/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={tx.email} type="email" value={form.email} onChange={set('email')} fullWidth
                    InputProps={{ startAdornment:<InputAdornment position="start"><Email sx={{ fontSize:18 }}/></InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={tx.phone} value={form.phone} onChange={set('phone')} fullWidth
                    InputProps={{ startAdornment:<InputAdornment position="start"><Phone sx={{ fontSize:18 }}/></InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={i18n.language==='ar'?'هاتف ثانٍ':'Phone 2'} value={form.phone2} onChange={set('phone2')} fullWidth/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={i18n.language==='ar'?'الموقع الإلكتروني':'Website'} value={form.website} onChange={set('website')} fullWidth/>
                </Grid>

                <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary"><LocationOn sx={{ fontSize:14, mr:0.5 }} />{i18n.language==='ar'?'العنوان':'Address'}</Typography></Divider></Grid>

                <Grid item xs={12}>
                  <TextField label={i18n.language==='ar'?'العنوان التفصيلي':'Street Address'} value={form.address} onChange={set('address')} fullWidth/>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label={i18n.language==='ar'?'الحي':'District'} value={form.district} onChange={set('district')} fullWidth/>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label={i18n.language==='ar'?'المدينة':'City'} value={form.city} onChange={set('city')} fullWidth/>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label={i18n.language==='ar'?'الدولة':'Country'} value={form.country} onChange={set('country')} fullWidth select>
                    {COUNTRIES.map(c => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField label={i18n.language==='ar'?'الرمز البريدي':'Zip Code'} value={form.zipCode} onChange={set('zipCode')} fullWidth/>
                </Grid>
              </Grid>
            )}

            {/* ── TAB 2: FINANCIALS ── */}
            {tab===2 && (
              <Grid container spacing={2} sx={{ mt:0 }}>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'العملة':'Currency'} value={form.currency} onChange={set('currency')} fullWidth select>
                    {['SAR','USD','EUR','GBP','AED','KWD','QAR','BHD','OMR','EGP','TRY','CNY','INR'].map(c =>
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    )}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={`${i18n.language==='ar'?'شروط الدفع':'Payment Terms'} (${i18n.language==='ar'?'يوم':'days'})`}
                    value={form.paymentTerms} onChange={set('paymentTerms')} fullWidth select>
                    {PAYMENT_TERMS.map(d => <MenuItem key={d} value={d}>{d} {i18n.language==='ar'?'يوم':'days'}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'حد الائتمان':'Credit Limit'} type="number"
                    value={form.creditLimit} onChange={set('creditLimit')} fullWidth
                    InputProps={{ startAdornment:<InputAdornment position="start">{form.currency||'SAR'}</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'نسبة الخصم %':'Discount %'} type="number"
                    value={form.discountPct} onChange={set('discountPct')} fullWidth
                    inputProps={{ min:0, max:100, step:0.5 }}
                    InputProps={{ endAdornment:<InputAdornment position="end">%</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'التصنيف':'Category'} value={form.category} onChange={set('category')} fullWidth/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label={i18n.language==='ar'?'التقييم (1-5)':'Rating (1-5)'} type="number"
                    value={form.rating} onChange={set('rating')} fullWidth
                    inputProps={{ min:1, max:5, step:1 }}/>
                </Grid>
              </Grid>
            )}

            {/* ── TAB 3: BANK INFO ── */}
            {tab===3 && (
              <Grid container spacing={2} sx={{ mt:0 }}>
                <Grid item xs={12} sm={6}>
                  <TextField label={i18n.language==='ar'?'اسم البنك':'Bank Name'} value={form.bankName} onChange={set('bankName')} fullWidth select>
                    {SAUDI_BANKS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={i18n.language==='ar'?'فرع البنك':'Branch'} value={form.bankBranch} onChange={set('bankBranch')} fullWidth/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label={i18n.language==='ar'?'رقم الحساب':'Account Number'} value={form.bankAccount} onChange={set('bankAccount')} fullWidth
                    InputProps={{ startAdornment:<InputAdornment position="start"><AccountBalance sx={{ fontSize:18 }}/></InputAdornment> }}
                    inputProps={{ dir:'ltr' }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={i18n.language==='ar'?'رقم الآيبان (SA + 22 رقم)':'IBAN (SA + 22 digits)'}
                    value={form.bankIBAN}
                    onChange={e=>setForm(p=>({...p,bankIBAN:e.target.value.toUpperCase().replace(/\s/g,'').slice(0,24)}))}
                    fullWidth
                    inputProps={{ maxLength:24, dir:'ltr', style:{fontFamily:'monospace',letterSpacing:2} }}
                    helperText={form.bankIBAN?`${form.bankIBAN.length}/24`:'SA + 22 رقم'}
                    error={form.bankIBAN.length>0&&!/^SA\d{22}$/i.test(form.bankIBAN)}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="SWIFT Code" value={form.bankSwift} onChange={set('bankSwift')} fullWidth
                    inputProps={{ dir:'ltr', style:{fontFamily:'monospace'} }}/>
                </Grid>
                {form.bankIBAN && /^SA\d{22}$/i.test(form.bankIBAN) && (
                  <Grid item xs={12}>
                    <Alert severity="success" sx={{ borderRadius:2 }}>
                      ✓ {i18n.language==='ar'?'رقم الآيبان صحيح':'IBAN is valid'}: {form.bankIBAN}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Box sx={{ display:'flex', gap:1, mr:'auto' }}>
              {tab>0 && <Button onClick={()=>setTab(t=>t-1)} variant="outlined" size="small">← {t('common.previous')||'Previous'}</Button>}
              {tab<3 && <Button onClick={()=>setTab(t=>t+1)} variant="outlined" size="small">{t('common.next')||'Next'} →</Button>}
            </Box>
            <Button onClick={close}>{tx.cancel}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'} }}>
              {tx.save}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')}
          anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default SuppliersPage;
