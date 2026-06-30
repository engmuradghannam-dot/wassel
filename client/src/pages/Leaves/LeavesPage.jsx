import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, MenuItem, Tooltip, Avatar
} from '@mui/material';
import { Add, Check, Close, EventBusy, Refresh } from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const TYPES = [
  {value:'annual',labelAr:'سنوية',label:'Annual'}, {value:'sick',labelAr:'مرضية',label:'Sick'},
  {value:'unpaid',labelAr:'بدون راتب',label:'Unpaid'}, {value:'maternity',labelAr:'وضع',label:'Maternity'},
  {value:'paternity',labelAr:'أبوة',label:'Paternity'}, {value:'hajj',labelAr:'حج',label:'Hajj'},
  {value:'emergency',labelAr:'طارئة',label:'Emergency'}, {value:'bereavement',labelAr:'وفاة',label:'Bereavement'},
  {value:'other',labelAr:'أخرى',label:'Other'},
];
const STATUS_COLOR = { pending:'warning', approved:'success', rejected:'error', cancelled:'default' };
const STATUS_AR = { pending:'معلّق', approved:'معتمد', rejected:'مرفوض', cancelled:'ملغى' };

const empty = { type:'annual', startDate:'', endDate:'', reason:'' };

export default function LeavesPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const role = localStorage.getItem('userRole')||'user';
  const canApprove = ['owner','admin','superadmin','manager'].includes(role);

  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [dialog, setDialog]   = useState(false);
  const [form, setForm]       = useState(empty);
  const [saving, setSaving]   = useState(false);
  const [snack, setSnack]     = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/api/leaves'); setLeaves(r.data.data||[]); }
    catch (e) { setError(e.response?.data?.message||(AR?'فشل التحميل':'Failed')); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const handleSave = async () => {
    if (!form.startDate || !form.endDate) { setError(AR?'حدد تاريخ البداية والنهاية':'Select start and end dates'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/api/leaves', form);
      setSnack(AR?'تم تقديم طلب الإجازة':'Leave request submitted');
      setDialog(false); setForm(empty); load();
    } catch (e) { setError(e.response?.data?.detail||e.response?.data?.message||(AR?'فشل التقديم':'Submit failed')); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id, action) => {
    const comment = action==='reject' ? prompt(AR?'سبب الرفض:':'Rejection reason:') : '';
    try {
      await api.put(`/api/leaves/${id}/approve`, { action, comment });
      setSnack(action==='approve'?(AR?'تم الاعتماد':'Approved'):(AR?'تم الرفض':'Rejected'));
      load();
    } catch (e) { setSnack(e.response?.data?.message||(AR?'فشل':'Failed')); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm(AR?'إلغاء هذا الطلب؟':'Cancel this request?')) return;
    try { await api.put(`/api/leaves/${id}/cancel`); setSnack(AR?'تم الإلغاء':'Cancelled'); load(); }
    catch (e) { setSnack(e.response?.data?.message||(AR?'فشل':'Failed')); }
  };

  return (
    <Layout>
      <Box sx={{p:3}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <EventBusy sx={{fontSize:32,color:'#7b1fa2'}}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'طلبات الإجازات':'Leave Requests'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {leaves.length} {AR?'طلب':'requests'} · {leaves.filter(l=>l.status==='pending').length} {AR?'معلّق':'pending'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{display:'flex',gap:1}}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>setDialog(true)} sx={{bgcolor:'#7b1fa2',borderRadius:2}}>
              {AR?'+ طلب إجازة':'+ Request Leave'}
            </Button>
          </Box>
        </Box>

        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table>
            <TableHead>
              <TableRow sx={{bgcolor:'#f8f9fa'}}>
                <TableCell sx={{fontWeight:700}}>{AR?'الموظف':'Employee'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'النوع':'Type'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'من':'From'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'إلى':'To'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الأيام':'Days'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell align="center">—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={7} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :leaves.length===0?<TableRow><TableCell colSpan={7} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد طلبات':'No requests'}</TableCell></TableRow>
              :leaves.map(l=>(
                <TableRow key={l._id} hover>
                  <TableCell>
                    <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                      <Avatar sx={{width:28,height:28,bgcolor:'#7b1fa220',color:'#7b1fa2',fontSize:12}}>{l.employee?.name?.[0]}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{l.employee?.name||'—'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={AR?TYPES.find(x=>x.value===l.type)?.labelAr:TYPES.find(x=>x.value===l.type)?.label} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell>{new Date(l.startDate).toLocaleDateString(AR?'ar-SA':'en-GB')}</TableCell>
                  <TableCell>{new Date(l.endDate).toLocaleDateString(AR?'ar-SA':'en-GB')}</TableCell>
                  <TableCell><Typography fontWeight={700}>{l.days}</Typography></TableCell>
                  <TableCell><Chip label={AR?STATUS_AR[l.status]:l.status} color={STATUS_COLOR[l.status]} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell align="center">
                    {l.status==='pending' && canApprove && (
                      <>
                        <Tooltip title={AR?'اعتماد':'Approve'}><IconButton size="small" onClick={()=>handleApprove(l._id,'approve')} sx={{color:'#34a853'}}><Check sx={{fontSize:16}}/></IconButton></Tooltip>
                        <Tooltip title={AR?'رفض':'Reject'}><IconButton size="small" onClick={()=>handleApprove(l._id,'reject')} sx={{color:'#e53935'}}><Close sx={{fontSize:16}}/></IconButton></Tooltip>
                      </>
                    )}
                    {l.status==='pending' && !canApprove && (
                      <Button size="small" onClick={()=>handleCancel(l._id)}>{AR?'إلغاء':'Cancel'}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="xs" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={800}>{AR?'طلب إجازة جديد':'New Leave Request'}</DialogTitle>
          <DialogContent>
            {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}
            <Grid container spacing={2} sx={{mt:0.5}}>
              <Grid item xs={12}><TextField fullWidth label={AR?'نوع الإجازة':'Leave Type'} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} select>
                {TYPES.map(t=><MenuItem key={t.value} value={t.value}>{AR?t.labelAr:t.label}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={6}><TextField fullWidth type="date" label={AR?'من تاريخ':'Start Date'} value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={6}><TextField fullWidth type="date" label={AR?'إلى تاريخ':'End Date'} value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={12}><TextField fullWidth label={AR?'السبب':'Reason'} value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))} multiline rows={2}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2}}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{bgcolor:'#7b1fa2'}}>
              {saving?<CircularProgress size={18} color="inherit"/>:(AR?'تقديم الطلب':'Submit')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3500} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
