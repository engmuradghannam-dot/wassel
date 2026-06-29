import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Alert, CircularProgress, Snackbar, InputAdornment, MenuItem, Avatar, Tooltip, Card, CardContent } from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, FitnessCenter, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor } from '../../utils/sectorNav';

const TYPES = [
  {v:'monthly',ar:'شهري',en:'Monthly'},{v:'quarterly',ar:'ربع سنوي',en:'Quarterly'},
  {v:'semi_annual',ar:'نصف سنوي',en:'Semi-Annual'},{v:'annual',ar:'سنوي',en:'Annual'},
  {v:'daily',ar:'يومي',en:'Daily'},{v:'class_pack',ar:'باقة حصص',en:'Class Pack'},
];
const STATUS = [
  {value:'active',ar:'نشط',en:'Active',color:'#34a853'},
  {value:'expired',ar:'منتهي',en:'Expired',color:'#e53935'},
  {value:'frozen',ar:'مجمد',en:'Frozen',color:'#1a73e8'},
  {value:'cancelled',ar:'ملغى',en:'Cancelled',color:'#546e7a'},
];
const EMPTY = { memberName:'', memberPhone:'', memberNationalId:'', memberEmail:'', memberGender:'male', membershipType:'monthly', startDate:'', endDate:'', fee:0, paidAmount:0, status:'active', notes:'' };

export default function MembershipsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language==='ar';
  const color = getSectorColor(localStorage.getItem('userIndustry')||'gym');

  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  const [dialog,setDialog]=useState(false); const [form,setForm]=useState(EMPTY);
  const [editId,setEditId]=useState(null); const [search,setSearch]=useState('');
  const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  const [snack,setSnack]=useState('');

  const load = useCallback(async()=>{ setLoading(true); try { const r=await api.get('/api/sector/memberships'); if(r.data.success) setItems(r.data.data||[]); } catch(e){setError(e.response?.data?.message||'خطأ');} finally{setLoading(false);} },[]);
  useEffect(()=>{load();},[load]);

  const set = k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const openAdd=()=>{setForm({...EMPTY,startDate:new Date().toISOString().split('T')[0]});setEditId(null);setError('');setDialog(true);};
  const openEdit=m=>{setForm({...m,startDate:m.startDate?.split('T')[0]||'',endDate:m.endDate?.split('T')[0]||''});setEditId(m._id);setError('');setDialog(true);};
  const close=()=>{setDialog(false);setForm(EMPTY);setEditId(null);setError('');};

  const handleSave=async()=>{
    if(!form.memberName){setError(AR?'الاسم مطلوب':'Name required');return;}
    setSaving(true);
    try{if(editId)await api.put(`/api/sector/memberships/${editId}`,form);else await api.post('/api/sector/memberships',form);setSnack(t('common.success')||'تم');close();load();}
    catch(e){setError(e.response?.data?.message||'خطأ');} finally{setSaving(false);}
  };
  const handleDelete=async id=>{if(!window.confirm(AR?'تأكيد؟':'Confirm?'))return;try{await api.delete(`/api/sector/memberships/${id}`);setSnack('تم');load();}catch(e){setError(e.response?.data?.message||'خطأ');}};

  const filtered=items.filter(m=>!search||m.memberName?.toLowerCase().includes(search.toLowerCase())||m.memberPhone?.includes(search));
  const stInfo=v=>STATUS.find(s=>s.value===v)||STATUS[0];

  const stats={total:items.length,active:items.filter(m=>m.status==='active').length,revenue:items.reduce((s,m)=>s+(m.paidAmount||0),0)};

  return(
    <Layout>
      <Box sx={{p:3}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <FitnessCenter sx={{fontSize:32,color}}/>
            <Box><Typography variant="h5" fontWeight={800}>{AR?'الاشتراكات':'Memberships'}</Typography>
              <Typography variant="caption" color="text.secondary">{stats.total} · {stats.active} {AR?'نشط':'active'}</Typography></Box>
          </Box>
          <Box sx={{display:'flex',gap:1}}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd} sx={{bgcolor:color,borderRadius:2}}>{AR?'اشتراك جديد':'New Membership'}</Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{mb:3}}>
          {[{l:AR?'إجمالي':'Total',v:stats.total,c:'#1a73e8'},{l:AR?'نشط':'Active',v:stats.active,c:'#34a853'},{l:AR?'الإيرادات':'Revenue',v:(stats.revenue).toLocaleString()+' '+(AR?'ر.س':'SAR'),c:'#7b1fa2'}].map((s,i)=>(
            <Grid item xs={4} key={i}><Card sx={{borderLeft:`4px solid ${s.c}`,borderRadius:2}}><CardContent sx={{py:1.5,'&:last-child':{pb:1.5}}}><Typography variant="h5" fontWeight={800} sx={{color:s.c}}>{s.v}</Typography><Typography variant="caption" color="text.secondary">{s.l}</Typography></CardContent></Card></Grid>
          ))}
        </Grid>

        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}
        <TextField size="small" placeholder={`${t('common.search')||'Search'}...`} value={search} onChange={e=>setSearch(e.target.value)} sx={{mb:2,width:300}} InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18,color:'text.secondary'}}/></InputAdornment>}}/>

        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table><TableHead><TableRow sx={{bgcolor:'#f8f9fa'}}>
            <TableCell sx={{fontWeight:700}}>{AR?'العضو':'Member'}</TableCell>
            <TableCell sx={{fontWeight:700}}>{AR?'نوع الاشتراك':'Type'}</TableCell>
            <TableCell sx={{fontWeight:700}}>{AR?'تاريخ البداية':'Start'}</TableCell>
            <TableCell sx={{fontWeight:700}}>{AR?'تاريخ الانتهاء':'End'}</TableCell>
            <TableCell sx={{fontWeight:700}}>{AR?'الرسوم':'Fee'}</TableCell>
            <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
            <TableCell sx={{fontWeight:700}} align="center">{t('common.actions')||'Actions'}</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading?<TableRow><TableCell colSpan={7} align="center" sx={{py:4}}><CircularProgress size={28}/></TableCell></TableRow>
            :filtered.length===0?<TableRow><TableCell colSpan={7} align="center" sx={{py:4,color:'text.secondary'}}>{AR?'لا يوجد اشتراكات':'No memberships'}</TableCell></TableRow>
            :filtered.map(m=>{const st=stInfo(m.status);return(
              <TableRow key={m._id} hover>
                <TableCell><Box sx={{display:'flex',alignItems:'center',gap:1.2}}>
                  <Avatar sx={{width:32,height:32,bgcolor:`${color}20`,color,fontSize:13,fontWeight:700}}>{m.memberName?.[0]}</Avatar>
                  <Box><Typography variant="body2" fontWeight={600}>{m.memberName}</Typography>
                    {m.memberPhone&&<Typography variant="caption" color="text.secondary" sx={{fontFamily:'monospace'}}>{m.memberPhone}</Typography>}</Box>
                </Box></TableCell>
                <TableCell><Chip label={TYPES.find(tp=>tp.v===m.membershipType)?.(AR?'ar':'en')||m.membershipType} size="small" sx={{bgcolor:`${color}15`,color}}/></TableCell>
                <TableCell><Typography variant="body2">{m.startDate?.split('T')[0]||'—'}</Typography></TableCell>
                <TableCell><Typography variant="body2" color={m.status==='expired'?'error':undefined}>{m.endDate?.split('T')[0]||'—'}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={700}>{(m.paidAmount||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography></TableCell>
                <TableCell><Chip label={AR?st.ar:st.en} size="small" sx={{bgcolor:`${st.color}18`,color:st.color,fontWeight:600,fontSize:'0.7rem'}}/></TableCell>
                <TableCell align="center">
                  <Tooltip title={t('common.edit')||'Edit'}><IconButton size="small" onClick={()=>openEdit(m)} sx={{color:'#1a73e8'}}><Edit sx={{fontSize:16}}/></IconButton></Tooltip>
                  <Tooltip title={t('common.delete')||'Delete'}><IconButton size="small" onClick={()=>handleDelete(m._id)} sx={{color:'#e53935'}}><Delete sx={{fontSize:16}}/></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            );})}
          </TableBody></Table>
        </TableContainer>

        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle sx={{fontWeight:700,pb:0}}>
            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              {editId?(AR?'✏️ تعديل الاشتراك':'Edit'):(AR?'+ اشتراك جديد':'+ New Membership')}
              <IconButton onClick={close} size="small"><Close sx={{fontSize:18}}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error&&<Alert severity="error" sx={{mb:2,mt:1,borderRadius:2}}>{error}</Alert>}
            <Grid container spacing={2} sx={{mt:0.5}}>
              <Grid item xs={12} sm={6}><TextField label={AR?'اسم العضو *':'Member Name *'} value={form.memberName} onChange={set('memberName')} fullWidth required/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'الهاتف':'Phone'} value={form.memberPhone||''} onChange={set('memberPhone')} fullWidth/></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'البريد الإلكتروني':'Email'} value={form.memberEmail||''} onChange={set('memberEmail')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الجنس':'Gender'} value={form.memberGender||'male'} onChange={set('memberGender')} fullWidth select><MenuItem value="male">{AR?'ذكر':'Male'}</MenuItem><MenuItem value="female">{AR?'أنثى':'Female'}</MenuItem></TextField></Grid>
              <Grid item xs={12} sm={6}><TextField label={AR?'نوع الاشتراك':'Type'} value={form.membershipType||'monthly'} onChange={set('membershipType')} fullWidth select>{TYPES.map(tp=><MenuItem key={tp.v} value={tp.v}>{AR?tp.ar:tp.en}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'البداية':'Start'} type="date" value={form.startDate||''} onChange={set('startDate')} fullWidth InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الانتهاء':'End'} type="date" value={form.endDate||''} onChange={set('endDate')} fullWidth InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الرسوم (ر.س)':'Fee'} type="number" value={form.fee||0} onChange={set('fee')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'المدفوع':'Paid'} type="number" value={form.paidAmount||0} onChange={set('paidAmount')} fullWidth/></Grid>
              <Grid item xs={6} sm={3}><TextField label={AR?'الحالة':'Status'} value={form.status||'active'} onChange={set('status')} fullWidth select>{STATUS.map(s=><MenuItem key={s.value} value={s.value}>{AR?s.ar:s.en}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><TextField label={AR?'ملاحظات':'Notes'} value={form.notes||''} onChange={set('notes')} fullWidth multiline rows={2}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2}}>
            <Button onClick={close}>{t('common.cancel')||'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving?<CircularProgress size={16}/>:<Save/>} sx={{bgcolor:color}}>{t('common.save')||'Save'}</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
