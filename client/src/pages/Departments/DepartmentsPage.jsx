import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, MenuItem
} from '@mui/material';
import { Add, Edit, Delete, AccountTree, Refresh, People } from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const empty = { name:'', nameEn:'', code:'', manager:'', branch:'', budget:0, description:'', isActive:true };

export default function DepartmentsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees]     = useState([]);
  const [branches, setBranches]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [snack, setSnack]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [dR, eR, bR] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/employees').catch(()=>({data:{data:[]}})),
        api.get('/api/branches').catch(()=>({data:{data:[]}})),
      ]);
      setDepartments(dR.data.data || []);
      setEmployees(eR.data.data || []);
      setBranches(bR.data.data || []);
    } catch (e) { setError(e.response?.data?.message || (AR?'فشل التحميل':'Failed to load')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openDialog = (dept = null) => {
    setEditing(dept);
    setForm(dept ? { ...dept, manager: dept.manager?._id||dept.manager||'', branch: dept.branch?._id||dept.branch||'' } : empty);
    setError(''); setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError(AR?'اسم القسم مطلوب':'Name required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.manager) delete payload.manager;
      if (!payload.branch)  delete payload.branch;
      if (editing) { await api.put(`/api/departments/${editing._id}`, payload); setSnack(AR?'تم التحديث':'Updated'); }
      else         { await api.post('/api/departments', payload); setSnack(AR?'تم الإنشاء':'Created'); }
      setDialog(false); load();
    } catch (e) { setError(e.response?.data?.detail || e.response?.data?.message || (AR?'فشل الحفظ':'Save failed')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'حذف هذا القسم؟':'Delete this department?')) return;
    try { await api.delete(`/api/departments/${id}`); setSnack(AR?'تم الحذف':'Deleted'); load(); }
    catch (e) { setError(e.response?.data?.message || (AR?'فشل الحذف':'Delete failed')); }
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <AccountTree sx={{ fontSize:32, color:'#283593' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'الأقسام':'Departments'}</Typography>
              <Typography variant="caption" color="text.secondary">{departments.length} {AR?'قسم':'departments'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>openDialog()} sx={{ bgcolor:'#283593', borderRadius:2 }}>
              {AR?'+ قسم جديد':'+ New Department'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'القسم':'Department'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'رئيس القسم':'Manager'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الفرع':'Branch'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الميزانية':'Budget'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell align="center">—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={6} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :departments.length===0?<TableRow><TableCell colSpan={6} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد أقسام':'No departments'}</TableCell></TableRow>
              :departments.map(d=>(
                <TableRow key={d._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{fontFamily:'monospace'}}>{d.code}</Typography>
                  </TableCell>
                  <TableCell>{d.manager?.name||'—'}</TableCell>
                  <TableCell>{d.branch?.name||'—'}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{(+(d.budget||0)).toLocaleString()} {AR?'ر.س':'SAR'}</Typography></TableCell>
                  <TableCell><Chip label={d.isActive?(AR?'فعّال':'Active'):(AR?'معطّل':'Inactive')} size="small" color={d.isActive?'success':'default'}/></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={()=>openDialog(d)} sx={{color:'#283593'}}><Edit sx={{fontSize:16}}/></IconButton>
                    <IconButton size="small" onClick={()=>handleDelete(d._id)} sx={{color:'#e53935'}}><Delete sx={{fontSize:16}}/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="sm" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={800}>{editing?(AR?'تعديل قسم':'Edit Department'):(AR?'قسم جديد':'New Department')}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}
            <Grid container spacing={2} sx={{mt:0.5}}>
              <Grid item xs={12} sm={6}><TextField fullWidth label={`${AR?'اسم القسم':'Name'} *`} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Name (EN)" value={form.nameEn} onChange={e=>setForm(p=>({...p,nameEn:e.target.value}))}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={AR?'رئيس القسم':'Manager'} value={form.manager} onChange={e=>setForm(p=>({...p,manager:e.target.value}))} select>
                <MenuItem value=""><em>{AR?'بدون':'None'}</em></MenuItem>
                {employees.map(e=><MenuItem key={e._id} value={e._id}>{e.name} — {e.position}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={AR?'الفرع':'Branch'} value={form.branch} onChange={e=>setForm(p=>({...p,branch:e.target.value}))} select>
                <MenuItem value=""><em>{AR?'بدون':'None'}</em></MenuItem>
                {branches.map(b=><MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth type="number" label={AR?'الميزانية السنوية (ر.س)':'Annual Budget'} value={form.budget} onChange={e=>setForm(p=>({...p,budget:+e.target.value}))}/></Grid>
              <Grid item xs={12}><TextField fullWidth label={AR?'الوصف':'Description'} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} multiline rows={2}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2}}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{bgcolor:'#283593'}}>
              {saving?<CircularProgress size={18} color="inherit"/>:(AR?'حفظ':'Save')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
