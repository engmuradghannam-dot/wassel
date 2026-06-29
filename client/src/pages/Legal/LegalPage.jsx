import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Alert, CircularProgress, Snackbar, InputAdornment, Tooltip,
  Avatar, Divider, MenuItem, Card, CardContent, Tabs, Tab
} from '@mui/material';
import { Add, Refresh, Visibility, Close, Save, Gavel, Warning, AttachMoney } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const TYPES_AR = { commercial:'تجارية', labor:'عمالية', civil:'مدنية', criminal:'جنائية', administrative:'إدارية', arbitration:'تحكيم', real_estate:'عقارات', other:'أخرى' };
const STATUS_AR = { draft:'مسودة', active:'نشطة', in_court:'أمام المحكمة', awaiting_judgment:'انتظار الحكم', settled:'تسوية', won:'فُزنا', lost:'خسرنا', appealed:'استئناف', closed:'مغلقة' };
const STATUS_COLOR = { draft:'default', active:'info', in_court:'warning', awaiting_judgment:'warning', settled:'primary', won:'success', lost:'error', appealed:'warning', closed:'default' };
const PRIORITY_COLOR = { low:'default', medium:'info', high:'warning', critical:'error' };

export default function LegalPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const [tab,      setTab]      = useState(0);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dialog,   setDialog]   = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [error,    setError]    = useState('');
  const [snack,    setSnack]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    title:'', type:'commercial', ourRole:'defendant', status:'draft', priority:'medium',
    'counterParty.name':'', 'counterParty.type':'company', court:'', claimValue:0,
    assignedLawyer:'', description:'', filingDate:'', nextHearing:'',
    'financialJudgment.hasFinancial':false, 'financialJudgment.amount':0, 'financialJudgment.direction':'payable',
  });

  const load = useCallback(async()=>{
    setLoading(true);
    try{
      const r = await api.get('/api/legal');
      if(r.data.success) setItems(r.data.data||[]);
    }catch(e){setError(e.response?.data?.message||t('common.error'));}
    finally{setLoading(false);}
  },[t]);
  useEffect(()=>{load();},[load]);

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async()=>{
    if(!form.title.trim()||!form.type){setError(AR?'العنوان والنوع مطلوبان':'Title and type required');return;}
    setSaving(true); setError('');
    try{
      const payload = {};
      Object.entries(form).forEach(([k,v])=>{
        if(k.includes('.')){ const [a,b]=k.split('.'); if(!payload[a]) payload[a]={}; payload[a][b]=v; }
        else payload[k]=v;
      });
      await api.post('/api/legal', payload);
      setSnack(AR?'تم حفظ القضية':'Case saved');
      setDialog(false); load();
    }catch(e){setError(e.response?.data?.message||t('common.error'));}
    finally{setSaving(false);}
  };

  const convertToPayment = async(id)=>{
    const supplier = prompt(AR?'معرّف المورد (Supplier ID):':'Supplier ID for payment:');
    if(!supplier) return;
    try{
      const r = await api.put(`/api/legal/${id}/convert-to-po`,{supplier});
      setSnack(r.data.message||(AR?'تم إنشاء أمر الدفع':'Payment order created'));
      setViewItem(null); load();
    }catch(e){setSnack(e.response?.data?.message||t('common.error'));}
  };

  const fmt = n=>(+n||0).toLocaleString();
  const CUR = AR?'ر.س':'SAR';

  const upcoming = items.filter(i=>i.nextHearing && new Date(i.nextHearing) > new Date())
    .sort((a,b)=>new Date(a.nextHearing)-new Date(b.nextHearing)).slice(0,5);

  const financial = items.filter(i=>i.financialJudgment?.hasFinancial && !i.financialJudgment?.purchaseOrder);

  return (
    <Layout>
      <Box sx={{p:3}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <Gavel sx={{fontSize:32,color:'#c62828'}}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'القضايا والليجال':'Legal & Cases'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'قضية':'cases'} · {items.filter(i=>['active','in_court','awaiting_judgment'].includes(i.status)).length} {AR?'نشطة':'active'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{display:'flex',gap:1}}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>setDialog(true)}
              sx={{bgcolor:'#c62828',borderRadius:2}}>
              {AR?'+ قضية جديدة':'+ New Case'}
            </Button>
          </Box>
        </Box>

        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

        {/* Quick stats */}
        <Grid container spacing={2} sx={{mb:3}}>
          {[
            {label:AR?'الجلسات القادمة':'Upcoming Hearings', value:upcoming.length, color:'#1a73e8', icon:'📅'},
            {label:AR?'أحكام مالية معلقة':'Pending Payments', value:financial.length, color:'#e53935', icon:'💰'},
            {label:AR?'قضايا نشطة':'Active Cases', value:items.filter(i=>['active','in_court'].includes(i.status)).length, color:'#f57c00', icon:'⚖️'},
            {label:AR?'إجمالي المطالبات':'Total Claims', value:items.reduce((s,i)=>s+(i.claimValue||0),0), color:'#7b1fa2', icon:'📊', isMoney:true},
          ].map((s,i)=>(
            <Grid item xs={6} sm={3} key={i}>
              <Card sx={{borderRadius:2,borderLeft:`4px solid ${s.color}`}}>
                <CardContent sx={{p:2,'&:last-child':{pb:2}}}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{color:s.color}}>
                    {s.isMoney ? `${fmt(s.value)} ${CUR}` : s.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table>
            <TableHead>
              <TableRow sx={{bgcolor:'#f8f9fa'}}>
                <TableCell sx={{fontWeight:700}}>{AR?'رقم القضية':'Case#'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'العنوان':'Title'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'النوع':'Type'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الطرف الآخر':'Counter Party'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'قيمة المطالبة':'Claim Value'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الجلسة القادمة':'Next Hearing'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell align="center">—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={8} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :items.length===0?<TableRow><TableCell colSpan={8} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد قضايا':'No cases found'}</TableCell></TableRow>
              :items.map(lc=>(
                <TableRow key={lc._id} hover>
                  <TableCell><Typography variant="body2" fontWeight={700} color="#c62828" sx={{fontFamily:'monospace'}}>{lc.caseNumber}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{lc.title}</Typography>
                    {lc.financialJudgment?.hasFinancial&&!lc.financialJudgment?.purchaseOrder&&(
                      <Chip label={AR?`حكم مالي ${fmt(lc.financialJudgment.amount)} ر.س`:`💰 Financial ${fmt(lc.financialJudgment.amount)}`} size="small" color="error" sx={{fontSize:'0.65rem',mt:0.3}}/>
                    )}
                  </TableCell>
                  <TableCell><Chip label={AR?TYPES_AR[lc.type]:lc.type} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell><Typography variant="body2">{lc.counterParty?.name||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{fmt(lc.claimValue)} {CUR}</Typography></TableCell>
                  <TableCell>
                    {lc.nextHearing?(
                      <Box sx={{display:'flex',alignItems:'center',gap:0.5}}>
                        {new Date(lc.nextHearing)<new Date(Date.now()+7*86400000)&&<Warning sx={{fontSize:14,color:'#f57c00'}}/>}
                        <Typography variant="body2">{new Date(lc.nextHearing).toLocaleDateString(AR?'ar-SA':'en-GB')}</Typography>
                      </Box>
                    ):'—'}
                  </TableCell>
                  <TableCell><Chip label={AR?STATUS_AR[lc.status]:lc.status} color={STATUS_COLOR[lc.status]} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell align="center">
                    <Tooltip title={AR?'التفاصيل':'View'}>
                      <IconButton size="small" onClick={()=>setViewItem(lc)} sx={{color:'#c62828'}}><Visibility sx={{fontSize:16}}/></IconButton>
                    </Tooltip>
                    {lc.financialJudgment?.hasFinancial&&!lc.financialJudgment?.purchaseOrder&&(
                      <Tooltip title={AR?'تحويل لأمر دفع':'Create Payment PO'}>
                        <IconButton size="small" onClick={()=>convertToPayment(lc._id)} sx={{color:'#e53935',ml:0.5}}><AttachMoney sx={{fontSize:16}}/></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* NEW CASE DIALOG */}
        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="md" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={800} sx={{borderBottom:'1px solid',borderColor:'divider',pb:1.5}}>
            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Box sx={{display:'flex',alignItems:'center',gap:1}}><Gavel sx={{color:'#c62828'}}/>{AR?'قضية جديدة':'New Legal Case'}</Box>
              <IconButton onClick={()=>setDialog(false)} size="small"><Close sx={{fontSize:18}}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{pt:3}}>
            {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}><TextField fullWidth size="small" label={`${AR?'عنوان القضية':'Case Title'} *`} value={form.title} onChange={set('title')} required/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'نوع القضية':'Type'} value={form.type} onChange={set('type')} select>
                {Object.entries(TYPES_AR).map(([k,v])=><MenuItem key={k} value={k}>{AR?v:k}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'موقفنا':'Our Role'} value={form.ourRole} onChange={set('ourRole')} select>
                <MenuItem value="plaintiff">{AR?'مدعي':'Plaintiff'}</MenuItem>
                <MenuItem value="defendant">{AR?'مدعى عليه':'Defendant'}</MenuItem></TextField></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'الأولوية':'Priority'} value={form.priority} onChange={set('priority')} select>
                <MenuItem value="low">{AR?'منخفضة':'Low'}</MenuItem><MenuItem value="medium">{AR?'متوسطة':'Medium'}</MenuItem>
                <MenuItem value="high">{AR?'عالية':'High'}</MenuItem><MenuItem value="critical">{AR?'حرجة':'Critical'}</MenuItem></TextField></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'الحالة':'Status'} value={form.status} onChange={set('status')} select>
                {Object.entries(STATUS_AR).map(([k,v])=><MenuItem key={k} value={k}>{AR?v:k}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">{AR?'الطرف الآخر':'Counter Party'}</Typography></Divider></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label={AR?'اسم الطرف الآخر':'Counter Party Name'} value={form['counterParty.name']} onChange={set('counterParty.name')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label={AR?'المحكمة':'Court'} value={form.court} onChange={set('court')}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'قيمة المطالبة (ر.س)':'Claim Value'} type="number" value={form.claimValue} onChange={set('claimValue')} InputProps={{endAdornment:<InputAdornment position="end">{CUR}</InputAdornment>}}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'تاريخ الرفع':'Filing Date'} type="date" value={form.filingDate} onChange={set('filingDate')} InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'الجلسة القادمة':'Next Hearing'} type="date" value={form.nextHearing} onChange={set('nextHearing')} InputLabelProps={{shrink:true}}/></Grid>
              <Grid item xs={12}><TextField fullWidth size="small" label={AR?'المحامي المعين':'Assigned Lawyer'} value={form.assignedLawyer} onChange={set('assignedLawyer')}/></Grid>
              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">{AR?'الحكم المالي (إن وجد)':'Financial Judgment (if any)'}</Typography></Divider></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'هل يوجد حكم مالي؟':'Has Financial Judgment?'} value={form['financialJudgment.hasFinancial']?'yes':'no'} onChange={e=>setForm(p=>({...p,'financialJudgment.hasFinancial':e.target.value==='yes'}))} select>
                <MenuItem value="no">{AR?'لا':'No'}</MenuItem><MenuItem value="yes">{AR?'نعم':'Yes'}</MenuItem></TextField></Grid>
              {form['financialJudgment.hasFinancial']&&<>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'المبلغ (ر.س)':'Amount'} type="number" value={form['financialJudgment.amount']} onChange={set('financialJudgment.amount')}/></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label={AR?'الاتجاه':'Direction'} value={form['financialJudgment.direction']} onChange={set('financialJudgment.direction')} select>
                  <MenuItem value="payable">{AR?'واجب الدفع (علينا)':'Payable (we owe)'}</MenuItem>
                  <MenuItem value="receivable">{AR?'مستحق القبض (لنا)':'Receivable (owed to us)'}</MenuItem></TextField></Grid>
              </>}
              <Grid item xs={12}><TextField fullWidth size="small" label={AR?'الوصف والتفاصيل':'Description'} value={form.description} onChange={set('description')} multiline rows={3}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2,borderTop:'1px solid',borderColor:'divider'}}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving?<CircularProgress size={16}/>:<Save/>} sx={{bgcolor:'#c62828'}}>
              {AR?'حفظ القضية':'Save Case'}
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
