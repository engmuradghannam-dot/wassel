import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Divider
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, HealthAndSafety, Close, Save, MedicalServices } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor, getSectorGroup } from '../../utils/sectorNav';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GENDERS = [
  { value:'male',   ar:'ذكر',  en:'Male'  },
  { value:'female', ar:'أنثى', en:'Female'},
];

const EMPTY = {
  name:'', nameEn:'', dob:'', gender:'male', phone:'', phone2:'',
  email:'', nationalId:'', nationality:'',
  address:'', city:'', bloodType:'',
  allergies:'', chronicDiseases:'', currentMedications:'',
  emergencyName:'', emergencyPhone:'', emergencyRelation:'',
  notes:'', isActive:true
};

export default function PatientsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry = localStorage.getItem('userIndustry')||'clinic';
  const color    = getSectorColor(industry);
  const group    = getSectorGroup(industry);

  // Labels based on industry
  const LBL = {
    clinic:      { single:AR?'مريض':'Patient',  plural:AR?'المرضى':'Patients',      new:AR?'مريض جديد':'New Patient' },
    gym:         { single:AR?'عضو':'Member',     plural:AR?'الأعضاء':'Members',       new:AR?'عضو جديد':'New Member' },
    salon_ladies:{ single:AR?'عميل':'Customer', plural:AR?'العملاء':'Customers',     new:AR?'عميل جديد':'New Customer' },
    real_estate: { single:AR?'مستأجر':'Tenant', plural:AR?'المستأجرون':'Tenants',    new:AR?'مستأجر جديد':'New Tenant' },
    education:   { single:AR?'طالب':'Student',  plural:AR?'الطلاب':'Students',       new:AR?'طالب جديد':'New Student' },
  };
  const lbl = LBL[industry] || LBL.clinic;

  const [items,  setItems]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [dialog, setDialog] = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [snack,  setSnack]  = useState('');
  const [tab,    setTab]    = useState(0);

  const endpoint = '/api/sector/patients';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(endpoint);
      if (r.data.success) setItems(r.data.data||[]);
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd  = () => { setForm({...EMPTY}); setEditId(null); setError(''); setTab(0); setDialog(true); };
  const openEdit = (p)  => { setForm({...p,dob:p.dob?.split('T')[0]||''}); setEditId(p._id); setError(''); setTab(0); setDialog(true); };
  const close    = ()   => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k=>e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    if (!form.name.trim()) { setError(AR?'الاسم مطلوب':'Name required'); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`${endpoint}/${editId}`,form);
      else        await api.post(endpoint,form);
      setSnack(t('common.success')||'تم'); close(); load();
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'تأكيد الحذف؟':'Confirm?')) return;
    try { await api.delete(`${endpoint}/${id}`); setSnack(t('common.success')||'تم'); load(); }
    catch(e) { setError(e.response?.data?.message||'خطأ'); }
  };

  const filtered = items.filter(p=>{
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q)||p.phone?.includes(q)||p.nationalId?.includes(q);
  });

  const calcAge = (dob) => {
    if (!dob) return '—';
    const diff = Date.now()-new Date(dob).getTime();
    return Math.floor(diff/31536000000)+' '+(AR?'سنة':'yrs');
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <HealthAndSafety sx={{ fontSize:32, color }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{lbl.plural}</Typography>
              <Typography variant="caption" color="text.secondary">{items.length} · {items.filter(p=>p.isActive!==false).length} {AR?'نشط':'active'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd} sx={{ bgcolor:color, borderRadius:2 }}>
              {lbl.new}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2,borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={`${t('common.search')||'Search'}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2,width:320 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18,color:'text.secondary' }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الاسم':'Name'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الهوية':'ID'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الهاتف':'Phone'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'العمر':'Age'}</TableCell>
                {group==='health' && <TableCell sx={{ fontWeight:700 }}>{AR?'فصيلة الدم':'Blood'}</TableCell>}
                {group==='health' && <TableCell sx={{ fontWeight:700 }}>{AR?'أمراض مزمنة':'Chronic'}</TableCell>}
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')||'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4,color:'text.secondary' }}>{AR?'لا توجد سجلات':'No records'}</TableCell></TableRow>
              ) : filtered.map(p=>(
                <TableRow key={p._id} hover>
                  <TableCell>
                    <Box sx={{ display:'flex',alignItems:'center',gap:1.2 }}>
                      <Avatar sx={{ width:34,height:34,bgcolor:`${color}20`,color,fontSize:13,fontWeight:700 }}>{p.name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        {p.gender && <Typography variant="caption" color="text.secondary">{p.gender==='male'?(AR?'ذكر':'Male'):(AR?'أنثى':'Female')}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily:'monospace' }}>{p.nationalId||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily:'monospace' }}>{p.phone||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{calcAge(p.dob)}</Typography></TableCell>
                  {group==='health' && <TableCell><Chip label={p.bloodType||'—'} size="small" sx={{ bgcolor:'#e53935',color:'white',fontWeight:700 }}/></TableCell>}
                  {group==='health' && <TableCell><Typography variant="caption" color="error.main">{p.chronicDiseases||'—'}</Typography></TableCell>}
                  <TableCell align="center">
                    <Tooltip title={t('common.edit')||'Edit'}><IconButton size="small" onClick={()=>openEdit(p)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton></Tooltip>
                    <Tooltip title={t('common.delete')||'Delete'}><IconButton size="small" onClick={()=>handleDelete(p._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog with tabs */}
        <Dialog open={dialog} onClose={close} maxWidth="md" fullWidth PaperProps={{ sx:{borderRadius:3} }}>
          <DialogTitle sx={{ fontWeight:700,pb:0 }}>
            <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              {editId?`✏️ ${form.name}`:lbl.new}
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2,mt:1,borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={700} color="text.secondary">👤 {AR?'المعلومات الشخصية':'Personal Information'}</Typography></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الاسم الكامل *':'Full Name *'} value={form.name} onChange={set('name')} fullWidth required/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الاسم بالإنجليزي':'Name (English)'} value={form.nameEn||''} onChange={set('nameEn')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الجنس':'Gender'} value={form.gender||'male'} onChange={set('gender')} fullWidth select>{GENDERS.map(g=><MenuItem key={g.value} value={g.value}>{AR?g.ar:g.en}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'تاريخ الميلاد':'Date of Birth'} type="date" value={form.dob||''} onChange={set('dob')} fullWidth InputLabelProps={{ shrink:true }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'رقم الهوية':'National ID'} value={form.nationalId||''} onChange={set('nationalId')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الجنسية':'Nationality'} value={form.nationality||''} onChange={set('nationality')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الهاتف':'Phone'} value={form.phone||''} onChange={set('phone')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'البريد الإلكتروني':'Email'} type="email" value={form.email||''} onChange={set('email')} fullWidth/></Grid>
              <Grid item xs={12}><TextField label={AR?'العنوان':'Address'} value={form.address||''} onChange={set('address')} fullWidth/></Grid>

              {group==='health' && <>
                <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">🏥 {AR?'المعلومات الطبية':'Medical Information'}</Typography></Divider></Grid>
                <Grid item xs={6} sm={3}><TextField label={AR?'فصيلة الدم':'Blood Type'} value={form.bloodType||''} onChange={set('bloodType')} fullWidth select>{BLOOD_TYPES.map(b=><MenuItem key={b} value={b}>{b}</MenuItem>)}</TextField></Grid>
                <Grid item xs={12} sm={9}><TextField label={AR?'الحساسية':'Allergies'} value={form.allergies||''} onChange={set('allergies')} fullWidth/></Grid>
                <Grid item xs={12} sm={6}><TextField label={AR?'أمراض مزمنة':'Chronic Diseases'} value={form.chronicDiseases||''} onChange={set('chronicDiseases')} fullWidth multiline rows={2}/></Grid>
                <Grid item xs={12} sm={6}><TextField label={AR?'الأدوية الحالية':'Current Medications'} value={form.currentMedications||''} onChange={set('currentMedications')} fullWidth multiline rows={2}/></Grid>
                <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">🆘 {AR?'جهة الطوارئ':'Emergency Contact'}</Typography></Divider></Grid>
                <Grid item xs={12} sm={4}><TextField label={AR?'اسم جهة الطوارئ':'Emergency Name'} value={form.emergencyName||''} onChange={set('emergencyName')} fullWidth/></Grid>
                <Grid item xs={12} sm={4}><TextField label={AR?'هاتف الطوارئ':'Emergency Phone'} value={form.emergencyPhone||''} onChange={set('emergencyPhone')} fullWidth/></Grid>
                <Grid item xs={12} sm={4}><TextField label={AR?'العلاقة':'Relation'} value={form.emergencyRelation||''} onChange={set('emergencyRelation')} fullWidth/></Grid>
              </>}

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
