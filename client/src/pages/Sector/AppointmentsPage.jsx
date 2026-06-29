import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, CalendarToday, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor } from '../../utils/sectorNav';

const APPT_STATUS = [
  { value:'scheduled', ar:'مجدول',   en:'Scheduled', color:'#1a73e8' },
  { value:'confirmed', ar:'مؤكد',    en:'Confirmed', color:'#34a853' },
  { value:'in_progress',ar:'قيد التنفيذ',en:'In Progress',color:'#f57c00'},
  { value:'completed', ar:'مكتمل',   en:'Completed', color:'#546e7a' },
  { value:'cancelled', ar:'ملغى',    en:'Cancelled', color:'#e53935' },
  { value:'no_show',   ar:'لم يحضر', en:'No Show',   color:'#7b1fa2' },
];

const APPT_TYPES = {
  clinic:  [{v:'checkup',ar:'كشف عام',en:'Check-up'},{v:'followup',ar:'متابعة',en:'Follow-up'},{v:'procedure',ar:'إجراء',en:'Procedure'},{v:'emergency',ar:'طارئ',en:'Emergency'}],
  dental:  [{v:'cleaning',ar:'تنظيف',en:'Cleaning'},{v:'filling',ar:'حشوة',en:'Filling'},{v:'extraction',ar:'خلع',en:'Extraction'},{v:'xray',ar:'أشعة',en:'X-Ray'},{v:'braces',ar:'تقويم',en:'Braces'}],
  salon_ladies:[{v:'haircut',ar:'قص',en:'Haircut'},{v:'color',ar:'صبغة',en:'Color'},{v:'treatment',ar:'علاج',en:'Treatment'},{v:'makeup',ar:'مكياج',en:'Makeup'},{v:'bridal',ar:'عروس',en:'Bridal'}],
  gym:     [{v:'pt',ar:'تدريب خاص',en:'Personal Training'},{v:'class',ar:'حصة جماعية',en:'Group Class'},{v:'assessment',ar:'تقييم',en:'Assessment'}],
};

const EMPTY = {
  patientName:'', patientPhone:'', patientId:'',
  doctorName:'', doctorId:'',
  date:'', time:'', duration:30,
  type:'checkup', status:'scheduled',
  fee:0, notes:''
};

export default function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry = localStorage.getItem('userIndustry')||'clinic';
  const color    = getSectorColor(industry);

  const TYPES = APPT_TYPES[industry] || APPT_TYPES.clinic;
  const labels = {
    clinic:      { patient:AR?'المريض':'Patient',   doctor:AR?'الطبيب':'Doctor',   title:AR?'المواعيد':'Appointments' },
    dental:      { patient:AR?'المريض':'Patient',   doctor:AR?'طبيب الأسنان':'Dentist', title:AR?'مواعيد الأسنان':'Dental Appointments' },
    salon_ladies:{ patient:AR?'العميلة':'Customer', doctor:AR?'الحلاقة':'Stylist', title:AR?'مواعيد الصالون':'Salon Appointments' },
    salon_gents: { patient:AR?'العميل':'Customer',  doctor:AR?'الحلاق':'Barber',   title:AR?'مواعيد الصالون':'Salon Appointments' },
    gym:         { patient:AR?'العضو':'Member',     doctor:AR?'المدرب':'Trainer',  title:AR?'الحصص والمواعيد':'Sessions' },
    spa:         { patient:AR?'العميل':'Customer',  doctor:AR?'المعالج':'Therapist',title:AR?'مواعيد السبا':'Spa Appointments' },
  };
  const lbl = labels[industry] || labels.clinic;

  const [items,   setItems]   = useState([]);
  const [patients,setPatients]= useState([]);
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [snack,   setSnack]   = useState('');
  const [filterDate, setFilterDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, pRes, sRes] = await Promise.allSettled([
        api.get('/api/sector/appointments'),
        api.get('/api/sector/patients'),
        api.get('/api/employees'),
      ]);
      if (aRes.status==='fulfilled') setItems(aRes.value.data.data||[]);
      if (pRes.status==='fulfilled') setPatients(pRes.value.data.data||[]);
      if (sRes.status==='fulfilled') setStaff(sRes.value.data.data||[]);
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd  = () => { setForm({...EMPTY,date:new Date().toISOString().split('T')[0]}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (a) => { setForm({...a,date:a.date?.split('T')[0]||''}); setEditId(a._id); setError(''); setDialog(true); };
  const close    = ()  => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k=>e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    if (!form.patientName||!form.date) { setError(AR?'الاسم والتاريخ مطلوبان':'Name and date required'); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`/api/sector/appointments/${editId}`,form);
      else        await api.post('/api/sector/appointments',form);
      setSnack(t('common.success')||'تم'); close(); load();
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'تأكيد الحذف؟':'Confirm?')) return;
    try { await api.delete(`/api/sector/appointments/${id}`); setSnack(t('common.success')||'تم'); load(); }
    catch(e) { setError(e.response?.data?.message||'خطأ'); }
  };

  const filtered = items.filter(a=>{
    const matchSearch = !search || a.patientName?.toLowerCase().includes(search.toLowerCase())||a.doctorName?.toLowerCase().includes(search.toLowerCase());
    const matchDate   = !filterDate || a.date?.startsWith(filterDate);
    return matchSearch && matchDate;
  });

  const statusInfo = (val) => APPT_STATUS.find(s=>s.value===val)||APPT_STATUS[0];
  const today      = new Date().toISOString().split('T')[0];
  const todayCount = items.filter(a=>a.date?.startsWith(today)).length;

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <CalendarToday sx={{ fontSize:32, color }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{lbl.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'موعد':'appointments'} · {todayCount} {AR?'اليوم':'today'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <TextField size="small" type="date" value={filterDate}
              onChange={e=>setFilterDate(e.target.value)}
              InputLabelProps={{ shrink:true }}
              label={AR?'تصفية بالتاريخ':'Filter Date'}
              sx={{ width:160 }}/>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd} sx={{ bgcolor:color, borderRadius:2 }}>
              {AR?'موعد جديد':'New Appointment'}
            </Button>
          </Box>
        </Box>

        {/* Quick stats */}
        <Grid container spacing={2} sx={{ mb:3 }}>
          {APPT_STATUS.slice(0,4).map(s=>(
            <Grid item xs={6} sm={3} key={s.value}>
              <Card sx={{ borderLeft:`4px solid ${s.color}`, borderRadius:2 }}>
                <CardContent sx={{ py:1.5,'&:last-child':{pb:1.5} }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color:s.color }}>
                    {items.filter(a=>a.status===s.value).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{AR?s.ar:s.en}</Typography>
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
                <TableCell sx={{ fontWeight:700 }}>{lbl.patient}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.doctor}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'التاريخ':'Date'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الوقت':'Time'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'النوع':'Type'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الرسوم':'Fee'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')||'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4,color:'text.secondary' }}>{AR?'لا توجد مواعيد':'No appointments'}</TableCell></TableRow>
              ) : filtered.map(a=>{
                const st = statusInfo(a.status);
                return (
                  <TableRow key={a._id} hover>
                    <TableCell>
                      <Box sx={{ display:'flex',alignItems:'center',gap:1 }}>
                        <Avatar sx={{ width:30,height:30,bgcolor:`${color}20`,color,fontSize:12,fontWeight:700 }}>{a.patientName?.[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{a.patientName}</Typography>
                          {a.patientPhone && <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>{a.patientPhone}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{a.doctorName||'—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{a.date?.split('T')[0]||'—'}</Typography></TableCell>
                    <TableCell><Chip label={a.time||'—'} size="small" variant="outlined" sx={{ fontSize:'0.72rem' }}/></TableCell>
                    <TableCell><Typography variant="body2">{TYPES.find(tp=>tp.v===a.type)?.(AR?'ar':'en') || a.type||'—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{a.fee?(+a.fee).toLocaleString()+' '+(AR?'ر.س':'SAR'):'—'}</Typography></TableCell>
                    <TableCell><Chip label={AR?st.ar:st.en} size="small" sx={{ bgcolor:`${st.color}18`,color:st.color,fontWeight:600,fontSize:'0.7rem' }}/></TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')||'Edit'}><IconButton size="small" onClick={()=>openEdit(a)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton></Tooltip>
                      <Tooltip title={t('common.delete')||'Delete'}><IconButton size="small" onClick={()=>handleDelete(a._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{borderRadius:3} }}>
          <DialogTitle sx={{ fontWeight:700,pb:0 }}>
            <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              {editId?(AR?'✏️ تعديل الموعد':'Edit Appointment'):(AR?'+ موعد جديد':'+ New Appointment')}
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2,mt:1,borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField label={`${lbl.patient} *`} value={form.patientName||''} onChange={set('patientName')}
                  fullWidth required select={patients.length>0}>
                  {patients.length>0
                    ? patients.map(p=><MenuItem key={p._id} value={p.name} onClick={()=>setForm(f=>({...f,patientName:p.name,patientPhone:p.phone||f.patientPhone,patientId:p._id}))}>{p.name}</MenuItem>)
                    : null}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'هاتف المريض':'Phone'} value={form.patientPhone||''} onChange={set('patientPhone')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={lbl.doctor} value={form.doctorName||''} onChange={set('doctorName')}
                  fullWidth select={staff.length>0}>
                  {staff.length>0
                    ? staff.map(s=><MenuItem key={s._id} value={s.name} onClick={()=>setForm(f=>({...f,doctorName:s.name,doctorId:s._id}))}>{s.name} {s.position?`— ${s.position}`:''}</MenuItem>)
                    : null}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'التاريخ *':'Date *'} type="date" value={form.date||''} onChange={set('date')} fullWidth required InputLabelProps={{ shrink:true }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الوقت':'Time'} type="time" value={form.time||''} onChange={set('time')} fullWidth InputLabelProps={{ shrink:true }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'المدة (دقيقة)':'Duration (min)'} type="number" value={form.duration||30} onChange={set('duration')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'نوع الموعد':'Type'} value={form.type||'checkup'} onChange={set('type')} fullWidth select>{TYPES.map(tp=><MenuItem key={tp.v} value={tp.v}>{AR?tp.ar:tp.en}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الحالة':'Status'} value={form.status||'scheduled'} onChange={set('status')} fullWidth select>{APPT_STATUS.map(s=><MenuItem key={s.value} value={s.value}>{AR?s.ar:s.en}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الرسوم (ر.س)':'Fee (SAR)'} type="number" value={form.fee||0} onChange={set('fee')} fullWidth InputProps={{ startAdornment:<InputAdornment position="start">💰</InputAdornment> }}/></Grid>
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
