import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Chip, CircularProgress, Snackbar,
  Alert, TextField, InputAdornment, Tooltip, Avatar, MenuItem, Divider,
  Tab, Tabs, Switch, FormControlLabel, Autocomplete
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, People, Close, Save,
  AccountTree, Visibility, VisibilityOff, Email, Lock, Badge
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import FileUploader from '../../components/FileUploader';

const EMPTY = {
  name:'', nameEn:'', email:'', phone:'', nationalId:'',
  position:'', positionEn:'', department:'', departmentRef:'', grade:'', employeeType:'full_time',
  nationality:'سعودي', gender:'',
  salary:0, housingAllowance:0, transportAllowance:0, otherAllowances:0,
  hireDate:'', contractEnd:'', contractType:'unlimited', status:'active',
  manager:'', director:'',
  iqama:'', iqamaExpiry:'', passportNumber:'', passportExpiry:'',
  bankName:'', bankIBAN:'',
  canApprovePR:false, prApprovalLimit:0, approvalLevel:'none',
  notes:'',
  // Login credentials
  createLogin:false, loginEmail:'', loginPassword:'', systemRole:'employee',
};

const EMP_TYPES = [{value:'full_time',labelAr:'دوام كامل',label:'Full Time'},{value:'part_time',labelAr:'دوام جزئي',label:'Part Time'},{value:'contract',labelAr:'عقد',label:'Contract'},{value:'intern',labelAr:'متدرب',label:'Intern'},{value:'consultant',labelAr:'مستشار',label:'Consultant'}];
const GENDERS   = [{value:'male',labelAr:'ذكر',label:'Male'},{value:'female',labelAr:'أنثى',label:'Female'}];
const CONTRACTS = [{value:'unlimited',labelAr:'غير محدد المدة',label:'Unlimited'},{value:'limited',labelAr:'محدد المدة',label:'Limited'},{value:'project',labelAr:'مشروع',label:'Project'}];
const APPROVAL_LEVELS = [{value:'none',labelAr:'لا يعتمد',label:'No Approval'},{value:'manager',labelAr:'مدير',label:'Manager'},{value:'director',labelAr:'مدير عام',label:'Director'},{value:'cfo',labelAr:'CFO',label:'CFO'},{value:'ceo',labelAr:'CEO',label:'CEO'}];
const SYS_ROLES = [{value:'employee',labelAr:'موظف',label:'Employee'},{value:'user',labelAr:'مستخدم',label:'User'},{value:'manager',labelAr:'مشرف',label:'Manager'},{value:'admin',labelAr:'مدير',label:'Admin'}];
const STATUS_COLOR = { active:'success', inactive:'default', on_leave:'warning', terminated:'error' };
const STATUS_AR = { active:'نشط', inactive:'غير نشط', on_leave:'إجازة', terminated:'منتهي الخدمة' };

export default function EmployeesPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [items,   setItems]   = useState([]);
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [tab,     setTab]     = useState(0);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [seeding, setSeeding] = useState(false);
  const [accountsDialog, setAccountsDialog] = useState(null); // shows generated logins after seeding
  const [snack,   setSnack]   = useState('');
  const [delId,   setDelId]   = useState(null);
  const [showPw,  setShowPw]  = useState(false);
  const [departmentList, setDepartmentList] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empR, rolesR, deptR] = await Promise.all([
        api.get('/api/employees'),
        api.get('/api/roles').catch(()=>({data:{data:[]}})),
        api.get('/api/departments').catch(()=>({data:{data:[]}})),
      ]);
      if (empR.data.success)   setItems(empR.data.data || []);
      if (rolesR.data.success) setRoles(rolesR.data.data || []);
      if (deptR.data.success)  setDepartmentList(deptR.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleSeedSector = async (force=false) => {
    setSeeding(true); setError('');
    try {
      const r = await api.post(`/api/employees/seed-sector${force?'?force=true':''}`);
      if (r.data.success) {
        setAccountsDialog({ accounts: r.data.accounts||[], domain: r.data.domain, password: r.data.defaultPassword, count: r.data.count });
        setSnack(r.data.message);
        load();
      }
    } catch (e) {
      const msg = e.response?.data?.message || (AR?'فشل التوليد':'Generation failed');
      if (msg.includes('يوجد بالفعل') && window.confirm(msg + (AR?'\n\nهل تريد المتابعة؟':'\n\nContinue anyway?'))) {
        return handleSeedSector(true);
      }
      setError(msg);
    } finally { setSeeding(false); }
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setBool = k => e => setForm(p => ({ ...p, [k]: e.target.checked }));

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setError(''); setTab(0); setDialog(true); };
  const openEdit = emp => {
    setForm({
      ...EMPTY, ...emp,
      manager:  emp.manager?._id || emp.manager || '',
      director: emp.director?._id || emp.director || '',
      createLogin: false, loginEmail: emp.email||'', loginPassword:'', systemRole:'employee',
    });
    setEditId(emp._id); setError(''); setTab(0); setDialog(true);
  };
  const close = () => { setDialog(false); setError(''); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError(AR?'الاسم مطلوب':'Name required'); return; }
    if (form.createLogin && !form.email) { setError(AR?'البريد الإلكتروني مطلوب لإنشاء حساب دخول':'Email required to create login'); return; }
    if (form.createLogin && (!form.loginPassword || form.loginPassword.length < 6)) {
      setError(AR?'كلمة المرور 6 أحرف على الأقل':'Password must be at least 6 characters'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      // Remove empty fields
      if (!payload.manager)   delete payload.manager;
      if (!payload.director)  delete payload.director;
      if (!payload.hireDate)  delete payload.hireDate;
      if (!payload.contractEnd) delete payload.contractEnd;
      if (!payload.customRole) delete payload.customRole;
      if (!payload.departmentRef) delete payload.departmentRef; // تجنّب CastError على ObjectId فارغ
      delete payload.loginEmail; delete payload.systemRole;

      let res;
      if (editId) {
        res = await api.put(`/api/employees/${editId}`, payload);
      } else {
        res = await api.post('/api/employees', payload);
      }

      const loginMsg = res.data.loginCreated ? ` — ${res.data.message}` : '';
      setSnack((editId ? (AR?'تم التحديث':'Updated') : (AR?'تم إضافة الموظف':'Employee added')) + loginMsg);
      close(); load();
    } catch (e) { setError(e.response?.data?.detail || e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/employees/${delId}`);
      setSnack(AR?'تم الحذف':'Deleted'); setDelId(null); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  // Departments from existing employees

  const filtered = items.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.name?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q) ||
           e.department?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) ||
           e.employeeId?.toLowerCase().includes(q);
  });

  const FORM_TABS = [AR?'البيانات الأساسية':'Basic Info', AR?'التنظيم':'Organization', AR?'الراتب':'Salary', AR?'الوثائق':'Documents', AR?'الصلاحيات':'Permissions'];

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <People sx={{ fontSize:32, color:'#1565c0' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'الموظفون':'Employees'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'موظف':'employees'} · {items.filter(e=>e.status==='active').length} {AR?'نشط':'active'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="outlined" onClick={()=>handleSeedSector(false)} disabled={seeding}
              startIcon={seeding?<CircularProgress size={16}/>:<Badge/>}
              sx={{ borderRadius:2 }}>
              {AR?'توليد فريق مقترح':'Generate Suggested Team'}
            </Button>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:'#1565c0', '&:hover':{bgcolor:'#0d47a1'}, borderRadius:2 }}>
              {AR?'+ موظف جديد':'+ New Employee'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small"
          placeholder={AR?'بحث بالاسم أو المسمى أو القسم...':'Search by name, position, department...'}
          value={search} onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:380 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18 }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الموظف':'ID'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الموظف':'Employee'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المسمى الوظيفي':'Position'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'القسم':'Department'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المدير المباشر':'Manager'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الراتب':'Salary'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'حساب الدخول':'Login'}</TableCell>
                <TableCell align="center" sx={{ fontWeight:700 }}>—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py:5 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py:6 }}>
                  <Typography color="text.secondary" sx={{ mb:1.5 }}>
                    {AR?'لا يوجد موظفون بعد':'No employees yet'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb:2 }}>
                    {AR?'يمكنك توليد فريق مقترح بمسميات وظيفية وحسابات دخول جاهزة حسب نشاط شركتك':'Generate a suggested team with job titles and login accounts based on your business sector'}
                  </Typography>
                  <Button variant="contained" onClick={()=>handleSeedSector(false)} disabled={seeding}
                    startIcon={seeding?<CircularProgress size={16}/>:<Badge/>}>
                    {AR?'توليد فريق مقترح الآن':'Generate Suggested Team Now'}
                  </Button>
                </TableCell></TableRow>
              ) : filtered.map(emp => (
                <TableRow key={emp._id} hover>
                  <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace', color:'#1565c0', fontWeight:700 }}>{emp.employeeId}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Avatar sx={{ width:32, height:32, bgcolor:'#1565c020', color:'#1565c0', fontSize:13, fontWeight:700 }}>{emp.name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{emp.name}</Typography>
                        {emp.email && <Typography variant="caption" color="text.secondary">{emp.email}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{emp.position||'—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{emp.department||'—'}</Typography></TableCell>
                  <TableCell>
                    {emp.manager ? (
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                        <Avatar sx={{ width:20, height:20, bgcolor:'#e3f2fd', color:'#1565c0', fontSize:10 }}>{emp.manager?.name?.[0]||'?'}</Avatar>
                        <Typography variant="caption">{emp.manager?.name||'—'}</Typography>
                      </Box>
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{(+(emp.salary||0)).toLocaleString()} {AR?'ر.س':'SAR'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={AR?STATUS_AR[emp.status]:emp.status} color={STATUS_COLOR[emp.status]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
                  </TableCell>
                  <TableCell>
                    {emp.user ? (
                      <Tooltip title={emp.user.email}>
                        <Chip
                          label={emp.user.isOnline ? (AR?'متصل الآن':'Online') : (AR?'له حساب':'Has login')}
                          color={emp.user.isOnline?'success':'info'} size="small"
                          icon={<Email sx={{ fontSize:'14px!important' }}/>}
                          sx={{ fontSize:'0.65rem' }}/>
                      </Tooltip>
                    ) : (
                      <Chip label={AR?'بدون حساب':'No login'} size="small" variant="outlined" sx={{ fontSize:'0.65rem', color:'text.disabled' }}/>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={()=>openEdit(emp)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" onClick={()=>setDelId(emp._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── ADD/EDIT DIALOG ── */}
        <Dialog open={dialog} onClose={close} maxWidth="md" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Badge sx={{ color:'#1565c0' }}/>
                {editId ? (AR?'تعديل بيانات الموظف':'Edit Employee') : (AR?'موظف جديد':'New Employee')}
                {form.name && <Chip label={form.name} size="small" sx={{ ml:1 }}/>}
              </Box>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>

          {/* Tabs */}
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ px:3, borderBottom:'1px solid', borderColor:'divider',
            '& .Mui-selected':{color:'#1565c0'},'& .MuiTabs-indicator':{bgcolor:'#1565c0'} }}>
            {FORM_TABS.map((l,i)=><Tab key={i} label={l} sx={{ fontSize:'0.78rem', fontWeight:600, minWidth:80 }}/>)}
          </Tabs>

          <DialogContent sx={{ pt:2.5, minHeight:360 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

            {/* TAB 0: BASIC INFO */}
            {tab===0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={`${AR?'الاسم الكامل':'Full Name'} *`} value={form.name} onChange={set('name')} required/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Full Name (English)" value={form.nameEn||''} onChange={set('nameEn')}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label={AR?'الجنس':'Gender'} value={form.gender||''} onChange={set('gender')} select>
                    <MenuItem value=""><em>—</em></MenuItem>
                    {GENDERS.map(g=><MenuItem key={g.value} value={g.value}>{AR?g.labelAr:g.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label={AR?'الجنسية':'Nationality'} value={form.nationality||''} onChange={set('nationality')}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label={AR?'رقم الهوية / الإقامة':'National ID / Iqama'} value={form.nationalId||''} onChange={set('nationalId')}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'البريد الإلكتروني':'Email'} type="email" value={form.email||''} onChange={set('email')}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'رقم الهاتف':'Phone'} value={form.phone||''} onChange={set('phone')}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label={AR?'نوع العمل':'Employment Type'} value={form.employeeType} onChange={set('employeeType')} select>
                    {EMP_TYPES.map(t=><MenuItem key={t.value} value={t.value}>{AR?t.labelAr:t.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label={AR?'تاريخ التوظيف':'Hire Date'} type="date" value={form.hireDate||''} onChange={set('hireDate')} InputLabelProps={{shrink:true}}/>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label={AR?'الحالة':'Status'} value={form.status} onChange={set('status')} select>
                    {Object.entries(STATUS_AR).map(([k,v])=><MenuItem key={k} value={k}>{AR?v:k}</MenuItem>)}
                  </TextField>
                </Grid>

                {/* Internal Login Section */}
                <Grid item xs={12}>
                  <Divider><Typography variant="caption" fontWeight={700} color="#1565c0">
                    🔐 {AR?'حساب الدخول الداخلي':'Internal Login Account'}
                  </Typography></Divider>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={form.createLogin} onChange={setBool('createLogin')} color="primary"/>}
                    label={<Typography variant="body2" fontWeight={600}>{AR?'إنشاء حساب دخول لهذا الموظف':'Create login account for this employee'}</Typography>}
                  />
                </Grid>
                {form.createLogin && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label={AR?'الدور في النظام':'System Role'} value={form.systemRole||'employee'} onChange={set('systemRole')} select>
                        {SYS_ROLES.map(r=><MenuItem key={r.value} value={r.value}>{AR?r.labelAr:r.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label={AR?'البريد الإلكتروني للدخول *':'Login Email *'} type="email"
                        value={form.email||''} onChange={set('email')}
                        helperText={AR?'نفس بريد الموظف — يُستخدم للدخول':'Same as employee email — used for login'}
                        InputProps={{ startAdornment:<InputAdornment position="start"><Email sx={{ fontSize:16 }}/></InputAdornment> }}/>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label={AR?'كلمة المرور *':'Password *'} type={showPw?'text':'password'}
                        value={form.loginPassword||''} onChange={set('loginPassword')}
                        InputProps={{
                          startAdornment:<InputAdornment position="start"><Lock sx={{ fontSize:16 }}/></InputAdornment>,
                          endAdornment:<InputAdornment position="end">
                            <IconButton size="small" onClick={()=>setShowPw(v=>!v)}>
                              {showPw?<Visibility sx={{ fontSize:16 }}/>:<VisibilityOff sx={{ fontSize:16 }}/>}
                            </IconButton>
                          </InputAdornment>
                        }}/>
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ borderRadius:2, fontSize:'0.8rem' }}>
                        {AR?'سيتمكن الموظف من الدخول بهذا البريد وكلمة المرور. يمكنك تعيين دور مخصص له لاحقاً من قسم المستخدمين.':'Employee will be able to log in with this email and password. You can assign a custom role later from the Users section.'}
                      </Alert>
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {/* TAB 1: ORGANIZATION */}
            {tab===1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'المسمى الوظيفي (عربي)':'Job Title (Arabic)'} value={form.position||''} onChange={set('position')}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Job Title (English)" value={form.positionEn||''} onChange={set('positionEn')}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label={AR?'القسم / الإدارة':'Department'}
                    value={form.departmentRef || ''}
                    onChange={e => {
                      const deptId = e.target.value;
                      const dept = departmentList.find(d => d._id === deptId);
                      setForm(p => ({ ...p, departmentRef: deptId, department: dept ? (AR ? dept.name : (dept.nameEn || dept.name)) : '' }));
                    }}>
                    <MenuItem value="">{AR ? 'بدون قسم' : 'No department'}</MenuItem>
                    {departmentList.map(d => (
                      <MenuItem key={d._id} value={d._id}>{AR ? d.name : (d.nameEn || d.name)}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label={AR?'المستوى الوظيفي':'Grade/Level'} value={form.grade||''} onChange={set('grade')}/>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label={AR?'نوع العقد':'Contract Type'} value={form.contractType} onChange={set('contractType')} select>
                    {CONTRACTS.map(c=><MenuItem key={c.value} value={c.value}>{AR?c.labelAr:c.label}</MenuItem>)}
                  </TextField>
                </Grid>
                {form.contractType==='limited'&&(
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label={AR?'تاريخ انتهاء العقد':'Contract End Date'} type="date" value={form.contractEnd||''} onChange={set('contractEnd')} InputLabelProps={{shrink:true}}/>
                  </Grid>
                )}

                <Grid item xs={12}><Divider><Typography variant="caption">{AR?'الهيكل التنظيمي':'Org Chart'}</Typography></Divider></Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'المدير المباشر':'Direct Manager'} value={form.manager||''} onChange={set('manager')} select>
                    <MenuItem value=""><em>{AR?'لا يوجد':'None'}</em></MenuItem>
                    {items.filter(e=>e._id!==editId).map(e=>(
                      <MenuItem key={e._id} value={e._id}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                          <Avatar sx={{ width:24, height:24, fontSize:10, bgcolor:'#1565c020', color:'#1565c0' }}>{e.name?.[0]}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{e.position}</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'المدير العام / الديركتور':'Director / General Manager'} value={form.director||''} onChange={set('director')} select>
                    <MenuItem value=""><em>{AR?'لا يوجد':'None'}</em></MenuItem>
                    {items.filter(e=>e._id!==editId).map(e=>(
                      <MenuItem key={e._id} value={e._id}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                          <Avatar sx={{ width:24, height:24, fontSize:10, bgcolor:'#7b1fa220', color:'#7b1fa2' }}>{e.name?.[0]}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{e.position}</Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'الدور المخصص (من الأدوار)':'Custom Role'} value={form.customRole||''} onChange={set('customRole')} select>
                    <MenuItem value=""><em>{AR?'بدون دور مخصص':'No custom role'}</em></MenuItem>
                    {roles.map(r=><MenuItem key={r._id} value={r._id}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <Typography>{r.icon||'👔'}</Typography>
                        <Typography variant="body2">{r.name}</Typography>
                      </Box>
                    </MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            )}

            {/* TAB 2: SALARY */}
            {tab===2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'الراتب الأساسي (ر.س)':'Basic Salary'} type="number" value={form.salary||0} onChange={set('salary')} InputProps={{ endAdornment:<InputAdornment position="end">{AR?'ر.س':'SAR'}</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'بدل السكن':'Housing Allowance'} type="number" value={form.housingAllowance||0} onChange={set('housingAllowance')} InputProps={{ endAdornment:<InputAdornment position="end">{AR?'ر.س':'SAR'}</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'بدل النقل':'Transport Allowance'} type="number" value={form.transportAllowance||0} onChange={set('transportAllowance')} InputProps={{ endAdornment:<InputAdornment position="end">{AR?'ر.س':'SAR'}</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'بدلات أخرى':'Other Allowances'} type="number" value={form.otherAllowances||0} onChange={set('otherAllowances')} InputProps={{ endAdornment:<InputAdornment position="end">{AR?'ر.س':'SAR'}</InputAdornment> }}/>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p:2, bgcolor:'#e3f2fd', borderRadius:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <Typography fontWeight={700}>{AR?'إجمالي الراتب الشهري:':'Total Monthly Package:'}</Typography>
                    <Typography variant="h6" fontWeight={800} color="#1565c0">
                      {((+form.salary||0)+(+form.housingAllowance||0)+(+form.transportAllowance||0)+(+form.otherAllowances||0)).toLocaleString()} {AR?'ر.س':'SAR'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}><Divider><Typography variant="caption">{AR?'البنك':'Bank'}</Typography></Divider></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'اسم البنك':'Bank Name'} value={form.bankName||''} onChange={set('bankName')}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="IBAN" value={form.bankIBAN||''} onChange={set('bankIBAN')} inputProps={{ dir:'ltr' }}
                    InputProps={{ startAdornment:<InputAdornment position="start">SA</InputAdornment> }}/>
                </Grid>
              </Grid>
            )}

            {/* TAB 3: DOCUMENTS */}
            {tab===3 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'رقم الإقامة':'Iqama Number'} value={form.iqama||''} onChange={set('iqama')} inputProps={{ dir:'ltr' }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'تاريخ انتهاء الإقامة':'Iqama Expiry'} type="date" value={form.iqamaExpiry||''} onChange={set('iqamaExpiry')} InputLabelProps={{shrink:true}}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'رقم الجواز':'Passport Number'} value={form.passportNumber||''} onChange={set('passportNumber')} inputProps={{ dir:'ltr' }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'تاريخ انتهاء الجواز':'Passport Expiry'} type="date" value={form.passportExpiry||''} onChange={set('passportExpiry')} InputLabelProps={{shrink:true}}/>
                </Grid>
                <Grid item xs={12}>
                  {editId ? (
                    <FileUploader
                      uploadUrl={`/api/employees/${editId}/documents`}
                      deleteUrlBuilder={(fileId) => `/api/employees/${editId}/documents/${fileId}`}
                      existingFiles={(form.documents || []).map(d => ({ ...d, fileId: d.fileId || d.url?.split('/').pop() }))}
                      onChange={(updated) => setForm(p => ({ ...p, documents: updated }))}
                      docTypeOptions={[
                        { value:'national_id', label:'National ID', labelAr:'الهوية الوطنية' },
                        { value:'iqama',       label:'Iqama',       labelAr:'الإقامة' },
                        { value:'passport',    label:'Passport',    labelAr:'جواز السفر' },
                        { value:'contract',    label:'Contract',    labelAr:'عقد العمل' },
                        { value:'certificate', label:'Certificate', labelAr:'شهادة' },
                        { value:'cv',          label:'CV',          labelAr:'السيرة الذاتية' },
                        { value:'photo',       label:'Photo',       labelAr:'صورة شخصية' },
                        { value:'other',       label:'Other',       labelAr:'أخرى' },
                      ]}
                      label={AR?'مستندات الموظف':'Employee Documents'}
                    />
                  ) : (
                    <Alert severity="info" sx={{ borderRadius:2, fontSize:'0.8rem' }}>
                      {AR?'احفظ بيانات الموظف أولاً لتتمكن من رفع مستنداته':'Save employee details first to upload documents'}
                    </Alert>
                  )}
                </Grid>
              </Grid>
            )}

            {/* TAB 4: PERMISSIONS (PR approval) */}
            {tab===4 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius:2, fontSize:'0.8rem' }}>
                    {AR?'هذه الإعدادات تحدد قدرة الموظف على اعتماد طلبات الشراء (PR)':'These settings control employee\'s ability to approve Purchase Requests (PR)'}
                  </Alert>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={form.canApprovePR||false} onChange={setBool('canApprovePR')} color="primary"/>}
                    label={<Typography variant="body2" fontWeight={600}>{AR?'يمكنه اعتماد طلبات الشراء':'Can approve purchase requests'}</Typography>}
                  />
                </Grid>
                {form.canApprovePR && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label={AR?'حد الاعتماد (ر.س)':'Approval Limit (SAR)'} type="number"
                        value={form.prApprovalLimit||0} onChange={set('prApprovalLimit')}
                        InputProps={{ endAdornment:<InputAdornment position="end">{AR?'ر.س':'SAR'}</InputAdornment> }}
                        helperText={AR?'0 = بلا حد':'0 = no limit'}/>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label={AR?'مستوى الاعتماد':'Approval Level'} value={form.approvalLevel||'none'} onChange={set('approvalLevel')} select>
                        {APPROVAL_LEVELS.map(l=><MenuItem key={l.value} value={l.value}>{AR?l.labelAr:l.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                  </>
                )}
                <Grid item xs={12}><TextField fullWidth label={AR?'ملاحظات':'Notes'} value={form.notes||''} onChange={set('notes')} multiline rows={3}/></Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider', justifyContent:'space-between' }}>
            <Box sx={{ display:'flex', gap:1 }}>
              {tab>0 && <Button onClick={()=>setTab(t=>t-1)}>← {AR?'السابق':'Back'}</Button>}
              {tab<FORM_TABS.length-1 && <Button variant="outlined" onClick={()=>setTab(t=>t+1)}>{AR?'التالي':'Next'} →</Button>}
            </Box>
            <Box sx={{ display:'flex', gap:1 }}>
              <Button onClick={close}>{t('common.cancel')}</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}
                startIcon={saving?<CircularProgress size={16}/>:<Save/>}
                sx={{ bgcolor:'#1565c0' }}>
                {t('common.save')}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* DELETE CONFIRM */}
        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {AR?'حذف الموظف':'Delete Employee'}</DialogTitle>
          <DialogContent><Typography>{AR?'هل أنت متأكد من حذف هذا الموظف؟':'Confirm delete?'}</Typography></DialogContent>
          <DialogActions>
            <Button onClick={()=>setDelId(null)}>{t('common.cancel')}</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogActions>
        </Dialog>

        {/* ── Generated Accounts Dialog ── */}
        {accountsDialog && (
          <Dialog open maxWidth="sm" fullWidth onClose={()=>setAccountsDialog(null)} PaperProps={{ sx:{ borderRadius:3 } }}>
            <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider' }}>
              <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Box>
                  {AR?'تم إنشاء الفريق':'Team Created'}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {accountsDialog.count} {AR?'موظف':'employees'} · {accountsDialog.accounts.length} {AR?'حساب دخول':'login accounts'}
                  </Typography>
                </Box>
                <IconButton onClick={()=>setAccountsDialog(null)} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt:2 }}>
              <Alert severity="warning" sx={{ mb:2, borderRadius:2 }}>
                {AR
                  ? `كلمة المرور الموحدة لجميع الحسابات: ${accountsDialog.password} — يُنصح بإلزام كل موظف بتغييرها عند أول دخول.`
                  : `Shared default password for all accounts: ${accountsDialog.password} — recommend forcing change on first login.`}
              </Alert>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor:'#f5f5f5' }}>
                  <TableCell sx={{ fontWeight:700 }}>{AR?'الاسم':'Name'}</TableCell>
                  <TableCell sx={{ fontWeight:700 }}>{AR?'المنصب':'Position'}</TableCell>
                  <TableCell sx={{ fontWeight:700 }}>{AR?'البريد الإلكتروني':'Email'}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {accountsDialog.accounts.map((a,i)=>(
                    <TableRow key={i}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{a.name}</Typography></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{a.position}</Typography></TableCell>
                      <TableCell><Typography variant="caption" sx={{ fontFamily:'monospace' }}>{a.email}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt:2 }}>
                {AR
                  ? 'هذه أسماء وبريد إلكتروني تجريبية (placeholders) — عدّلها لاحقاً من قسم الموظفين بالأسماء والبيانات الحقيقية.'
                  : 'These are placeholder names and emails — edit them later from the Employees section with real data.'}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
              <Button variant="contained" onClick={()=>setAccountsDialog(null)}>{AR?'تم':'Done'}</Button>
            </DialogActions>
          </Dialog>
        )}

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
