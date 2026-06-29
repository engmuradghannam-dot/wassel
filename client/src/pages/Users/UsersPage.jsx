import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Switch, FormControlLabel, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Refresh, People, Shield,
  AdminPanelSettings, Close, Save, Visibility, VisibilityOff
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const EMPTY_USER = {
  name:'', email:'', password:'', phone:'', role:'user',
  position:'', department:'', customRole:'', isActive:true
};

const ROLE_CONFIG = {
  owner:      { label:'مالك',           labelEn:'Owner',         color:'#7b1fa2', icon:'👑' },
  admin:      { label:'مشرف',           labelEn:'Admin',         color:'#1a73e8', icon:'🛡️' },
  manager:    { label:'مدير',           labelEn:'Manager',       color:'#f57c00', icon:'💼' },
  user:       { label:'مستخدم',         labelEn:'User',          color:'#34a853', icon:'👤' },
  employee:   { label:'موظف',           labelEn:'Employee',      color:'#00897b', icon:'👷' },
  readonly:   { label:'قراءة فقط',      labelEn:'Read Only',     color:'#9e9e9e', icon:'👁️' },
};

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const myRole = localStorage.getItem('userRole') || '';

  const [users,    setUsers]   = useState([]);
  const [roles,    setRoles]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [dialog,   setDialog]  = useState(false);
  const [form,     setForm]    = useState(EMPTY_USER);
  const [editId,   setEditId]  = useState(null);
  const [search,   setSearch]  = useState('');
  const [saving,   setSaving]  = useState(false);
  const [error,    setError]   = useState('');
  const [snack,    setSnack]   = useState('');
  const [showPw,   setShowPw]  = useState(false);

  const canManage = ['owner','admin','superadmin'].includes(myRole);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.allSettled([
        api.get('/api/users'),
        api.get('/api/roles')
      ]);
      if (usersRes.status === 'fulfilled' && usersRes.value.data.success)
        setUsers(usersRes.value.data.data || []);
      if (rolesRes.status === 'fulfilled' && rolesRes.value.data.success)
        setRoles(rolesRes.value.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({...EMPTY_USER}); setEditId(null); setError(''); setShowPw(false); setDialog(true); };
  const openEdit = (u) => { setForm({...u, password:''}); setEditId(u._id); setError(''); setShowPw(false); setDialog(true); };
  const close    = () => { setDialog(false); setForm(EMPTY_USER); setEditId(null); setError(''); };

  const handleSave = async () => {
    if (!form.name?.trim()) { setError((AR?'الاسم مطلوب':'Name is required')); return; }
    if (!form.email?.trim()) { setError((AR?'البريد مطلوب':'Email is required')); return; }
    if (!editId && !form.password) { setError((AR?'كلمة المرور مطلوبة':'Password is required')); return; }

    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // Don't send empty password on edit
      
      if (editId) await api.put(`/api/users/${editId}`, payload);
      else        await api.post('/api/users', payload);
      
      setSnack(editId
        ? (AR?'تم تحديث بيانات المستخدم':'User updated successfully')
        : (AR?'تم إضافة المستخدم بنجاح':'User added successfully'));
      close(); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const toggleActive = async (userId, currentState) => {
    try {
      await api.put(`/api/users/${userId}`, { isActive: !currentState });
      setSnack(AR?'تم تحديث الحالة':'Status updated');
      load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) ||
           u.role?.toLowerCase().includes(q) || u.position?.toLowerCase().includes(q);
  });

  const getRoleChip = (role) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    return (
      <Chip
        label={`${cfg.icon} ${AR ? cfg.label : cfg.labelEn}`}
        size="small"
        sx={{ bgcolor:`${cfg.color}15`, color:cfg.color, fontWeight:700, fontSize:'0.7rem' }}/>
    );
  };

  // Available roles — owner cannot create another owner or superadmin
  const availableRoles = Object.entries(ROLE_CONFIG)
    .filter(([r]) => r !== 'owner' && r !== 'superadmin')
    .map(([value, cfg]) => ({ value, label: AR ? cfg.label : cfg.labelEn, icon: cfg.icon }));

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <AdminPanelSettings sx={{ fontSize:32, color:'#7b1fa2' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {AR?'إدارة المستخدمين':'User Management'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {users.length} {AR?'مستخدم':'users'} · {users.filter(u=>u.isActive).length} {AR?'نشط':'active'}
              </Typography>
            </Box>
          </Box>
          {canManage && (
            <Box sx={{ display:'flex', gap:1 }}>
              <IconButton onClick={load} size="small"><Refresh/></IconButton>
              <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
                sx={{ bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'}, borderRadius:2 }}>
                {AR?'مستخدم جديد':'New User'}
              </Button>
            </Box>
          )}
        </Box>

        {!canManage && (
          <Alert severity="info" sx={{ mb:2, borderRadius:2 }}>
            {AR?'يمكن للمالك والمشرف فقط إدارة المستخدمين':'Only owner and admin can manage users'}
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={`${t('common.search')||'Search'}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:340 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18,color:'text.secondary' }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المستخدم':'User'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الدور':'Role'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'المنصب':'Position'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{t('common.email')||'Email'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                {canManage && <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')||'Actions'}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py:4, color:'text.secondary' }}>
                  {AR?'لا يوجد مستخدمون':'No users found'}
                </TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u._id} hover>
                  <TableCell>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                      <Avatar sx={{ width:36, height:36, bgcolor:`${ROLE_CONFIG[u.role]?.color||'#1a73e8'}20`,
                        color: ROLE_CONFIG[u.role]?.color||'#1a73e8', fontSize:14, fontWeight:700 }}>
                        {u.name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getRoleChip(u.role)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{u.position||'—'}</Typography>
                    {u.department && <Typography variant="caption" color="text.secondary">{u.department}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize:'0.8rem' }}>{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    {canManage && u.role !== 'owner' ? (
                      <Tooltip title={AR?'تفعيل / تعطيل':'Toggle active'}>
                        <Switch size="small" checked={u.isActive||false}
                          onChange={()=>toggleActive(u._id, u.isActive)}
                          color="success"/>
                      </Tooltip>
                    ) : (
                      <Chip label={u.isActive?(AR?'نشط':'Active'):(AR?'غير نشط':'Inactive')}
                        color={u.isActive?'success':'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell align="center">
                      {u.role !== 'owner' && (
                        <Tooltip title={t('common.edit')||'Edit'}>
                          <IconButton size="small" onClick={()=>openEdit(u)} sx={{ color:'#1a73e8' }}>
                            <Edit sx={{ fontSize:16 }}/>
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── CREATE/EDIT USER DIALOG ── */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth
          PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle sx={{ pb:1 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Typography fontWeight={800} variant="h6">
                {editId ? `✏️ ${AR?'تعديل المستخدم':'Edit User'}` : `👤 ${AR?'مستخدم جديد':'New User'}`}
              </Typography>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

            <Grid container spacing={2} sx={{ mt:0.5 }}>
              {/* Basic Info */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'الاسم الكامل *':'Full Name *'}
                  value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'البريد الإلكتروني *':'Email *'}
                  type="email" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required
                  disabled={!!editId} helperText={editId?(AR?'لا يمكن تغيير البريد':'Email cannot be changed'):''}/>
              </Grid>

              {/* Password */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={editId?(AR?'كلمة مرور جديدة (اختياري)':'New Password (optional)'):(AR?'كلمة المرور *':'Password *')}
                  type={showPw?'text':'password'}
                  value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                  required={!editId}
                  InputProps={{ endAdornment:<InputAdornment position="end">
                    <IconButton size="small" onClick={()=>setShowPw(v=>!v)}>
                      {showPw?<VisibilityOff sx={{ fontSize:18 }}/>:<Visibility sx={{ fontSize:18 }}/>}
                    </IconButton>
                  </InputAdornment> }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={t('common.phone')||'Phone'}
                  value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
              </Grid>

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">
                {AR?'الدور والصلاحيات':'Role & Permissions'}
              </Typography></Divider></Grid>

              {/* Role */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'الدور':'Role'} value={form.role||'user'}
                  onChange={e=>setForm(p=>({...p,role:e.target.value}))} select>
                  {availableRoles.map(r => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Custom Role */}
              {roles.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={AR?'دور مخصص (اختياري)':'Custom Role (optional)'}
                    value={form.customRole||''} onChange={e=>setForm(p=>({...p,customRole:e.target.value}))} select>
                    <MenuItem value=""><em>{AR?'بدون':'None'}</em></MenuItem>
                    {roles.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                  </TextField>
                </Grid>
              )}

              <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">
                {AR?'معلومات العمل':'Work Info'}
              </Typography></Divider></Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'المسمى الوظيفي':'Position'}
                  value={form.position||''} onChange={e=>setForm(p=>({...p,position:e.target.value}))}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label={AR?'القسم':'Department'}
                  value={form.department||''} onChange={e=>setForm(p=>({...p,department:e.target.value}))}/>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={form.isActive!==false} onChange={e=>setForm(p=>({...p,isActive:e.target.checked}))} color="success"/>}
                  label={<Typography variant="body2">{AR?'الحساب نشط':'Active account'}</Typography>}/>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2, borderTop:'1px solid', borderColor:'divider' }}>
            <Button onClick={close}>{t('common.cancel')||'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:'#7b1fa2','&:hover':{bgcolor:'#6a1b9a'} }}>
              {t('common.save')||'Save'}
            </Button>
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
