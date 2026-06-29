import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, CircularProgress, Snackbar,
  Alert, TextField, InputAdornment, Tooltip, Avatar, MenuItem, Divider
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, People, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const EMPTY = { name:'', nameEn:'', type:'individual', phone:'', email:'', address:'', city:'الرياض', country:'SA', commercialReg:'', vatNumber:'', paymentTerms:30, creditLimit:0, notes:'' };
const TYPES = [{value:'individual',labelAr:'فرد',label:'Individual'},{value:'company',labelAr:'شركة',label:'Company'},{value:'government',labelAr:'جهة حكومية',label:'Government'}];

export default function CustomersPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [snack,   setSnack]   = useState('');
  const [delId,   setDelId]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      if (r.data.success) setItems(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [search, t]);

  useEffect(() => { load(); }, [load]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setError(''); setDialog(true); };
  const openEdit = c  => { setForm({ ...EMPTY, ...c }); setEditId(c._id); setError(''); setDialog(true); };
  const close    = () => { setDialog(false); setError(''); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError(AR ? 'الاسم مطلوب' : 'Name is required'); return; }
    setSaving(true); setError('');
    try {
      if (editId) await api.put(`/api/customers/${editId}`, form);
      else        await api.post('/api/customers', form);
      setSnack(t('common.success') || (AR ? 'تم الحفظ' : 'Saved'));
      close(); load();
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.detail || t('common.error'));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/customers/${delId}`);
      setSnack(AR ? 'تم الأرشفة' : 'Archived'); setDelId(null); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  const fmt = n => (+n||0).toLocaleString();
  const CUR = AR ? 'ر.س' : 'SAR';

  const filtered = items.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
           c.phone?.includes(q) || c.commercialReg?.includes(q) || c.vatNumber?.includes(q) || c.code?.includes(q);
  });

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <People sx={{ fontSize:32, color:'#00897b' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR ? 'العملاء' : 'Customers'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR ? 'عميل' : 'customers'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:'#00897b', '&:hover':{bgcolor:'#00695c'}, borderRadius:2 }}>
              {AR ? '+ عميل جديد' : '+ New Customer'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small"
          placeholder={AR ? 'بحث بالاسم أو الهاتف أو السجل التجاري أو الرقم الضريبي...' : 'Search by name, phone, CR or VAT...'}
          value={search} onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:420 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الكود':'Code'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'العميل':'Customer'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'النوع':'Type'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الهاتف':'Phone'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'السجل التجاري':'CR No.'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الرقم الضريبي':'VAT'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الرصيد':'Balance'}</TableCell>
                <TableCell align="center" sx={{ fontWeight:700 }}>—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:5 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:5, color:'text.secondary' }}>
                  {AR ? 'لا يوجد عملاء' : 'No customers found'}
                </TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c._id} hover>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace', color:'#00897b', fontWeight:700 }}>{c.code||'—'}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Avatar sx={{ width:30, height:30, bgcolor:'#00897b18', color:'#00897b', fontSize:12, fontWeight:700 }}>{c.name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                        {c.email && <Typography variant="caption" color="text.secondary">{c.email}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={AR ? (TYPES.find(t=>t.value===c.type)?.labelAr||c.type) : c.type} sx={{ fontSize:'0.7rem' }}/>
                  </TableCell>
                  <TableCell><Typography variant="body2">{c.phone||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{c.commercialReg||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{c.vatNumber||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600} color={c.balance>0?'error.main':'text.primary'}>{fmt(c.balance||0)} {CUR}</Typography></TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={()=>openEdit(c)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" onClick={()=>setDelId(c._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ADD/EDIT DIALOG */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <People sx={{ color:'#00897b' }}/>
                {editId ? (AR?'تعديل عميل':'Edit Customer') : (AR?'+ عميل جديد':'+ New Customer')}
              </Box>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt:3 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={`${AR?'الاسم':'Name'} *`} value={form.name} onChange={set('name')} required/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Name (EN)" value={form.nameEn||''} onChange={set('nameEn')}/>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label={AR?'النوع':'Type'} value={form.type} onChange={set('type')} select>
                  {TYPES.map(t=><MenuItem key={t.value} value={t.value}>{AR?t.labelAr:t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label={AR?'الهاتف':'Phone'} value={form.phone||''} onChange={set('phone')}/>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Email" type="email" value={form.email||''} onChange={set('email')}/>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label={AR?'المدينة':'City'} value={form.city||''} onChange={set('city')}/>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label={AR?'العنوان':'Address'} value={form.address||''} onChange={set('address')}/>
              </Grid>
              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">{AR?'المعلومات القانونية':'Legal'}</Typography></Divider></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'رقم السجل التجاري':'CR Number'} value={form.commercialReg||''} onChange={set('commercialReg')} inputProps={{ dir:'ltr' }} InputProps={{ startAdornment:<InputAdornment position="start">🏢</InputAdornment> }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'الرقم الضريبي':'VAT Number'} value={form.vatNumber||''} onChange={set('vatNumber')} inputProps={{ dir:'ltr' }} InputProps={{ startAdornment:<InputAdornment position="start">🧾</InputAdornment> }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'شروط الدفع (يوم)':'Payment Terms (days)'} type="number" value={form.paymentTerms||30} onChange={set('paymentTerms')} InputProps={{ endAdornment:<InputAdornment position="end">{AR?'يوم':'day'}</InputAdornment> }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'حد الائتمان (ر.س)':'Credit Limit'} type="number" value={form.creditLimit||0} onChange={set('creditLimit')} InputProps={{ endAdornment:<InputAdornment position="end">{CUR}</InputAdornment> }}/>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label={AR?'ملاحظات':'Notes'} value={form.notes||''} onChange={set('notes')} multiline rows={2}/>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Button onClick={close}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:'#00897b', '&:hover':{bgcolor:'#00695c'} }}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* DELETE CONFIRM */}
        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {AR?'أرشفة العميل':'Archive Customer'}</DialogTitle>
          <DialogContent><Typography>{AR?'سيتم أرشفة العميل وليس حذفه نهائياً.':'Customer will be archived, not permanently deleted.'}</Typography></DialogContent>
          <DialogActions>
            <Button onClick={()=>setDelId(null)}>{t('common.cancel')}</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>{AR?'أرشفة':'Archive'}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
