import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

/**
 * Generic reusable sector CRUD page
 * Props:
 *   model      — API model name (e.g. 'patients', 'rooms')
 *   icon       — emoji icon
 *   color      — theme color
 *   titleKey   — i18n key for title
 *   columns    — array of {key, labelKey, render?}
 *   fields     — array of {key, labelKey, type, options?, required?}
 *   emptyForm  — default form values
 *   searchPlaceholderKey
 */
const SectorPage = ({
  model, icon='📋', color='#1a73e8',
  titleKey, title,
  columns=[], fields=[], emptyForm={}, searchPlaceholderKey,
  newLabel, editLabel,
  extraFilters
}) => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [items,  setItems]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [dialog, setDialog] = useState(false);
  const [form,   setForm]   = useState({...emptyForm});
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [snack,  setSnack]  = useState('');
  const [delId,  setDelId]  = useState(null);

  const pageTitle = title || t(titleKey) || model;
  const addLabel  = newLabel || (AR?`إضافة ${pageTitle}`:`New ${pageTitle}`);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const r = await api.get(`/api/sector/${model}${params}`);
      if (r.data.success) setItems(r.data.data || []);
    } catch(e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [model, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({...emptyForm}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (item) => {
    // Flatten nested objects for form editing
    const flat = {};
    const flatten = (obj, prefix='') => {
      Object.entries(obj).forEach(([k,v]) => {
        if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date))
          flatten(v, prefix?`${prefix}.${k}`:k);
        else flat[prefix?`${prefix}.${k}`:k] = v;
      });
    };
    flatten(item);
    setForm({...emptyForm, ...flat, _id:item._id});
    setEditId(item._id); setError(''); setDialog(true);
  };
  const close = () => { setDialog(false); setForm({...emptyForm}); setEditId(null); setError(''); };

  // Handle nested dot-notation form keys
  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(prev => {
      if (!k.includes('.')) return {...prev, [k]: val};
      const [parent, child] = k.split('.');
      return {...prev, [parent]: {...(prev[parent]||{}), [child]: val}};
    });
  };

  const getVal = (obj, key) => {
    if (!key.includes('.')) return obj[key] ?? '';
    const [parent, child] = key.split('.');
    return obj[parent]?.[child] ?? '';
  };

  const handleSave = async () => {
    const required = fields.filter(f=>f.required);
    for (const f of required) {
      if (!getVal(form, f.key)) { setError(`${t('common.required')}: ${f.label||t(f.labelKey)||f.key}`); return; }
    }
    setSaving(true); setError('');
    try {
      // Rebuild nested object from dot-notation keys
      const payload = {};
      Object.entries(form).forEach(([k,v]) => {
        if (k === '_id') return;
        if (k.includes('.')) {
          const [parent, child] = k.split('.');
          if (!payload[parent]) payload[parent] = {};
          payload[parent][child] = v;
        } else { payload[k] = v; }
      });

      if (editId) await api.put(`/api/sector/${model}/${editId}`, payload);
      else        await api.post(`/api/sector/${model}`, payload);
      setSnack(t('common.success')); close(); load();
    } catch(e) { setError(e.response?.data?.detail || e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/sector/${model}/${delId}`);
      setSnack(t('common.success')); setDelId(null); load();
    } catch(e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  // Render cell value with optional custom renderer
  const renderCell = (col, item) => {
    if (col.render) return col.render(item, AR);
    const val = col.key.split('.').reduce((o,k)=>o?.[k], item);
    if (col.type === 'status') {
      const colors = { active:'success', inactive:'default', completed:'success', cancelled:'error',
        available:'success', occupied:'error', pending:'warning', confirmed:'info',
        paid:'success', enrolled:'success', expired:'error', scheduled:'info', open:'warning' };
      return <Chip label={val||'—'} color={colors[val]||'default'} size="small" sx={{ fontSize:'0.7rem' }}/>;
    }
    if (col.type === 'date' && val) return new Date(val).toLocaleDateString(AR?'ar-SA':'en-GB');
    if (col.type === 'money' && val !== undefined) return `${(+val||0).toLocaleString()} ${AR?'ر.س':'SAR'}`;
    if (col.type === 'avatar') return (
      <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
        <Avatar sx={{ width:32,height:32,bgcolor:`${color}20`,color,fontSize:13,fontWeight:700 }}>
          {String(val||'?')[0]}
        </Avatar>
        <Typography variant="body2" fontWeight={600}>{val||'—'}</Typography>
      </Box>
    );
    return val ?? '—';
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Typography sx={{ fontSize:32 }}>{icon}</Typography>
            <Box>
              <Typography variant="h5" fontWeight={800}>{pageTitle}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'سجل':'records'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:color,'&:hover':{filter:'brightness(0.9)'}, borderRadius:2 }}>
              {addLabel}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        <TextField size="small"
          placeholder={`${t('common.search')}...`}
          value={search} onChange={e=>setSearch(e.target.value)}
          sx={{ mb:2, width:340 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18,color:'text.secondary' }}/></InputAdornment> }}/>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                {columns.map((col,i) => (
                  <TableCell key={i} sx={{ fontWeight:700, fontSize:'0.82rem' }}>
                    {col.label || t(col.labelKey) || col.key}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={columns.length+1} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : items.length===0 ? (
                <TableRow><TableCell colSpan={columns.length+1} align="center" sx={{ py:4, color:'text.secondary' }}>{t('common.noData')}</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow key={item._id} hover>
                  {columns.map((col,i) => (
                    <TableCell key={i}>{renderCell(col, item)}</TableCell>
                  ))}
                  <TableCell align="center">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={()=>openEdit(item)} sx={{ color:'#1a73e8' }}>
                        <Edit sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" onClick={()=>setDelId(item._id)} sx={{ color:'#e53935' }}>
                        <Delete sx={{ fontSize:16 }}/>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700} sx={{ borderBottom:'1px solid', borderColor:'divider', pb:1.5 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Typography sx={{ fontSize:22 }}>{icon}</Typography>
                {editId ? `${t('common.edit')} — ` : `+ `}{addLabel}
              </Box>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt:2 }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0 }}>
              {fields.map((field, i) => {
                const lbl = field.label || t(field.labelKey) || field.key;
                const val = getVal(form, field.key);
                if (field.type === 'select') return (
                  <Grid item xs={12} sm={field.sm||6} key={i}>
                    <TextField label={`${lbl}${field.required?' *':''}`} value={val} onChange={set(field.key)} fullWidth select>
                      {(field.options||[]).map(o => (
                        <MenuItem key={o.value||o} value={o.value||o}>
                          {AR ? (o.labelAr||o.label||o) : (o.label||o)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                );
                if (field.type === 'textarea') return (
                  <Grid item xs={12} sm={field.sm||12} key={i}>
                    <TextField label={lbl} value={val} onChange={set(field.key)} fullWidth multiline rows={field.rows||2}/>
                  </Grid>
                );
                if (field.type === 'divider') return (
                  <Grid item xs={12} key={i}>
                    <Box sx={{ borderBottom:'1px solid', borderColor:'divider', pb:0.5, mb:0.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{lbl}</Typography>
                    </Box>
                  </Grid>
                );
                return (
                  <Grid item xs={12} sm={field.sm||6} key={i}>
                    <TextField
                      label={`${lbl}${field.required?' *':''}`}
                      type={field.type||'text'}
                      value={val} onChange={set(field.key)}
                      fullWidth required={field.required}
                      InputLabelProps={field.type==='date'?{shrink:true}:undefined}
                      InputProps={field.endAdornment?{endAdornment:<InputAdornment position="end">{field.endAdornment}</InputAdornment>}:undefined}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3 }}>
            <Button onClick={close}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:color }}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {t('common.delete')}</DialogTitle>
          <DialogContent><Typography>{AR?'هل أنت متأكد من الحذف؟':'Confirm delete?'}</Typography></DialogContent>
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
};

export default SectorPage;
