import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Divider
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, School, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor } from '../../utils/sectorNav';

const STUDY_LEVELS = {
  school: [
    {v:'grade1',ar:'الصف الأول',en:'Grade 1'},{v:'grade2',ar:'الصف الثاني',en:'Grade 2'},
    {v:'grade3',ar:'الصف الثالث',en:'Grade 3'},{v:'grade4',ar:'الصف الرابع',en:'Grade 4'},
    {v:'grade5',ar:'الصف الخامس',en:'Grade 5'},{v:'grade6',ar:'الصف السادس',en:'Grade 6'},
    {v:'grade7',ar:'الصف السابع',en:'Grade 7'},{v:'grade8',ar:'الصف الثامن',en:'Grade 8'},
    {v:'grade9',ar:'الصف التاسع',en:'Grade 9'},{v:'grade10',ar:'الصف العاشر',en:'Grade 10'},
    {v:'grade11',ar:'الصف الحادي عشر',en:'Grade 11'},{v:'grade12',ar:'الصف الثاني عشر',en:'Grade 12'},
  ],
  university: [
    {v:'year1',ar:'السنة الأولى',en:'Year 1'},{v:'year2',ar:'السنة الثانية',en:'Year 2'},
    {v:'year3',ar:'السنة الثالثة',en:'Year 3'},{v:'year4',ar:'السنة الرابعة',en:'Year 4'},
    {v:'year5',ar:'السنة الخامسة',en:'Year 5'},{v:'masters',ar:'ماجستير',en:'Masters'},
    {v:'phd',ar:'دكتوراه',en:'PhD'},
  ],
  kindergarten: [
    {v:'nursery',ar:'الحضانة',en:'Nursery'},{v:'kg1',ar:'روضة 1',en:'KG 1'},{v:'kg2',ar:'روضة 2',en:'KG 2'},
  ],
};

const STUDENT_STATUS = [
  { value:'active',    ar:'نشط',     en:'Active',    color:'#34a853' },
  { value:'inactive',  ar:'غير نشط', en:'Inactive',  color:'#546e7a' },
  { value:'graduated', ar:'متخرج',   en:'Graduated', color:'#1a73e8' },
  { value:'suspended', ar:'موقوف',   en:'Suspended', color:'#e53935' },
  { value:'transferred',ar:'محوّل',  en:'Transferred',color:'#f57c00'},
];

const EMPTY = {
  name:'', nameEn:'', studentId:'',
  gender:'male', dob:'', nationality:'',
  nationalId:'', phone:'', email:'',
  level:'', classroom:'', section:'', 
  guardianName:'', guardianPhone:'', guardianRelation:'',
  enrollDate:'', tuitionFee:0,
  status:'active', notes:''
};

export default function StudentsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry = localStorage.getItem('userIndustry')||'school';
  const color    = getSectorColor(industry);

  const LEVELS = STUDY_LEVELS[industry] || STUDY_LEVELS.school;
  const lbl = {
    school:       { title:AR?'الطلاب':'Students',  single:AR?'طالب':'Student',    new:AR?'طالب جديد':'New Student' },
    university:   { title:AR?'الطلاب':'Students',  single:AR?'طالب':'Student',    new:AR?'طالب جديد':'New Student' },
    kindergarten: { title:AR?'الأطفال':'Children', single:AR?'طفل':'Child',       new:AR?'طفل جديد':'New Child' },
    training_center:{ title:AR?'المتدربون':'Trainees',single:AR?'متدرب':'Trainee',new:AR?'متدرب جديد':'New Trainee'},
  };
  const L = lbl[industry] || lbl.school;

  const [items,  setItems]  = useState([]);
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
      const r = await api.get('/api/sector/students');
      if (r.data.success) setItems(r.data.data||[]);
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd  = () => { setForm({...EMPTY,enrollDate:new Date().toISOString().split('T')[0]}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (s) => { setForm({...s,dob:s.dob?.split('T')[0]||'',enrollDate:s.enrollDate?.split('T')[0]||''}); setEditId(s._id); setError(''); setDialog(true); };
  const close    = ()  => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k=>e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    if (!form.name.trim()) { setError(AR?'الاسم مطلوب':'Name required'); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`/api/sector/students/${editId}`,form);
      else        await api.post('/api/sector/students',form);
      setSnack(t('common.success')||'تم'); close(); load();
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'تأكيد الحذف؟':'Confirm?')) return;
    try { await api.delete(`/api/sector/students/${id}`); setSnack(t('common.success')||'تم'); load(); }
    catch(e) { setError(e.response?.data?.message||'خطأ'); }
  };

  const filtered = items.filter(s=>{
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q)||s.studentId?.toLowerCase().includes(q)||s.classroom?.toLowerCase().includes(q);
  });

  const statusInfo = (val) => STUDENT_STATUS.find(s=>s.value===val)||STUDENT_STATUS[0];
  const calcAge = (dob) => { if (!dob) return '—'; return Math.floor((Date.now()-new Date(dob))/(1000*60*60*24*365))+''; };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <School sx={{ fontSize:32, color }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{L.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} · {items.filter(s=>s.status==='active').length} {AR?'نشط':'active'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd} sx={{ bgcolor:color, borderRadius:2 }}>
              {L.new}
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
                <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الطالب':'ID'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الفصل/المرحلة':'Class/Level'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'ولي الأمر':'Guardian'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الرسوم':'Tuition'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')||'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4,color:'text.secondary' }}>{AR?'لا يوجد سجلات':'No records'}</TableCell></TableRow>
              ) : filtered.map(s=>{
                const st = statusInfo(s.status);
                return (
                  <TableRow key={s._id} hover>
                    <TableCell>
                      <Box sx={{ display:'flex',alignItems:'center',gap:1.2 }}>
                        <Avatar sx={{ width:34,height:34,bgcolor:`${color}20`,color,fontSize:13,fontWeight:700 }}>{s.name?.[0]}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.gender==='male'?(AR?'ذكر':'M'):(AR?'أنثى':'F')} · {calcAge(s.dob)} {AR?'سنة':'yrs'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontFamily:'monospace' }}>{s.studentId||'—'}</Typography></TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{LEVELS.find(l=>l.v===s.level)?.(AR?'ar':'en') || s.level || '—'}</Typography>
                        {s.section&&<Chip label={s.section} size="small" sx={{ fontSize:'0.65rem',height:16,mt:0.3 }}/>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.guardianName||'—'}</Typography>
                      {s.guardianPhone&&<Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>{s.guardianPhone}</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{s.tuitionFee?(+s.tuitionFee).toLocaleString()+' '+(AR?'ر.س':'SAR'):'—'}</Typography></TableCell>
                    <TableCell><Chip label={AR?st.ar:st.en} size="small" sx={{ bgcolor:`${st.color}18`,color:st.color,fontWeight:600,fontSize:'0.7rem' }}/></TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')||'Edit'}><IconButton size="small" onClick={()=>openEdit(s)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton></Tooltip>
                      <Tooltip title={t('common.delete')||'Delete'}><IconButton size="small" onClick={()=>handleDelete(s._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialog} onClose={close} maxWidth="md" fullWidth PaperProps={{ sx:{borderRadius:3} }}>
          <DialogTitle sx={{ fontWeight:700,pb:0 }}>
            <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              {editId?`✏️ ${form.name}`:L.new}
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2,mt:1,borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              <Grid item xs={12}><Typography variant="subtitle2" fontWeight={700} color="text.secondary">👤 {AR?'البيانات الشخصية':'Personal Data'}</Typography></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الاسم الكامل *':'Full Name *'} value={form.name} onChange={set('name')} fullWidth required/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الاسم بالإنجليزي':'Name (English)'} value={form.nameEn||''} onChange={set('nameEn')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الجنس':'Gender'} value={form.gender||'male'} onChange={set('gender')} fullWidth select><MenuItem value="male">{AR?'ذكر':'Male'}</MenuItem><MenuItem value="female">{AR?'أنثى':'Female'}</MenuItem></TextField></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'تاريخ الميلاد':'DOB'} type="date" value={form.dob||''} onChange={set('dob')} fullWidth InputLabelProps={{ shrink:true }}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'رقم الهوية':'National ID'} value={form.nationalId||''} onChange={set('nationalId')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الجنسية':'Nationality'} value={form.nationality||''} onChange={set('nationality')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'هاتف':'Phone'} value={form.phone||''} onChange={set('phone')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'البريد الإلكتروني':'Email'} value={form.email||''} onChange={set('email')} fullWidth/></Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">🎓 {AR?'المعلومات الأكاديمية':'Academic Information'}</Typography></Divider></Grid>
              <Grid item xs={6} sm={4}><TextField label={AR?'المرحلة / السنة':'Level / Year'} value={form.level||''} onChange={set('level')} fullWidth select>{LEVELS.map(l=><MenuItem key={l.v} value={l.v}>{AR?l.ar:l.en}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} sm={4}><TextField label={AR?'الفصل/الشعبة':'Class/Section'} value={form.section||''} onChange={set('section')} fullWidth/></Grid>
              <Grid item xs={6} sm={4}><TextField label={AR?'تاريخ التسجيل':'Enroll Date'} type="date" value={form.enrollDate||''} onChange={set('enrollDate')} fullWidth InputLabelProps={{ shrink:true }}/></Grid>
              <Grid item xs={6} sm={4}><TextField label={AR?'الرسوم الدراسية (ر.س)':'Tuition Fee'} type="number" value={form.tuitionFee||0} onChange={set('tuitionFee')} fullWidth/></Grid>
              <Grid item xs={6} sm={4}><TextField label={AR?'الحالة':'Status'} value={form.status||'active'} onChange={set('status')} fullWidth select>{STUDENT_STATUS.map(s=><MenuItem key={s.value} value={s.value}>{AR?s.ar:s.en}</MenuItem>)}</TextField></Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">👨‍👩‍👦 {AR?'ولي الأمر':'Guardian'}</Typography></Divider></Grid>
              <Grid item xs={12} sm={4}><TextField label={AR?'اسم ولي الأمر':'Guardian Name'} value={form.guardianName||''} onChange={set('guardianName')} fullWidth/></Grid>
              <Grid item xs={12} sm={4}><TextField label={AR?'هاتف ولي الأمر':'Guardian Phone'} value={form.guardianPhone||''} onChange={set('guardianPhone')} fullWidth/></Grid>
              <Grid item xs={12} sm={4}><TextField label={AR?'صلة القرابة':'Relation'} value={form.guardianRelation||''} onChange={set('guardianRelation')} fullWidth/></Grid>
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
