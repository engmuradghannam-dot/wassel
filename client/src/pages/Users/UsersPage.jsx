import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, IconButton, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, Alert, Snackbar, InputAdornment, CircularProgress, Tooltip } from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, People, AdminPanelSettings } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const ROLES=[{value:'admin',labelAr:'مدير',label:'Admin'},{value:'manager',labelAr:'مشرف',label:'Manager'},{value:'user',labelAr:'مستخدم',label:'User'},{value:'employee',labelAr:'موظف',label:'Employee'},{value:'readonly',labelAr:'قراءة فقط',label:'Read Only'}];

export default function UsersPage() {
  const { t, i18n } = useTranslation(); const AR = i18n.language==='ar';
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [dialog,setDialog]=useState(false); const [form,setForm]=useState({name:'',email:'',password:'',role:'user',phone:''});
  const [editId,setEditId]=useState(null); const [error,setError]=useState(''); const [snack,setSnack]=useState('');
  const [search,setSearch]=useState('');

  const load = useCallback(async()=>{
    setLoading(true);
    try{ const r=await api.get('/api/users'); if(r.data.success) setItems(r.data.data||[]); }
    catch(e){setError(e.response?.data?.message||t('common.error'));}
    finally{setLoading(false);}
  },[t]);
  useEffect(()=>{load();},[load]);

  const openAdd=()=>{setForm({name:'',email:'',password:'',role:'user',phone:''});setEditId(null);setError('');setDialog(true);};
  const openEdit=(u)=>{setForm({...u,password:''});setEditId(u._id);setError('');setDialog(true);};
  const close=()=>{setDialog(false);setError('');};

  const handleSave=async()=>{
    if(!form.name||!form.email){setError(AR?'الاسم والبريد مطلوبان':'Name and email required');return;}
    if(!editId&&!form.password){setError(AR?'كلمة المرور مطلوبة':'Password required');return;}
    try{
      const payload={...form};
      if(!payload.password) delete payload.password;
      if(editId) await api.put(`/api/users/${editId}`,payload);
      else await api.post('/api/users',payload);
      setSnack(t('common.success'));close();load();
    }catch(e){setError(e.response?.data?.message||t('common.error'));}
  };

  const myId=localStorage.getItem('userId');
  const myRole=localStorage.getItem('userRole');
  const filtered=items.filter(u=>!search||(u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase())));

  return (
    <Layout>
      <Box sx={{p:3}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <People sx={{fontSize:32,color:'#7b1fa2'}}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'إدارة المستخدمين':'User Management'}</Typography>
              <Typography variant="caption" color="text.secondary">{items.length} {AR?'مستخدم':'users'}</Typography>
            </Box>
          </Box>
          <Box sx={{display:'flex',gap:1}}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd} sx={{bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'},borderRadius:2}}>
              {AR?'مستخدم جديد':'New User'}
            </Button>
          </Box>
        </Box>
        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}
        <TextField size="small" placeholder={`${t('common.search')}...`} value={search} onChange={e=>setSearch(e.target.value)} sx={{mb:2,width:320}}
          InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18}}/></InputAdornment>}}/>
        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table>
            <TableHead>
              <TableRow sx={{bgcolor:'#f8f9fa'}}>
                <TableCell sx={{fontWeight:700}}>{AR?'المستخدم':'User'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'البريد':'Email'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الدور':'Role'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{fontWeight:700}} align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={5} align="center" sx={{py:4}}><CircularProgress size={28}/></TableCell></TableRow>
              :filtered.map(u=>(
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{display:'flex',alignItems:'center',gap:1.2}}>
                      <Avatar sx={{width:34,height:34,bgcolor:'#7b1fa220',color:'#7b1fa2',fontSize:13,fontWeight:700}}>{u.name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                        {u._id===myId&&<Chip label={AR?'أنت':'You'} size="small" color="primary" sx={{fontSize:'0.6rem',height:16}}/>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                  <TableCell>
                    <Chip label={ROLES.find(r=>r.value===u.role)?.(AR?'labelAr':'label')||u.role} size="small"
                      color={['owner','admin','superadmin'].includes(u.role)?'primary':'default'}
                      sx={{fontSize:'0.7rem'}}/>
                  </TableCell>
                  <TableCell><Chip label={u.isActive?(AR?'نشط':'Active'):(AR?'موقوف':'Suspended')} color={u.isActive?'success':'default'} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('common.edit')}><IconButton size="small" onClick={()=>openEdit(u)} sx={{color:'#1a73e8'}}><Edit sx={{fontSize:16}}/></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialog} onClose={close} maxWidth="xs" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={700}>{editId?(AR?'تعديل مستخدم':'Edit User'):(AR?'مستخدم جديد':'New User')}</DialogTitle>
          <DialogContent>
            {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}
            <Grid container spacing={2} sx={{mt:0.5}}>
              <Grid item xs={12}><TextField fullWidth label={AR?'الاسم *':'Full Name *'} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/></Grid>
              <Grid item xs={12}><TextField fullWidth label={AR?'البريد الإلكتروني *':'Email *'} type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required disabled={!!editId}/></Grid>
              <Grid item xs={12}><TextField fullWidth label={editId?(AR?'كلمة المرور (اتركها للإبقاء)':'Password (leave blank to keep)'):(AR?'كلمة المرور *':'Password *')} type="password" value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required={!editId}/></Grid>
              <Grid item xs={12}><TextField fullWidth label={AR?'الدور':'Role'} value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} select>
                {ROLES.map(r=><MenuItem key={r.value} value={r.value}>{AR?r.labelAr:r.label}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12}><TextField fullWidth label={AR?'رقم الهاتف':'Phone'} value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3}}>
            <Button onClick={close}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} sx={{bgcolor:'#7b1fa2'}}>{t('common.save')}</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
