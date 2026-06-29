import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  Alert, Snackbar, InputAdornment, CircularProgress, Tooltip, Divider,
  FormControl, InputLabel, Select
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, People, Security, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const SYSTEM_ROLES = [
  { value:'admin',    labelAr:'مدير النظام',        label:'Admin',        color:'#7b1fa2', note:'صلاحيات كاملة داخل الشركة' },
  { value:'manager',  labelAr:'مشرف / مدير قسم',   label:'Manager',      color:'#1a73e8', note:'إنشاء وتعديل بدون حذف' },
  { value:'user',     labelAr:'مستخدم عادي',        label:'User',         color:'#34a853', note:'صلاحيات محدودة' },
  { value:'employee', labelAr:'موظف',               label:'Employee',     color:'#f57c00', note:'قراءة وتنفيذ فقط' },
  { value:'readonly', labelAr:'قراءة فقط',          label:'Read Only',    color:'#546e7a', note:'عرض بدون أي تعديل' },
];

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [users,    setUsers]    = useState([]);
  const [roles,    setRoles]    = useState([]);   // custom roles from DB
  const [loading,  setLoading]  = useState(true);
  const [dialog,   setDialog]   = useState(false);
  const [form,     setForm]     = useState({ name:'', email:'', password:'', role:'user', customRole:'', phone:'' });
  const [editId,   setEditId]   = useState(null);
  const [error,    setError]    = useState('');
  const [snack,    setSnack]    = useState('');
  const [search,   setSearch]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState(null);

  const myId   = localStorage.getItem('userId');
  const myRole = localStorage.getItem('userRole');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersR, rolesR] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/roles').catch(()=>({ data:{ data:[] } })),
      ]);
      if (usersR.data.success) setUsers(usersR.data.data || []);
      if (rolesR.data.success) setRoles(rolesR.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ name:'', email:'', password:'', role:'user', customRole:'', phone:'' }); setEditId(null); setError(''); setDialog(true); };
  const openEdit = u => { setForm({ ...u, password:'', customRole: u.customRole?._id||u.customRole||'' }); setEditId(u._id); setError(''); setDialog(true); };
  const close    = () => { setDialog(false); setError(''); };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.email?.trim()) { setError(AR?'الاسم والبريد مطلوبان':'Name and email required'); return; }
    if (!editId && !form.password) { setError(AR?'كلمة المرور مطلوبة':'Password required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.customRole) delete payload.customRole;
      if (editId) await api.put(`/api/users/${editId}`, payload);
      else        await api.post('/api/users', payload);
      setSnack(editId ? (AR?'تم التحديث':'Updated') : (AR?'تم إضافة المستخدم':'User added'));
      close(); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/users/${delId}`);
      setSnack(AR?'تم الحذف':'Deleted'); setDelId(null); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  const ROLE_COLOR = { superadmin:'#e53935', owner:'#7b1fa2', admin:'#1a73e8', manager:'#f57c00', user:'#34a853', employee:'#00897b', readonly:'#546e7a' };
  const ROLE_AR    = { superadmin:'مشرف النظام', owner:'مالك الشركة', admin:'مدير', manager:'مشرف', user:'مستخدم', employee:'موظف', readonly:'قراءة فقط' };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <People sx={{ fontSize:32, color:'#7b1fa2' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'إدارة المستخدمين':'User Management'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {users.length} {AR?'مستخدم':'users'} · {users.filter(u=>u.isActive).length} {AR?'نشط':'active'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <Tooltip title={AR?'إدارة الأدوار والصلاحيات':'Manage Roles'}>
              <Button variant="outlined" startIcon={<Security/>}
                onClick={()=>window.location.href='/roles'}
                sx={{ borderRadius:2, color:'#7b1fa2', borderColor:'#7b1fa2' }}>
                {AR?'الأدوار':'Roles'}
              </Button>
            </Tooltip>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'}, borderRadius:2 }}>
              {AR?'+ مستخدم جديد':'+ New User'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={`${t('common.search')}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:320 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18 }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المستخدم':'User'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'البريد الإلكتروني':'Email'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الدور النظامي':'System Role'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الدور المخصص':'Custom Role'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py:5 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py:5, color:'text.secondary' }}>
                  {AR?'لا يوجد مستخدمون':'No users found'}
                </TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                      <Avatar sx={{ width:34, height:34, bgcolor:`${ROLE_COLOR[u.role]||'#7b1fa2'}20`,
                        color:ROLE_COLOR[u.role]||'#7b1fa2', fontSize:13, fontWeight:700 }}>
                        {u.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                        <Box sx={{ display:'flex', gap:0.5 }}>
                          {u._id === myId && <Chip label={AR?'أنت':'You'} size="small" color="primary" sx={{ fontSize:'0.6rem', height:16 }}/>}
                          {u.role === 'owner' && <Chip label={AR?'المالك':'Owner'} size="small" sx={{ fontSize:'0.6rem', height:16, bgcolor:'#f3e5f5', color:'#7b1fa2' }}/>}
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{u.email}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={AR ? (ROLE_AR[u.role]||u.role) : u.role}
                      size="small"
                      sx={{ bgcolor:`${ROLE_COLOR[u.role]||'#546e7a'}18`, color:ROLE_COLOR[u.role]||'#546e7a', fontWeight:600, fontSize:'0.7rem' }}/>
                  </TableCell>
                  <TableCell>
                    {u.customRole ? (
                      <Chip
                        label={typeof u.customRole === 'object' ? u.customRole.name : (roles.find(r=>r._id===u.customRole)?.name || u.customRole)}
                        size="small" variant="outlined"
                        sx={{ fontSize:'0.7rem', borderColor:'#1a73e8', color:'#1a73e8' }}/>
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip label={u.isActive?(AR?'نشط':'Active'):(AR?'موقوف':'Suspended')}
                      color={u.isActive?'success':'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={()=>openEdit(u)} sx={{ color:'#1a73e8' }}>
                        <Edit sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                    {u._id !== myId && u.role !== 'owner' && (
                      <Tooltip title={t('common.delete')}>
                        <IconButton size="small" onClick={()=>setDelId(u._id)} sx={{ color:'#e53935' }}>
                          <Delete sx={{ fontSize:16 }}/>
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── ADD/EDIT DIALOG ── */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={800} sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <People sx={{ color:'#7b1fa2' }}/>
                {editId ? (AR?'تعديل مستخدم':'Edit User') : (AR?'مستخدم جديد':'New User')}
              </Box>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt:3 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={`${AR?'الاسم الكامل':'Full Name'} *`}
                  value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'رقم الهاتف':'Phone'}
                  value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label={`${AR?'البريد الإلكتروني':'Email'} *`} type="email"
                  value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                  required disabled={!!editId}
                  helperText={editId?(AR?'لا يمكن تغيير البريد بعد الإنشاء':'Email cannot be changed'):''}/>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label={editId?(AR?'كلمة المرور الجديدة (اتركها فارغة للإبقاء)':'New Password (leave blank to keep)'):`${AR?'كلمة المرور':'Password'} *`}
                  type="password" value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  required={!editId}/>
              </Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">{AR?'الصلاحيات والدور':'Permissions & Role'}</Typography></Divider></Grid>

              {/* System Role */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'الدور النظامي':'System Role'} value={form.role||'user'}
                  onChange={e=>setForm(p=>({...p,role:e.target.value}))} select
                  helperText={AR?'يحدد مستوى الصلاحية الأساسي':'Base permission level'}>
                  {SYSTEM_ROLES.map(r=>(
                    <MenuItem key={r.value} value={r.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{AR?r.labelAr:r.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.note}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Custom Role from company roles */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'الدور المخصص (اختياري)':'Custom Role (optional)'} value={form.customRole||''}
                  onChange={e=>setForm(p=>({...p,customRole:e.target.value}))} select
                  helperText={AR?'دور مخصص محدد من قسم الأدوار':'Company-defined role with specific permissions'}>
                  <MenuItem value=""><em>{AR?'بدون دور مخصص':'No custom role'}</em></MenuItem>
                  {roles.map(r=>(
                    <MenuItem key={r._id} value={r._id}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <Typography sx={{ fontSize:16 }}>{r.icon||'👔'}</Typography>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.permissions?.length||0} {AR?'وحدة':'modules'}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                  {roles.length === 0 && (
                    <MenuItem disabled>
                      <Typography variant="caption" color="text.secondary">
                        {AR?'لا توجد أدوار مخصصة — أنشئها من قسم الأدوار':'No custom roles — create from Roles section'}
                      </Typography>
                    </MenuItem>
                  )}
                </TextField>
              </Grid>

              {/* Status */}
              <Grid item xs={12}>
                <TextField fullWidth label={AR?'الحالة':'Status'} value={form.isActive!==false?'active':'inactive'}
                  onChange={e=>setForm(p=>({...p,isActive:e.target.value==='active'}))} select>
                  <MenuItem value="active">{AR?'نشط':'Active'}</MenuItem>
                  <MenuItem value="inactive">{AR?'موقوف':'Suspended'}</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Button onClick={close}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'} }}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {AR?'حذف المستخدم':'Delete User'}</DialogTitle>
          <DialogContent><Typography>{AR?'هل أنت متأكد من حذف هذا المستخدم؟':'Confirm delete this user?'}</Typography></DialogContent>
          <DialogActions>
            <Button onClick={()=>setDelId(null)}>{t('common.cancel')}</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')}
          anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
