import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, CardHeader,
  Chip, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, CircularProgress, Snackbar, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Accordion, AccordionSummary, AccordionDetails, Tooltip,
  Divider, Badge, MenuItem, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import {
  Add, Edit, Delete, Security, ExpandMore, People, Check,
  Warning, Refresh, ContentCopy, Settings, AdminPanelSettings,
  Lock, LockOpen
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

// ─── All modules grouped ─────────────────────────────────────────────────────
const MODULE_GROUPS = {
  'الأساسية':       ['dashboard','users','roles','company_settings','branches','warehouses'],
  'المالية':        ['accounting','payments','tax_returns','budgets','reports'],
  'المشتريات':      ['suppliers','purchase_orders','rfq','inventory','stock_movements'],
  'المبيعات والعملاء':['customers','sales_orders','quotations','crm','deliveries'],
  'الموارد البشرية':['employees','payroll','hr_leaves','attendance'],
  'العمليات':       ['projects','shipments','customs','logistics'],
  'التواصل':        ['chat','meetings','notifications'],
  'قطاع الصحة':    ['patients','appointments','medical_records','pharmacy_mgmt','lab'],
  'قطاع الضيافة':  ['rooms','bookings','restaurant_pos','menu','kitchen'],
  'قطاع التعليم':  ['students','classes','grades','teachers'],
  'الرياضة':       ['members','subscriptions','gym_classes'],
  'العقارات':      ['properties','leases','tenants'],
  'التجميل':       ['salon_appointments','salon_services','staff_schedule'],
  'التصنيع':       ['production','bom','quality'],
  'اللوجستيك':     ['fleet','drivers','routes'],
  'الجمعيات':      ['donors','donations','beneficiaries'],
  'النظام':        ['ai_assistant','system_settings','audit_log']
};

const MODULE_LABELS = {
  dashboard:'لوحة التحكم', users:'المستخدمون', roles:'الأدوار',
  company_settings:'إعدادات الشركة', branches:'الفروع', warehouses:'المستودعات',
  accounting:'المحاسبة', payments:'المدفوعات', tax_returns:'الضرائب',
  budgets:'الميزانيات', reports:'التقارير',
  suppliers:'الموردون', purchase_orders:'أوامر الشراء', rfq:'طلبات الأسعار',
  inventory:'المخزون', stock_movements:'حركة المخزون',
  customers:'العملاء', sales_orders:'أوامر البيع', quotations:'العروض',
  crm:'CRM', deliveries:'التوصيل',
  employees:'الموظفون', payroll:'الرواتب', hr_leaves:'الإجازات', attendance:'الحضور',
  projects:'المشاريع', shipments:'الشحنات', customs:'الجمارك', logistics:'اللوجستيك',
  chat:'المحادثات', meetings:'الاجتماعات', notifications:'الإشعارات',
  patients:'المرضى', appointments:'المواعيد', medical_records:'السجلات الطبية',
  pharmacy_mgmt:'الصيدلية', lab:'المختبر',
  rooms:'الغرف', bookings:'الحجوزات', restaurant_pos:'نقطة البيع', menu:'القائمة', kitchen:'المطبخ',
  students:'الطلاب', classes:'الفصول', grades:'الدرجات', teachers:'المعلمون',
  members:'الأعضاء', subscriptions:'الاشتراكات', gym_classes:'الحصص',
  properties:'العقارات', leases:'عقود الإيجار', tenants:'المستأجرون',
  salon_appointments:'مواعيد الصالون', salon_services:'خدمات التجميل', staff_schedule:'جدول العمل',
  production:'الإنتاج', bom:'قوائم المواد', quality:'الجودة',
  fleet:'الأسطول', drivers:'السائقون', routes:'المسارات',
  donors:'المتبرعون', donations:'التبرعات', beneficiaries:'المستفيدون',
  ai_assistant:'مساعد AI', system_settings:'إعدادات النظام', audit_log:'سجل التدقيق'
};

const ACTION_LABELS = { read:'قراءة', create:'إضافة', update:'تعديل', delete:'حذف', approve:'اعتماد', export:'تصدير', import:'استيراد' };
const ACTION_COLORS = { read:'#1a73e8', create:'#34a853', update:'#f57c00', delete:'#e53935', approve:'#7b1fa2', export:'#00897b', import:'#5d4037' };
const ALL_ACTIONS = ['read','create','update','delete','approve','export','import'];

const ROLE_ICONS = ['👔','👤','👥','💼','📊','🛒','📦','💰','👨‍⚕️','👩‍⚕️','🎓','📚','🔧','🏗️','🤵','👨‍🍳','✂️','🏋️','🏘️','🛡️'];

// ─── Permission Matrix Component ──────────────────────────────────────────────
const PermMatrix = ({ permissions, onChange }) => {
  const getModulePerm = (module) => permissions.find(p => p.module === module) || { module, actions: [] };

  const toggleAction = (module, action) => {
    const existing = permissions.find(p => p.module === module);
    if (existing) {
      const has = existing.actions.includes(action);
      onChange(permissions.map(p => p.module === module
        ? { ...p, actions: has ? p.actions.filter(a => a !== action) : [...p.actions, action] }
        : p
      ));
    } else {
      onChange([...permissions, { module, actions: [action] }]);
    }
  };

  const toggleModule = (module) => {
    const existing = permissions.find(p => p.module === module);
    if (existing && existing.actions.length > 0) {
      onChange(permissions.map(p => p.module === module ? { ...p, actions: [] } : p));
    } else {
      const base = ['read','create','update'];
      if (existing) onChange(permissions.map(p => p.module === module ? { ...p, actions: base } : p));
      else onChange([...permissions, { module, actions: base }]);
    }
  };

  const grantAll = (module) => {
    if (permissions.find(p => p.module === module)) {
      onChange(permissions.map(p => p.module === module ? { ...p, actions: [...ALL_ACTIONS] } : p));
    } else {
      onChange([...permissions, { module, actions: [...ALL_ACTIONS] }]);
    }
  };

  return (
    <Box>
      {Object.entries(MODULE_GROUPS).map(([group, modules]) => (
        <Accordion key={group} defaultExpanded={['الأساسية','المالية','المشتريات'].includes(group)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" fontWeight={700}>{group}</Typography>
            <Chip size="small" label={
              permissions.filter(p => modules.includes(p.module) && p.actions.length > 0).length + '/' + modules.length
            } sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700, width: '25%', fontSize: '0.75rem' }}>الوحدة</TableCell>
                  {ALL_ACTIONS.map(a => (
                    <TableCell key={a} align="center" sx={{ fontSize: '0.65rem', color: ACTION_COLORS[a], fontWeight: 600, px: 0.5 }}>
                      {ACTION_LABELS[a]}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontSize: '0.65rem', width: 60 }}>الكل</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map(module => {
                  const perm = getModulePerm(module);
                  const hasAny = perm.actions.length > 0;
                  return (
                    <TableRow key={module} hover sx={{ '&:hover':{ bgcolor:'#f5f7fa' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Switch size="small" checked={hasAny} onChange={() => toggleModule(module)}
                            sx={{ '& .MuiSwitch-thumb':{ width:12, height:12 } }}/>
                          <Typography variant="caption" fontWeight={hasAny ? 600 : 400} sx={{ fontSize: '0.72rem' }}>
                            {MODULE_LABELS[module] || module}
                          </Typography>
                        </Box>
                      </TableCell>
                      {ALL_ACTIONS.map(action => (
                        <TableCell key={action} align="center" sx={{ px: 0.5 }}>
                          <Checkbox
                            size="small"
                            checked={perm.actions.includes(action)}
                            onChange={() => toggleAction(module, action)}
                            sx={{ p: 0.3, '& .MuiSvgIcon-root': { fontSize: 16 }, color: ACTION_COLORS[action], '&.Mui-checked': { color: ACTION_COLORS[action] } }}
                          />
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <Tooltip title="منح الكل">
                          <IconButton size="small" onClick={() => grantAll(module)} sx={{ p: 0.3 }}>
                            <LockOpen sx={{ fontSize: 14, color: 'text.secondary' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RolesPage = () => {
  const [roles, setRoles]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dialog, setDialog]     = useState(null); // null | 'create' | 'edit' | 'assign'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [snack, setSnack]       = useState('');
  const [assignDialog, setAssignDialog] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');

  const [form, setForm] = useState({
    name: '', nameEn: '', color: '#1a73e8', icon: '👤', level: 5,
    description: '', permissions: [],
    canViewFinancials: false, canManageUsers: false, canApprove: false,
    canExport: false, canViewSalaries: false, canAccessAllBranches: false
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, empRes] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/users'),
        api.get('/api/employees').catch(()=>({data:{data:[]}})),
      ]);
      if (rolesRes.data.success) setRoles(rolesRes.data.data || []);
      if (usersRes.data.success) setUsers(usersRes.data.data || []);
      if (empRes.data.success)   setEmployees(empRes.data.data || []);
    } catch (e) { setError('فشل تحميل البيانات'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name:'', nameEn:'', color:'#1a73e8', icon:'👤', level:5, description:'', permissions:[],
      canViewFinancials:false, canManageUsers:false, canApprove:false, canExport:false, canViewSalaries:false, canAccessAllBranches:false });
    setDialog('create');
  };

  const openEdit = (role) => {
    setSelected(role);
    setForm({ ...role, permissions: role.permissions || [] });
    setDialog('edit');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('اسم الدور مطلوب'); return; }
    setSaving(true);
    try {
      if (dialog === 'create') {
        await api.post('/api/roles', form);
        setSnack('تم إنشاء الدور بنجاح');
      } else {
        await api.put(`/api/roles/${selected._id}`, form);
        setSnack('تم تحديث الدور بنجاح');
      }
      setDialog(null);
      load();
    } catch (e) { setError(e.response?.data?.message || 'فشل حفظ الدور'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد؟')) return;
    try {
      await api.delete(`/api/roles/${id}`);
      setSnack('تم حذف الدور');
      load();
    } catch (e) { setError(e.response?.data?.message || 'فشل الحذف'); }
  };

  const seedDefaults = async () => {
    setSaving(true);
    try {
      const res = await api.post('/api/roles/seed-defaults');
      setSnack(res.data.message);
      load();
    } catch (e) { setError('فشل إنشاء الأدوار الافتراضية'); }
    setSaving(false);
  };

  const handleAssign = async () => {
    if (!assignUserId || !assignRoleId) return;
    try {
      const selectedEmp = employees.find(e => e._id === assignUserId);
      await api.post('/api/roles/assign', {
        employeeId: assignUserId,
        userId: selectedEmp?.user?._id || selectedEmp?.user || undefined,
        roleId: assignRoleId,
      });
      setSnack('تم تعيين الدور بنجاح');
      setAssignDialog(false);
      setAssignUserId(''); setAssignRoleId('');
      load();
    } catch (e) { setError(e.response?.data?.message || 'فشل تعيين الدور'); }
  };

  const getModuleCount = (role) => role.permissions?.filter(p => p.actions?.length > 0).length || 0;

  return (
    <Layout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb: 3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
            <AdminPanelSettings sx={{ fontSize: 32, color: '#7b1fa2' }} />
            <Box>
              <Typography variant="h5" fontWeight={800}>الأدوار والصلاحيات</Typography>
              <Typography variant="caption" color="text.secondary">
                {roles.length} دور · {users.length} مستخدم
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={load} size="small">تحديث</Button>
            <Button variant="outlined" onClick={() => setAssignDialog(true)} startIcon={<People />}>
              تعيين دور
            </Button>
            <Button variant="outlined" color="secondary" onClick={seedDefaults} disabled={saving}>
              إنشاء الأدوار الافتراضية
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}
              sx={{ bgcolor:'#7b1fa2', '&:hover':{ bgcolor:'#6a1b9a' } }}>
              دور جديد
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display:'flex', justifyContent:'center', py: 8 }}><CircularProgress /></Box>
        ) : roles.length === 0 ? (
          <Paper sx={{ p: 6, textAlign:'center', borderRadius: 3 }}>
            <Security sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>لا توجد أدوار</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              أنشئ الأدوار الافتراضية حسب قطاعك أو أضف دوراً مخصصاً
            </Typography>
            <Box sx={{ display:'flex', gap: 2, justifyContent:'center' }}>
              <Button variant="contained" onClick={seedDefaults} disabled={saving}>
                {saving ? <CircularProgress size={20} /> : 'إنشاء الأدوار الافتراضية'}
              </Button>
              <Button variant="outlined" startIcon={<Add />} onClick={openCreate}>دور مخصص</Button>
            </Box>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {roles.map(role => (
              <Grid item xs={12} sm={6} lg={4} key={role._id}>
                <Card sx={{ borderRadius: 3, borderTop: `4px solid ${role.color || '#1a73e8'}`,
                  transition:'all 0.2s', '&:hover':{ boxShadow: 4, transform:'translateY(-2px)' } }}>
                  <CardContent>
                    {/* Role header */}
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb: 1.5 }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor:`${role.color}20`, width: 44, height: 44, fontSize: 22 }}>
                          {role.icon || '👤'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{role.name}</Typography>
                          {role.nameEn && <Typography variant="caption" color="text.secondary">{role.nameEn}</Typography>}
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => openEdit(role)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                        {!role.isSystem && (
                          <IconButton size="small" color="error" onClick={() => handleDelete(role._id)}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Badges */}
                    <Box sx={{ display:'flex', gap: 0.8, flexWrap:'wrap', mb: 1.5 }}>
                      {role.isDefault && <Chip label="افتراضي" size="small" color="info" sx={{ fontSize:'0.65rem', height: 18 }} />}
                      {role.isSystem && <Chip label="نظامي" size="small" color="warning" sx={{ fontSize:'0.65rem', height: 18 }} />}
                      {role.canApprove && <Chip label="اعتماد" size="small" sx={{ bgcolor:'#7b1fa220', color:'#7b1fa2', fontSize:'0.65rem', height: 18 }} />}
                      {role.canViewFinancials && <Chip label="مالية" size="small" sx={{ bgcolor:'#34a85320', color:'#34a853', fontSize:'0.65rem', height: 18 }} />}
                      {role.canManageUsers && <Chip label="إدارة مستخدمين" size="small" sx={{ bgcolor:'#e5393520', color:'#e53935', fontSize:'0.65rem', height: 18 }} />}
                    </Box>

                    {/* Modules count */}
                    <Box sx={{ bgcolor:'#f8f9fa', borderRadius: 2, p: 1.5, mb: 1.5 }}>
                      <Box sx={{ display:'flex', justifyContent:'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">الوحدات المتاحة</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: role.color }}>
                          {getModuleCount(role)} وحدة
                        </Typography>
                      </Box>
                      <Box sx={{ display:'flex', gap: 0.5, flexWrap:'wrap' }}>
                        {role.permissions?.filter(p => p.actions?.length > 0).slice(0, 6).map(p => (
                          <Chip key={p.module} label={MODULE_LABELS[p.module]?.slice(0,8) || p.module}
                            size="small" sx={{ fontSize:'0.6rem', height: 16, bgcolor:`${role.color}15`, color: role.color }} />
                        ))}
                        {getModuleCount(role) > 6 && (
                          <Chip label={`+${getModuleCount(role) - 6}`} size="small"
                            sx={{ fontSize:'0.6rem', height: 16 }} />
                        )}
                      </Box>
                    </Box>

                    {/* Users with this role */}
                    <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', mb: (() => {
                        const cnt = employees.filter(e=>e.customRole===role._id||e.customRole?._id===role._id).length;
                        return cnt > 0 ? 1 : 0;
                      })() }}>
                      <Box sx={{ display:'flex', alignItems:'center', gap: 0.5 }}>
                        <People sx={{ fontSize: 14, color:'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {role.userCount || 0} مستخدم
                        </Typography>
                      </Box>
                      <Chip label={`مستوى ${role.level || 5}`} size="small" variant="outlined"
                        sx={{ fontSize:'0.65rem', height: 18 }} />
                    </Box>
                    {employees.filter(e=>e.customRole===role._id||e.customRole?._id===role._id).length > 0 && (
                      <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.4 }}>
                        {employees.filter(e=>e.customRole===role._id||e.customRole?._id===role._id).slice(0,4).map(e=>(
                          <Chip key={e._id} label={e.name} size="small"
                            avatar={<Avatar sx={{fontSize:'0.6rem!important'}}>{e.name?.[0]}</Avatar>}
                            sx={{fontSize:'0.65rem'}}/>
                        ))}
                        {employees.filter(e=>e.customRole===role._id||e.customRole?._id===role._id).length > 4 && (
                          <Chip label={`+${employees.filter(e=>e.customRole===role._id||e.customRole?._id===role._id).length-4}`} size="small" sx={{fontSize:'0.65rem'}}/>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Create / Edit Dialog ── */}
        <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)}
          maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, height: '90vh' } }}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            {dialog === 'create' ? '+ دور جديد' : `تعديل: ${selected?.name}`}
          </DialogTitle>
          <DialogContent dividers sx={{ overflow:'auto' }}>
            <Grid container spacing={3}>
              {/* Left: Basic info */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display:'flex', flexDirection:'column', gap: 2, position:'sticky', top:0 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">معلومات الدور</Typography>

                  {/* Icon picker */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">الأيقونة</Typography>
                    <Box sx={{ display:'flex', gap: 0.8, flexWrap:'wrap' }}>
                      {ROLE_ICONS.map(ic => (
                        <Box key={ic} onClick={() => setForm(p => ({...p, icon:ic}))}
                          sx={{ fontSize:22, cursor:'pointer', p:0.5, borderRadius:1,
                            border: form.icon===ic ? '2px solid #7b1fa2' : '2px solid transparent',
                            bgcolor: form.icon===ic ? '#7b1fa210' : 'transparent',
                            transition:'all 0.15s', '&:hover':{bgcolor:'#f5f7fa'} }}>
                          {ic}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <TextField label="اسم الدور (عربي) *" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} fullWidth required size="small"/>
                  <TextField label="Role Name (English)" value={form.nameEn||''} onChange={e => setForm(p=>({...p,nameEn:e.target.value}))} fullWidth size="small"/>

                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">لون الدور</Typography>
                    <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
                      {['#1a73e8','#34a853','#f57c00','#e53935','#7b1fa2','#00897b','#c2185b','#37474f','#283593','#1b5e20'].map(c => (
                        <Box key={c} onClick={() => setForm(p=>({...p,color:c}))}
                          sx={{ width:24, height:24, borderRadius:'50%', bgcolor:c, cursor:'pointer',
                            border: form.color===c ? '3px solid #333' : '3px solid transparent',
                            transition:'all 0.15s' }}/>
                      ))}
                    </Box>
                  </Box>

                  <TextField label="المستوى (1=أعلى)" type="number" value={form.level} onChange={e => setForm(p=>({...p,level:parseInt(e.target.value)||5}))}
                    fullWidth size="small" inputProps={{ min:1, max:10 }}/>
                  <TextField label="الوصف" value={form.description||''} onChange={e => setForm(p=>({...p,description:e.target.value}))} fullWidth multiline rows={2} size="small"/>

                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">صلاحيات خاصة</Typography>
                  {[
                    ['canViewFinancials','عرض البيانات المالية'],
                    ['canViewSalaries','عرض الرواتب'],
                    ['canManageUsers','إدارة المستخدمين'],
                    ['canApprove','اعتماد المعاملات'],
                    ['canExport','تصدير البيانات'],
                    ['canAccessAllBranches','الوصول لجميع الفروع'],
                  ].map(([key, label]) => (
                    <FormControlLabel key={key}
                      control={<Switch size="small" checked={!!form[key]} onChange={e => setForm(p=>({...p,[key]:e.target.checked}))} />}
                      label={<Typography variant="body2">{label}</Typography>}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Right: Permission matrix */}
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                  مصفوفة الصلاحيات
                </Typography>
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize:'0.8rem' }}>
                  فعّل الوحدة أولاً ثم اختر الإجراءات المسموح بها
                </Alert>
                <PermMatrix
                  permissions={form.permissions}
                  onChange={perms => setForm(p => ({...p, permissions: perms}))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3 }}>
            <Button onClick={() => setDialog(null)}>إلغاء</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              sx={{ bgcolor:'#7b1fa2', '&:hover':{ bgcolor:'#6a1b9a' } }}>
              {saving ? <CircularProgress size={20} /> : dialog === 'create' ? 'إنشاء الدور' : 'حفظ التغييرات'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Assign Role Dialog ── */}
        <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle fontWeight={800}>تعيين دور لموظف</DialogTitle>
          <DialogContent>
            <Box sx={{ display:'flex', flexDirection:'column', gap: 2, mt: 1 }}>
              <TextField label="الموظف" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} fullWidth select
                helperText="تظهر جميع موظفي الشركة — مع حساب دخول أو بدونه">
                {employees.map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>
                    <Box sx={{ display:'flex', alignItems:'center', gap: 1, width:'100%' }}>
                      <Avatar sx={{ width:28, height:28, fontSize:12, bgcolor:'#1a73e8' }}>{emp.name?.[0]}</Avatar>
                      <Box sx={{flex:1}}>
                        <Typography variant="body2" fontWeight={600}>{emp.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[emp.position, emp.department].filter(Boolean).join(' · ') || 'بدون منصب'}
                        </Typography>
                      </Box>
                      {emp.user ? (
                        <Chip label="له حساب دخول" size="small" color="success" sx={{fontSize:'0.6rem'}}/>
                      ) : (
                        <Chip label="بدون حساب" size="small" variant="outlined" sx={{fontSize:'0.6rem'}}/>
                      )}
                      {emp.customRole && <Chip label="له دور" size="small" color="primary" sx={{fontSize:'0.6rem'}}/>}
                    </Box>
                  </MenuItem>
                ))}
                {employees.length === 0 && (
                  <MenuItem disabled><Typography variant="caption" color="text.secondary">لا يوجد موظفون — أضف من قسم الموظفين أولاً</Typography></MenuItem>
                )}
              </TextField>
              <TextField label="الدور" value={assignRoleId} onChange={e => setAssignRoleId(e.target.value)} fullWidth select>
                {roles.map(r => (
                  <MenuItem key={r._id} value={r._id}>
                    <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
                      <span>{r.icon}</span> {r.name}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialog(false)}>إلغاء</Button>
            <Button variant="contained" onClick={handleAssign} disabled={!assignUserId||!assignRoleId}>
              تعيين
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </Layout>
  );
};

export default RolesPage;
