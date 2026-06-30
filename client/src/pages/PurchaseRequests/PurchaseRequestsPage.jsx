import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Alert, CircularProgress, Snackbar, InputAdornment, Tooltip,
  Avatar, Divider, MenuItem, Badge, Stepper, Step, StepLabel
} from '@mui/material';
import { Add, Refresh, Visibility, Check, Close, Send,
  Warning, ShoppingCart, Description, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import FileUploader from '../../components/FileUploader';

const STATUS_COLOR = {
  draft:'default', submitted:'info', manager_review:'warning',
  director_review:'warning', procurement_review:'primary',
  approved:'success', rejected:'error', converted:'success'
};
const STATUS_AR = {
  draft:'مسودة', submitted:'مُرسل للاعتماد', manager_review:'مع المدير',
  director_review:'مع المدير العام', procurement_review:'مع المشتريات',
  approved:'معتمد', rejected:'مرفوض', converted:'تحول لأمر شراء'
};
const URGENCY_COLOR = { normal:'default', urgent:'warning', critical:'error' };

export default function PurchaseRequestsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [items,    setItems]    = useState([]);
  const [employees,setEmployees]= useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [dialog,   setDialog]   = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [error,    setError]    = useState('');
  const [snack,    setSnack]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');

  const [form, setForm] = useState({
    urgency: 'normal', neededBy:'', project:'', notes:'',
    items: [{ description:'', quantity:1, unit:'', estimatedPrice:0 }]
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prR, empR, projR] = await Promise.all([
        api.get('/api/purchase-requests'),
        api.get('/api/employees').catch(()=>({data:{data:[]}})),
        api.get('/api/projects').catch(()=>({data:{data:[]}})),
      ]);
      if (prR.data.success)   setItems(prR.data.data||[]);
      if (empR.data.success)  setEmployees(empR.data.data||[]);
      if (projR.data.success) setProjects(projR.data.data||[]);
    } catch(e){ setError(e.response?.data?.message||t('common.error')); }
    finally{ setLoading(false); }
  }, [t]);

  useEffect(()=>{ load(); },[load]);

  const addItem    = () => setForm(p=>({...p, items:[...p.items,{description:'',quantity:1,unit:'',estimatedPrice:0}]}));
  const removeItem = i  => setForm(p=>({...p, items:p.items.filter((_,idx)=>idx!==i)}));
  const setItemF   = (i,k,v) => setForm(p=>({...p, items:p.items.map((it,idx)=>idx===i?{...it,[k]:v}:it)}));

  const estimatedTotal = form.items.reduce((s,i)=>(+(i.quantity||0))*(+(i.estimatedPrice||0))+s, 0);

  const handleSubmit = async (submitForApproval=false) => {
    if (!form.items[0]?.description) { setError(AR?'أضف بنداً واحداً على الأقل':'Add at least one item'); return; }
    setSaving(true); setError('');
    try {
      const pr = await api.post('/api/purchase-requests', {
        ...form,
        status: submitForApproval ? 'submitted' : 'draft',
        items: form.items.filter(i=>i.description),
      });
      if (submitForApproval && pr.data.success) {
        await api.put(`/api/purchase-requests/${pr.data.data._id}/submit`);
      }
      setSnack(submitForApproval ? (AR?'تم الإرسال للاعتماد':'Submitted for approval') : (AR?'تم الحفظ كمسودة':'Saved as draft'));
      setDialog(false);
      setForm({ urgency:'normal', neededBy:'', project:'', notes:'', items:[{description:'',quantity:1,unit:'',estimatedPrice:0}] });
      load();
    } catch(e){ setError(e.response?.data?.message||t('common.error')); }
    finally{ setSaving(false); }
  };

  const handleApprove = async (id, action) => {
    const comment = action==='reject' ? prompt(AR?'سبب الرفض:':'Rejection reason:') : '';
    try {
      await api.put(`/api/purchase-requests/${id}/approve`, { action, comment });
      setSnack(action==='approve'?(AR?'تم الاعتماد':'Approved'):(AR?'تم الرفض':'Rejected'));
      setViewItem(null); load();
    } catch(e){ setSnack(e.response?.data?.message||t('common.error')); }
  };

  const fmt = n => (+n||0).toLocaleString();
  const CUR = AR?'ر.س':'SAR';

  const filtered = items.filter(i => {
    if(!search) return true;
    const q = search.toLowerCase();
    return i.prNumber?.toLowerCase().includes(q) ||
           i.requestedBy?.name?.toLowerCase().includes(q) ||
           i.department?.toLowerCase().includes(q);
  });

  const APPROVAL_STEPS = ['مقدم الطلب','المدير المباشر','المدير العام','المشتريات'];
  const stepMap = { draft:0, submitted:1, manager_review:1, director_review:2, procurement_review:3, approved:3, rejected:1 };

  return (
    <Layout>
      <Box sx={{p:3}}>
        {/* Header */}
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <Description sx={{fontSize:32,color:'#1a73e8'}}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'طلبات الشراء (PR)':'Purchase Requests (PR)'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'طلب':'requests'} · {items.filter(i=>['submitted','manager_review','director_review','procurement_review'].includes(i.status)).length} {AR?'قيد الاعتماد':'pending approval'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{display:'flex',gap:1}}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>setDialog(true)}
              sx={{bgcolor:'#1a73e8',borderRadius:2}}>
              {AR?'+ طلب شراء جديد':'+ New PR'}
            </Button>
          </Box>
        </Box>

        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={AR?'بحث...':'Search...'}
          value={search} onChange={e=>setSearch(e.target.value)} sx={{mb:2,width:300}}
          InputProps={{startAdornment:<InputAdornment position="start"><Search sx={{fontSize:18}}/></InputAdornment>}}/>

        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table>
            <TableHead>
              <TableRow sx={{bgcolor:'#f8f9fa'}}>
                <TableCell sx={{fontWeight:700}}>{AR?'رقم الطلب':'PR#'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'مقدم الطلب':'Requested By'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'القسم':'Dept'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الأولوية':'Urgency'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'المبلغ التقديري':'Est. Total'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell align="center" sx={{fontWeight:700}}>—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={7} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :filtered.length===0?<TableRow><TableCell colSpan={7} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد طلبات':'No requests found'}</TableCell></TableRow>
              :filtered.map(pr=>(
                <TableRow key={pr._id} hover>
                  <TableCell><Typography variant="body2" fontWeight={700} color="#1a73e8" sx={{fontFamily:'monospace'}}>{pr.prNumber}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                      <Avatar sx={{width:28,height:28,bgcolor:'#1a73e820',color:'#1a73e8',fontSize:12,fontWeight:700}}>{pr.requestedBy?.name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{pr.requestedBy?.name||'—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{pr.requestedBy?.position}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{pr.department||pr.requestedBy?.department||'—'}</Typography></TableCell>
                  <TableCell><Chip label={pr.urgency==='critical'?(AR?'عاجل جداً':'Critical'):pr.urgency==='urgent'?(AR?'عاجل':'Urgent'):(AR?'عادي':'Normal')} color={URGENCY_COLOR[pr.urgency]} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700}>{fmt(pr.estimatedTotal)} {CUR}</Typography></TableCell>
                  <TableCell><Chip label={AR?STATUS_AR[pr.status]:pr.status} color={STATUS_COLOR[pr.status]||'default'} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                  <TableCell align="center">
                    <Tooltip title={AR?'التفاصيل':'View'}>
                      <IconButton size="small" onClick={()=>setViewItem(pr)} sx={{color:'#1a73e8'}}><Visibility sx={{fontSize:16}}/></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── NEW PR DIALOG ── */}
        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="md" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={800} sx={{borderBottom:'1px solid',borderColor:'divider',pb:1.5}}>
            <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                <Description sx={{color:'#1a73e8'}}/>
                {AR?'طلب شراء جديد (PR)':'New Purchase Request (PR)'}
              </Box>
              <IconButton onClick={()=>setDialog(false)} size="small"><Close sx={{fontSize:18}}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{pt:3}}>
            {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

            {/* Workflow steps */}
            <Box sx={{mb:3,p:2,bgcolor:'#f0f5ff',borderRadius:2}}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{mb:1}}>
                {AR?'مسار الاعتماد: طلب → مدير مباشر → مدير عام → مشتريات → PO':'Approval: Requester → Manager → Director → Procurement → PO'}
              </Typography>
              <Stepper activeStep={0} alternativeLabel>
                {APPROVAL_STEPS.map((l,i)=><Step key={i}><StepLabel sx={{'& .MuiStepLabel-label':{fontSize:'0.65rem'}}}>{l}</StepLabel></Step>)}
              </Stepper>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label={AR?'المشروع المرتبط (اختياري)':'Linked Project'} value={form.project} onChange={e=>setForm(p=>({...p,project:e.target.value}))} select>
                  <MenuItem value=""><em>{AR?'بدون مشروع':'No project'}</em></MenuItem>
                  {projects.map(pr=><MenuItem key={pr._id} value={pr._id}>{pr.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label={AR?'الأولوية':'Urgency'} value={form.urgency} onChange={e=>setForm(p=>({...p,urgency:e.target.value}))} select>
                  <MenuItem value="normal">{AR?'عادي':'Normal'}</MenuItem>
                  <MenuItem value="urgent">{AR?'عاجل':'Urgent'}</MenuItem>
                  <MenuItem value="critical">{AR?'عاجل جداً':'Critical'}</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label={AR?'مطلوب بتاريخ':'Needed By'} type="date" value={form.neededBy} onChange={e=>setForm(p=>({...p,neededBy:e.target.value}))} InputLabelProps={{shrink:true}}/>
              </Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">{AR?'البنود المطلوبة':'Items Required'}</Typography></Divider></Grid>

              {/* Items */}
              <Grid item xs={12}>
                <Box sx={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr 1.5fr 36px',gap:1,px:0.5,mb:0.5}}>
                  {[AR?'الوصف':'Description',AR?'الكمية':'Qty',AR?'الوحدة':'Unit',AR?'السعر التقديري':'Est. Price',''].map((h,i)=>(
                    <Typography key={i} variant="caption" color="text.secondary" fontWeight={700}>{h}</Typography>
                  ))}
                </Box>
                {form.items.map((it,idx)=>(
                  <Box key={idx} sx={{display:'grid',gridTemplateColumns:'3fr 1fr 1fr 1.5fr 36px',gap:1,mb:1,alignItems:'center'}}>
                    <TextField size="small" placeholder={AR?'وصف المنتج أو الخدمة':'Description'} value={it.description} onChange={e=>setItemF(idx,'description',e.target.value)}/>
                    <TextField size="small" type="number" value={it.quantity} onChange={e=>setItemF(idx,'quantity',+e.target.value)} inputProps={{min:1}}/>
                    <TextField size="small" placeholder={AR?'قطعة':'pcs'} value={it.unit} onChange={e=>setItemF(idx,'unit',e.target.value)}/>
                    <TextField size="small" type="number" value={it.estimatedPrice} onChange={e=>setItemF(idx,'estimatedPrice',+e.target.value)} InputProps={{endAdornment:<InputAdornment position="end" sx={{fontSize:'0.65rem'}}>{CUR}</InputAdornment>}}/>
                    <IconButton size="small" onClick={()=>removeItem(idx)} disabled={form.items.length===1} sx={{color:'#e53935',mt:0.5}}>
                      <Close sx={{fontSize:14}}/>
                    </IconButton>
                  </Box>
                ))}
                <Button size="small" onClick={addItem} sx={{color:'#1a73e8',mt:0.5}}>+ {AR?'بند جديد':'Add Item'}</Button>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{p:1.5,bgcolor:'#f8f9fa',borderRadius:2,textAlign:'right'}}>
                  <Typography fontWeight={800} color="#1a73e8">{AR?'الإجمالي التقديري:':'Estimated Total:'} {fmt(estimatedTotal)} {CUR}</Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth size="small" label={AR?'ملاحظات وسبب الطلب':'Notes & Reason'} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} multiline rows={2}/>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2,borderTop:'1px solid',borderColor:'divider',gap:1}}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="outlined" onClick={()=>handleSubmit(false)} disabled={saving}>
              {AR?'حفظ كمسودة':'Save Draft'}
            </Button>
            <Button variant="contained" onClick={()=>handleSubmit(true)} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Send/>}>
              {AR?'إرسال للاعتماد':'Submit for Approval'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── VIEW/APPROVE DIALOG ── */}
        {viewItem && (
          <Dialog open maxWidth="sm" fullWidth onClose={()=>setViewItem(null)} PaperProps={{sx:{borderRadius:3}}}>
            <DialogTitle fontWeight={800} sx={{borderBottom:'1px solid',borderColor:'divider',pb:1.5}}>
              <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <Box>
                  <Typography fontWeight={800}>{viewItem.prNumber}</Typography>
                  <Chip label={AR?STATUS_AR[viewItem.status]:viewItem.status} color={STATUS_COLOR[viewItem.status]} size="small" sx={{mt:0.5}}/>
                </Box>
                <IconButton onClick={()=>setViewItem(null)} size="small"><Close sx={{fontSize:18}}/></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{pt:2}}>
              {/* Approval chain */}
              <Paper variant="outlined" sx={{p:1.5,mb:2,borderRadius:2}}>
                <Typography variant="caption" fontWeight={700} display="block" sx={{mb:1}}>{AR?'مسار الاعتماد:':'Approval Chain:'}</Typography>
                {(viewItem.approvalChain||[]).map((step,i)=>(
                  <Box key={i} sx={{display:'flex',alignItems:'center',gap:1,mb:0.5}}>
                    <Chip label={step.role==='manager'?(AR?'مدير':'Manager'):step.role==='director'?(AR?'مدير عام':'Director'):(AR?'مشتريات':'Procurement')} size="small" sx={{fontSize:'0.65rem'}}/>
                    <Typography variant="caption">{step.approver?.name||AR?'تلقائي':'Auto'}</Typography>
                    <Chip label={step.status==='approved'?(AR?'معتمد':'Approved'):step.status==='rejected'?(AR?'مرفوض':'Rejected'):(AR?'معلق':'Pending')} size="small" color={step.status==='approved'?'success':step.status==='rejected'?'error':'default'}/>
                    {step.comment&&<Typography variant="caption" color="text.secondary">— {step.comment}</Typography>}
                  </Box>
                ))}
              </Paper>

              {/* Items */}
              <Typography variant="subtitle2" fontWeight={700} sx={{mb:1}}>{AR?'البنود:':'Items:'}</Typography>
              {(viewItem.items||[]).map((it,i)=>(
                <Box key={i} sx={{display:'flex',justifyContent:'space-between',py:0.8,borderBottom:'1px solid #f0f0f0'}}>
                  <Typography variant="body2">{it.description}</Typography>
                  <Typography variant="body2" fontWeight={600}>{it.quantity} {it.unit} × {fmt(it.estimatedPrice)} = {fmt(it.quantity*it.estimatedPrice)} {CUR}</Typography>
                </Box>
              ))}
              <Box sx={{p:1.5,bgcolor:'#f8f9fa',borderRadius:2,mt:1,display:'flex',justifyContent:'space-between'}}>
                <Typography fontWeight={800}>{AR?'الإجمالي:':'Total:'}</Typography>
                <Typography fontWeight={800} color="#1a73e8">{fmt(viewItem.estimatedTotal)} {CUR}</Typography>
              </Box>
              {/* ── المرفقات (BOQ، عرض سعر) ── */}
              <FileUploader
                uploadUrl={`/api/purchase-requests/${viewItem._id}/documents`}
                existingFiles={viewItem.attachments || []}
                onChange={(updated) => setViewItem(p => ({ ...p, attachments: updated }))}
                docTypeOptions={[
                  { value:'boq',       label:'BOQ',       labelAr:'جدول كميات' },
                  { value:'quotation', label:'Quotation', labelAr:'عرض سعر' },
                  { value:'invoice',   label:'Invoice',   labelAr:'فاتورة' },
                  { value:'other',     label:'Other',     labelAr:'أخرى' },
                ]}
                label={AR?'المرفقات':'Attachments'}
              />
              {viewItem.notes&&<Box sx={{mt:1.5,p:1.5,bgcolor:'#f5f5f5',borderRadius:2}}><Typography variant="caption" color="text.secondary">{AR?'ملاحظات:':'Notes:'} </Typography><Typography variant="body2">{viewItem.notes}</Typography></Box>}
            </DialogContent>
            <DialogActions sx={{px:3,py:2,borderTop:'1px solid',borderColor:'divider'}}>
              <Button onClick={()=>setViewItem(null)}>{AR?'إغلاق':'Close'}</Button>
              {['submitted','manager_review','director_review','procurement_review'].includes(viewItem.status) && (
                <>
                  <Button color="error" variant="outlined" startIcon={<Close/>} onClick={()=>handleApprove(viewItem._id,'reject')}>{AR?'رفض':'Reject'}</Button>
                  <Button color="success" variant="contained" startIcon={<Check/>} onClick={()=>handleApprove(viewItem._id,'approve')}>{AR?'اعتماد':'Approve'}</Button>
                </>
              )}
              {viewItem.status==='approved' && (
                <Button variant="contained" startIcon={<ShoppingCart/>} onClick={()=>window.location.href='/purchase-orders'}
                  sx={{bgcolor:'#f57c00'}}>
                  {AR?'تحويل لأمر شراء':'Convert to PO'}
                </Button>
              )}
            </DialogActions>
          </Dialog>
        )}

        <Snackbar open={!!snack} autoHideDuration={3500} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
