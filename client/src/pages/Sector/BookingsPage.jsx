import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Tooltip, Card, CardContent, Avatar
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, CalendarMonth, Close, Save, Hotel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor } from '../../utils/sectorNav';

const STATUS_CONFIG = [
  { value:'confirmed', ar:'مؤكد',   en:'Confirmed',  color:'#34a853' },
  { value:'pending',   ar:'معلق',   en:'Pending',    color:'#f57c00' },
  { value:'checkedin', ar:'تسجيل دخول', en:'Checked In', color:'#1a73e8' },
  { value:'checkedout',ar:'تسجيل خروج', en:'Checked Out', color:'#546e7a' },
  { value:'cancelled', ar:'ملغى',   en:'Cancelled',  color:'#e53935' },
  { value:'noshow',    ar:'لم يحضر', en:'No Show',   color:'#7b1fa2' },
];
const PAYMENT_STATUS = [
  { value:'unpaid', ar:'غير مدفوع', en:'Unpaid' },
  { value:'partial',ar:'دفع جزئي',  en:'Partial' },
  { value:'paid',   ar:'مدفوع كامل',en:'Paid' },
];
const EMPTY = {
  guestName:'', guestPhone:'', guestNationalId:'', guestEmail:'',
  roomNumber:'', roomId:'',
  checkIn:'', checkOut:'', nights:1,
  totalAmount:0, paidAmount:0, discount:0,
  status:'confirmed', paymentStatus:'unpaid',
  adults:2, children:0, notes:''
};

export default function BookingsPage() {
  const { t, i18n } = useTranslation();
  const AR    = i18n.language === 'ar';
  const color = getSectorColor(localStorage.getItem('userIndustry')||'hotel');
  const industry = localStorage.getItem('userIndustry')||'hotel';
  const isHotel  = ['hotel','furnished_apartments'].includes(industry);

  const [items,  setItems]  = useState([]);
  const [rooms,  setRooms]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [dialog, setDialog] = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [snack,  setSnack]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.allSettled([
        api.get('/api/sector/bookings'),
        api.get('/api/sector/rooms'),
      ]);
      if (bRes.status==='fulfilled' && bRes.value.data.success) setItems(bRes.value.data.data||[]);
      if (rRes.status==='fulfilled' && rRes.value.data.success) setRooms(rRes.value.data.data||[]);
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd  = () => { setForm({...EMPTY,checkIn:new Date().toISOString().split('T')[0]}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (b)  => { setForm({...b,checkIn:b.checkIn?.split('T')[0]||'',checkOut:b.checkOut?.split('T')[0]||''}); setEditId(b._id); setError(''); setDialog(true); };
  const close    = ()   => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k=>e => {
    const val = e.target.value;
    setForm(p => {
      const next = {...p,[k]:val};
      // Auto-calc nights and total when dates change
      if ((k==='checkIn'||k==='checkOut') && next.checkIn && next.checkOut) {
        const d1 = new Date(next.checkIn), d2 = new Date(next.checkOut);
        const nights = Math.max(1, Math.ceil((d2-d1)/(1000*60*60*24)));
        next.nights = nights;
        // Find room price
        const room = rooms.find(r=>r._id===next.roomId||r.number===next.roomNumber);
        if (room) next.totalAmount = nights * (room.pricePerNight||0);
      }
      if (k==='roomId') {
        const room = rooms.find(r=>r._id===val);
        if (room) {
          next.roomNumber = room.number;
          if (next.nights) next.totalAmount = next.nights * (room.pricePerNight||0);
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.guestName) { setError(AR?'اسم الضيف مطلوب':'Guest name required'); return; }
    if (!form.checkIn)   { setError(AR?'تاريخ الوصول مطلوب':'Check-in date required'); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`/api/sector/bookings/${editId}`,form);
      else        await api.post('/api/sector/bookings',form);
      setSnack(t('common.success')||'تم'); close(); load();
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'تأكيد الحذف؟':'Confirm?')) return;
    try { await api.delete(`/api/sector/bookings/${id}`); setSnack(t('common.success')||'تم'); load(); }
    catch(e) { setError(e.response?.data?.message||'خطأ'); }
  };

  const filtered = items.filter(b=>{
    if (!search) return true;
    const q = search.toLowerCase();
    return b.guestName?.toLowerCase().includes(q)||b.roomNumber?.includes(q)||b.guestPhone?.includes(q);
  });

  const statusInfo = (val) => STATUS_CONFIG.find(s=>s.value===val)||STATUS_CONFIG[0];

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    total:    items.length,
    active:   items.filter(b=>b.status==='checkedin').length,
    today:    items.filter(b=>b.checkIn?.startsWith(today)).length,
    revenue:  items.reduce((s,b)=>s+(b.totalAmount||0),0),
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <CalendarMonth sx={{ fontSize:32, color }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'الحجوزات':'Bookings'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.total} {AR?'حجز':'bookings'} · {stats.active} {AR?'داخل حالياً':'checked in'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd} sx={{ bgcolor:color, borderRadius:2 }}>
              {AR?'حجز جديد':'New Booking'}
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb:3 }}>
          {[
            {label:AR?'إجمالي الحجوزات':'Total Bookings', value:stats.total, color:'#1a73e8'},
            {label:AR?'داخل حالياً':'Checked In',        value:stats.active, color:'#34a853'},
            {label:AR?'وصول اليوم':'Arrivals Today',     value:stats.today,  color:'#f57c00'},
            {label:AR?'إجمالي الإيرادات':'Total Revenue', value:(stats.revenue).toLocaleString()+' '+(AR?'ر.س':'SAR'), color:'#7b1fa2'},
          ].map((s,i)=>(
            <Grid item xs={6} sm={3} key={i}>
              <Card sx={{ borderLeft:`4px solid ${s.color}`, borderRadius:2 }}>
                <CardContent sx={{ py:1.5,'&:last-child':{pb:1.5} }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color:s.color }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" sx={{ mb:2,borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={`${t('common.search')||'Search'}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2,width:300 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18,color:'text.secondary' }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'اسم الضيف':'Guest'}</TableCell>
                {isHotel && <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الغرفة':'Room'}</TableCell>}
                <TableCell sx={{ fontWeight:700 }}>{AR?'تاريخ الوصول':'Check-In'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'تاريخ المغادرة':'Check-Out'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الليالي':'Nights'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المبلغ':'Amount'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')||'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4,color:'text.secondary' }}>{AR?'لا توجد حجوزات':'No bookings'}</TableCell></TableRow>
              ) : filtered.map(b=>{
                const st = statusInfo(b.status);
                return (
                  <TableRow key={b._id} hover>
                    <TableCell>
                      <Box sx={{ display:'flex',alignItems:'center',gap:1.2 }}>
                        <Avatar sx={{ width:32,height:32,bgcolor:`${color}20`,color,fontSize:13,fontWeight:700 }}>{b.guestName?.[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{b.guestName}</Typography>
                          {b.guestPhone && <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>{b.guestPhone}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    {isHotel && <TableCell><Chip label={b.roomNumber||'—'} size="small" sx={{ fontWeight:700,bgcolor:`${color}15`,color }}/></TableCell>}
                    <TableCell><Typography variant="body2">{b.checkIn?.split('T')[0]||'—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{b.checkOut?.split('T')[0]||'—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{b.nights||1} {AR?'ليلة':'nights'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700}>{(b.totalAmount||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography></TableCell>
                    <TableCell><Chip label={AR?st.ar:st.en} size="small" sx={{ bgcolor:`${st.color}18`,color:st.color,fontWeight:600,fontSize:'0.7rem' }}/></TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')||'Edit'}>
                        <IconButton size="small" onClick={()=>openEdit(b)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')||'Delete'}>
                        <IconButton size="small" onClick={()=>handleDelete(b._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog */}
        <Dialog open={dialog} onClose={close} maxWidth="md" fullWidth PaperProps={{ sx:{borderRadius:3} }}>
          <DialogTitle sx={{ fontWeight:700,pb:0 }}>
            <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              {editId?(AR?`✏️ تعديل الحجز`:`Edit Booking`):(AR?'+ حجز جديد':'+ New Booking')}
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2,mt:1,borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              {/* Guest info */}
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={700} color="text.secondary">👤 {AR?'معلومات الضيف':'Guest Information'}</Typography></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'اسم الضيف *':'Guest Name *'} value={form.guestName} onChange={set('guestName')} fullWidth required/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'رقم الهاتف':'Phone'} value={form.guestPhone||''} onChange={set('guestPhone')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'رقم الهوية':'National ID'} value={form.guestNationalId||''} onChange={set('guestNationalId')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'البريد الإلكتروني':'Email'} type="email" value={form.guestEmail||''} onChange={set('guestEmail')} fullWidth/></Grid>

              {/* Room + Dates */}
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt:1 }}>🏨 {AR?'تفاصيل الحجز':'Booking Details'}</Typography></Grid>
              {isHotel && rooms.length>0 && (
                <Grid item xs={12} sm={4}>
                  <TextField label={AR?'الغرفة':'Room'} value={form.roomId||''} onChange={set('roomId')} fullWidth select>
                    {rooms.filter(r=>r.status==='available'||r._id===form.roomId).map(r=>(
                      <MenuItem key={r._id} value={r._id}>
                        {AR?`غرفة ${r.number} — ${r.pricePerNight} ر.س/ليلة`:`Room ${r.number} — ${r.pricePerNight} SAR/night`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <TextField label={AR?'تاريخ الوصول *':'Check-In *'} type="date" value={form.checkIn||''} onChange={set('checkIn')} fullWidth InputLabelProps={{ shrink:true }} required/>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label={AR?'تاريخ المغادرة *':'Check-Out *'} type="date" value={form.checkOut||''} onChange={set('checkOut')} fullWidth InputLabelProps={{ shrink:true }} required/>
              </Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'بالغون':'Adults'} type="number" value={form.adults||2} onChange={set('adults')} fullWidth inputProps={{ min:1 }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'أطفال':'Children'} type="number" value={form.children||0} onChange={set('children')} fullWidth inputProps={{ min:0 }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'عدد الليالي':'Nights'} type="number" value={form.nights||1} onChange={set('nights')} fullWidth inputProps={{ min:1 }}/></Grid>

              {/* Financials */}
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mt:1 }}>💰 {AR?'المالية':'Financials'}</Typography></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الإجمالي':'Total'} type="number" value={form.totalAmount||0} onChange={set('totalAmount')} fullWidth InputProps={{ startAdornment:<InputAdornment position="start">{AR?'ر.س':'SAR'}</InputAdornment> }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'المدفوع':'Paid'} type="number" value={form.paidAmount||0} onChange={set('paidAmount')} fullWidth InputProps={{ startAdornment:<InputAdornment position="start">{AR?'ر.س':'SAR'}</InputAdornment> }}/></Grid>
              <Grid item xs={6} sm={3}>
                <TextField label={AR?'الحالة':'Status'} value={form.status||'confirmed'} onChange={set('status')} fullWidth select>
                  {STATUS_CONFIG.map(s=><MenuItem key={s.value} value={s.value}>{AR?s.ar:s.en}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label={AR?'حالة الدفع':'Payment'} value={form.paymentStatus||'unpaid'} onChange={set('paymentStatus')} fullWidth select>
                  {PAYMENT_STATUS.map(s=><MenuItem key={s.value} value={s.value}>{AR?s.ar:s.en}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField label={AR?'ملاحظات':'Notes'} value={form.notes||''} onChange={set('notes')} fullWidth multiline rows={2}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3,py:2 }}>
            <Button onClick={close}>{t('common.cancel')||'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>} sx={{ bgcolor:color }}>
              {t('common.save')||'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{ vertical:'bottom',horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
