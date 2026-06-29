import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Alert, CircularProgress, Snackbar, InputAdornment, Tooltip,
  MenuItem, Divider
} from '@mui/material';
import { Add, Refresh, Visibility, Close, Save, Description, Warning } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const TYPES_AR = { sales:'مبيعات', purchase:'مشتريات', employment:'توظيف', service:'خدمات', lease:'إيجار', partnership:'شراكة', nda:'سرية', maintenance:'صيانة', consulting:'استشارات', government:'حكومي', other:'أخرى' };
const STATUS_AR = { draft:'مسودة', under_review:'قيد المراجعة', active:'نشط', expired:'منتهي', terminated:'منتهي مبكراً', renewed:'مجدد' };
const STATUS_COLOR = { draft:'default', under_review:'warning', active:'success', expired:'error', terminated:'error', renewed:'info' };

export default function ContractsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const [items, setItems]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog]  = useState(false);
  const [error, setError]    = useState('');
  const [snack, setSnack]    = useState('');
  const [saving, setSaving]  = useState(false);
  const [form, setForm] = useState({
    title:'', type:'service', status:'draft', startDate:'', endDate:'',
    value:0, paymentTerms:'',
    'counterParty.name':'', 'counterParty.type':'company',
    'counterParty.commercialReg':'', 'counterParty.vatNumber':'',
    notes:'',
  });

  const load = useCallback(async()=>{
    setLoading(true);
    try{
      const [cR, eR] = await Promise.all([
        api.get('/api/contracts'),
        api.get('/api/employees').catch(()=>({data:{data:[]}})),
      ]);
      if(cR.data.success) setItems(cR.data.data||[]);
      if(eR.data.success) setEmployees(eR.data.data||[]);
    }catch(e){setError(e.response?.data?.message||t('common.error'));}
    finally{setLoading(false);}
  },[t]);
  useEffect(()=>{load();},[load]);

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async()=>{
    if(!form.title||!form.type||!form.startDate){setError(AR?'العنوان والنوع وتاريخ البدء مطلوبة':'Title, type, and start date required');return;}
    setSaving(true); setError('');
    try{
      const payload = {};
      Object.entries(form).forEach(([k,v])=>{
        if(k.includes('.')){ const [a,b]=k.split('.'); if(!payload[a]) payload[a]={}; payload[a][b]=v; }
        else payload[k]=v;
      });
      await api.post('/api/contracts', payload);
      setSnack(AR?'تم حفظ العقد':'Contract saved');
      setDialog(false); load();
    }catch(e){setError(e.response?.data?.message||t('common.error'));}
    finally{setSaving(false);}
  };

  const fmt = n => (+n||0).toLocaleString();
  const CUR = AR?'ر.س':'SAR';
  const today = new Date();
  const expiringSoon = items.filter(i=>i.endDate && new Date(i.endDate) > today && new Date(i.endDate) < new Date(today.getTime()+30*86400000));

  return (
    <Layout>
      <Box sx={{p:3}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <Description sx={{fontSize:32,color:'#00695c'}}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'العقود':'Contracts'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'عقد':'contracts'} · {items.filter(i=>i.status==='active').length} {AR?'نشط':'active'}
                {expiringSoon.length>0&&<Chip label={`⚠ ${expiringSoon.length} ${AR?'تنتهي قريباً':'expiring soon'}`} size="small" color="warning" sx={{ml:1,fontSize:'0.65rem'}}/>}
              </Typography>
            </Box>
          </Box>
          <Box sx={{display:'flex',gap:1}}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>setDialog(true)} sx={{bgcolor:'#00695c',borderRadius:2}}>
              {AR?'+ عقد جديد':'+ New Contract'}
            </Button>
          </Box>
        </Box>

        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table>
            <TableHead>
              <TableRow sx={{bgcolor:'#f8f9fa'}}>
                <TableCell sx={{fontWeight:700}}>{AR?'رقم العقد':'Contract#'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'العنوان':'Title'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'النوع':'Type'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الطرف الآخر':'Counter Party'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'قيمة العقد':'Value'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'تاريخ الانتهاء':'End Date'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={7} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :items.length===0?<TableRow><TableCell colSpan={7} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد عقود':'No contracts found'}</TableCell></TableRow>
              :items.map(c=>{
                const isExpiringSoon = c.endDate && new Date(c.endDate) > today && new Date(c.endDate) < new Date(today.getTime()+30*86400000);
                return (
                  <TableRow key={c._id} hover sx={isExpiringSoon?{bgcolor:'#fff8e1'}:{}}>
                    <TableCell><Typography variant="body2" fontWeight={700} color="#00695c" sx={{fontFamily:'monospace'}}>{c.contractNumber}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                      {isExpiringSoon&&<Chip label={AR?'تنتهي قريباً':'Expiring soon'} size="small" color="warning" sx={{fontSize:'0.65rem',mt:0.3}}/>}
                    </TableCell>
                    <TableCell><Chip label={AR?TYPES_AR[c.type]:c.type} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                    <TableCell><Typography variant="body2">{c.counterParty?.name||'—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{fmt(c.value)} {CUR}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{display:'flex',alignItems:'center',gap:0.5}}>
                        {isExpiringSoon&&<Warning sx={{fontSize:14,color:'#f57c00'}}/>}
                        <Typography variant="body2">{c.endDate?new Date(c.endDate).toLocaleDateString(AR?'ar-SA':'en-GB'):'—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={AR?STATUS_AR[c.status]:c.status} color={STATUS_COLOR[c.status]} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* NEW CONTRACT DIALOG */}
        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="md" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={800} sx={{borderBottom:'1px solid',borderColor:'divider',pb:1.5}}>
            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Box sx={{display:'flex',alignItems:'center',gap:1}}><Description sx={{color:'#00695c'}}/>{AR?'عقد جديد':'New Contract'}</Box>
              <IconButton onClick={()=>setDialog(false)} size="small"><Close sx={{fontSize:18}}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{pt:3}}>
            {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}><TextField fullWidth size="small" label={`${AR?'عنوان العقد':'Title'} *`} value={form.title} onChange={set('title')} required/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'نوع العقد':'Type'} value={form.type} onChange={set('type')} select>
                {Object.entries(TYPES_AR).map(([k,v])=><MenuItem key={k} value={k}>{AR?v:k}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><Divider><Typography variant="caption">{AR?'بيانات الطرف الآخر':'Counter Party'}</Typography></Divider></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label={AR?'اسم الطرف الآخر *':'Counter Party Name *'} value={form['counterParty.name']} onChange={set('counterParty.name')} required/></Grid>
              <Grid item xs={12} sm={3}><TextField fullWidth size="small" label={AR?'السجل التجاري':'CR No.'} value={form['counterParty.commercialReg']} onChange={set('counterParty.commercialReg')}/></Grid>
              <Grid item xs={12} sm={3}><TextField fullWidth size="small" label={AR?'الرقم الضريبي':'VAT'} value={form['counterParty.vatNumber']} onChange={set('counterParty.vatNumber')}/></Grid>
              <Grid item xs={12}><Divider><Typography variant="caption">{AR?'التواريخ والقيمة':'Dates & Value'}</Typography></Divider></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={`${AR?'تاريخ البدء':'Start Date'} *`} type="date" value={form.startDate} onChange={set('startDate')} InputLabelProps={{shrink:true}} required/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'تاريخ الانتهاء':'End Date'} type="date" value={form.endDate} onChange={set('endDate')} InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'قيمة العقد (ر.س)':'Contract Value'} type="number" value={form.value} onChange={set('value')} InputProps={{endAdornment:<InputAdornment position="end">{CUR}</InputAdornment>}}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label={AR?'شروط الدفع':'Payment Terms'} value={form.paymentTerms} onChange={set('paymentTerms')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label={AR?'الحالة':'Status'} value={form.status} onChange={set('status')} select>
                {Object.entries(STATUS_AR).map(([k,v])=><MenuItem key={k} value={k}>{AR?v:k}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label={AR?'ملاحظات':'Notes'} value={form.notes} onChange={set('notes')} multiline rows={2}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2,borderTop:'1px solid',borderColor:'divider'}}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving?<CircularProgress size={16}/>:<Save/>} sx={{bgcolor:'#00695c'}}>
              {AR?'حفظ العقد':'Save Contract'}
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
