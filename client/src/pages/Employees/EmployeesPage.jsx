import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, Avatar, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, People } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const EMPTY = {
  name:'', nameEn:'', email:'', phone:'', nationalId:'',
  position:'', department:'', salary:'', hireDate:'',
  nationality:'', gender:'male', status:'active',
  iqama:'', iqamaExpiry:'', notes:''
};

const EmployeesPage = () => {
  const { t, i18n } = useTranslation();
  const L  = i18n.language;
  const AR = L === 'ar';

  const [items,  setItems]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [dialog, setDialog] = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [snack,  setSnack]  = useState('');
  const [delId,  setDelId]  = useState(null);

  // ── i18n labels ──────────────────────────────────────────────
  const lbl = {
    title:      t('employees.title')       || (AR?'الموظفون':'Employees'),
    newEmp:     t('employees.newEmployee') || (AR?'موظف جديد':'New Employee'),
    id:         t('employees.employeeId')  || (AR?'رقم الموظف':'Employee ID'),
    position:   t('employees.position')   || (AR?'المسمى الوظيفي':'Position'),
    department: t('employees.department') || (AR?'القسم':'Department'),
    salary:     t('employees.salary')     || (AR?'الراتب':'Salary'),
    hireDate:   t('employees.hireDate')   || (AR?'تاريخ التوظيف':'Hire Date'),
    nationality:t('employees.nationality')|| (AR?'الجنسية':'Nationality'),
    active:     t('common.active')         || (AR?'نشط':'Active'),
    inactive:   t('common.inactive')       || (AR?'غير نشط':'Inactive'),
    terminated: t('employees.terminated') || (AR?'منهي العقد':'Terminated'),
    status:     t('common.status')         || (AR?'الحالة':'Status'),
    actions:    t('common.actions')        || (AR?'إجراءات':'Actions'),
    search:     t('common.search')         || (AR?'بحث':'Search'),
    save:       t('common.save')           || (AR?'حفظ':'Save'),
    cancel:     t('common.cancel')         || (AR?'إلغاء':'Cancel'),
    edit:       t('common.edit')           || (AR?'تعديل':'Edit'),
    delete:     t('common.delete')         || (AR?'حذف':'Delete'),
    noData:     t('common.noData')         || (AR?'لا توجد بيانات':'No data'),
    currency:   t('common.currency')       || (AR?'ر.س':'SAR'),
    male:       AR?'ذكر':'Male',
    female:     AR?'أنثى':'Female',
    nameAr:     AR?'الاسم بالعربي':'Name (Arabic)',
    nameEn:     AR?'الاسم بالإنجليزي':'Name (English)',
    natId:      AR?'رقم الهوية / الإقامة':'National/Iqama ID',
    iqama:      t('employees.iqama')       || (AR?'رقم الإقامة':'Iqama'),
    iqamaExp:   AR?'انتهاء الإقامة':'Iqama Expiry',
    phone:      t('common.phone')          || (AR?'الهاتف':'Phone'),
    email:      t('common.email')          || (AR?'البريد':'Email'),
    notes:      t('common.notes')          || (AR?'ملاحظات':'Notes'),
    gender:     AR?'الجنس':'Gender',
    saudiNat:   AR?'سعودي':'Saudi',
  };

  const statusLabel = (s) => ({ active:lbl.active, inactive:lbl.inactive, terminated:lbl.terminated })[s] || s;
  const statusColor = (s) => ({ active:'success', inactive:'default', terminated:'error' })[s] || 'default';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/employees');
      if (r.data.success) setItems(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({...EMPTY, nationality:AR?'سعودي':'Saudi'}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (e) => { setForm({...e}); setEditId(e._id); setError(''); setDialog(true); };
  const close    = () => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k => e => setForm(p => ({...p, [k]: e.target.value}));

  const handleSave = async () => {
    if (!form.name.trim()) { setError(t('common.required')+': '+lbl.nameAr); return; }
    setSaving(true); setError('');
    try {
      if (editId) await api.put(`/api/employees/${editId}`, form);
      else        await api.post('/api/employees', form);
      setSnack(t('common.success')); close(); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/employees/${delId}`);
      setSnack(t('common.success')); setDelId(null); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name?.toLowerCase().includes(q) || i.nameEn?.toLowerCase().includes(q) ||
           i.position?.toLowerCase().includes(q) || i.department?.toLowerCase().includes(q) ||
           i.nationalId?.includes(q);
  });

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <People sx={{ fontSize:32, color:'#34a853' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{lbl.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} · {items.filter(e=>e.status==='active').length} {lbl.active}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:'#34a853','&:hover':{bgcolor:'#2d7a3a'}, borderRadius:2 }}>
              {lbl.newEmp}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={`${lbl.search}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:340 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{lbl.nameAr}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.position}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.department}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.phone}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.salary}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.status}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{lbl.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4, color:'text.secondary' }}>{lbl.noData}</TableCell></TableRow>
              ) : filtered.map(emp => (
                <TableRow key={emp._id} hover>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                      <Avatar sx={{ width:34, height:34, bgcolor:'#34a85320', color:'#34a853', fontSize:13, fontWeight:700 }}>
                        {emp.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{emp.name}</Typography>
                        {emp.employeeId && <Typography variant="caption" color="text.secondary" sx={{ fontFamily:'monospace' }}>{emp.employeeId}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{emp.position||'—'}</Typography></TableCell>
                  <TableCell>{emp.department ? <Chip label={emp.department} size="small" sx={{ fontSize:'0.7rem' }}/> : '—'}</TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily:'monospace' }}>{emp.phone||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{emp.salary?(+emp.salary).toLocaleString()+' '+lbl.currency:'—'}</Typography></TableCell>
                  <TableCell><Chip label={statusLabel(emp.status)} color={statusColor(emp.status)} size="small" sx={{ fontSize:'0.7rem' }}/></TableCell>
                  <TableCell align="center">
                    <Tooltip title={lbl.edit}><IconButton size="small" onClick={()=>openEdit(emp)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton></Tooltip>
                    <Tooltip title={lbl.delete}><IconButton size="small" onClick={()=>setDelId(emp._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>{editId?`✏️ ${lbl.edit}`:`+ ${lbl.newEmp}`}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.nameAr} value={form.name} onChange={set('name')} required/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.nameEn} value={form.nameEn||''} onChange={set('nameEn')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.email} type="email" value={form.email||''} onChange={set('email')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.phone} value={form.phone||''} onChange={set('phone')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.natId} value={form.nationalId||''} onChange={set('nationalId')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.iqama} value={form.iqama||''} onChange={set('iqama')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.position} value={form.position||''} onChange={set('position')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.department} value={form.department||''} onChange={set('department')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={`${lbl.salary} (${lbl.currency})`} type="number" value={form.salary||''} onChange={set('salary')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.hireDate} type="date" value={form.hireDate||''} onChange={set('hireDate')} InputLabelProps={{ shrink:true }}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.nationality} value={form.nationality||''} onChange={set('nationality')}/></Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label={lbl.gender} value={form.gender||'male'} onChange={set('gender')} select>
                  <MenuItem value="male">{lbl.male}</MenuItem>
                  <MenuItem value="female">{lbl.female}</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label={lbl.status} value={form.status||'active'} onChange={set('status')} select>
                  <MenuItem value="active">{lbl.active}</MenuItem>
                  <MenuItem value="inactive">{lbl.inactive}</MenuItem>
                  <MenuItem value="terminated">{lbl.terminated}</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField fullWidth label={lbl.notes} multiline rows={2} value={form.notes||''} onChange={set('notes')}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3 }}>
            <Button onClick={close}>{lbl.cancel}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor:'#34a853','&:hover':{bgcolor:'#2d7a3a'} }}>
              {saving?<CircularProgress size={18}/>:lbl.save}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {lbl.delete}</DialogTitle>
          <DialogContent><Typography>{AR?'هل أنت متأكد من الحذف؟':'Confirm delete?'}</Typography></DialogContent>
          <DialogActions>
            <Button onClick={()=>setDelId(null)}>{lbl.cancel}</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>{lbl.delete}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};
export default EmployeesPage;
