import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Divider, Tab, Tabs
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor } from '../../utils/sectorNav';

/**
 * Generic sector page that renders a specific module for any industry
 * Configured via the `config` prop
 */
const SectorPage = ({ config }) => {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const industry    = localStorage.getItem('userIndustry') || 'trading_general';
  const sectorColor = getSectorColor(industry);

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [form,    setForm]    = useState({});
  const [editId,  setEditId]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [snack,   setSnack]   = useState('');
  const [delId,   setDelId]   = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(config.endpoint);
      if (r.data.success) setItems(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [config.endpoint, t]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ ...config.emptyForm }); setEditId(null); setError(''); setActiveTab(0); setDialog(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditId(item._id); setError(''); setActiveTab(0); setDialog(true); };
  const close    = () => { setDialog(false); setForm({}); setEditId(null); setError(''); };

  const handleSave = async () => {
    if (config.validate) {
      const err = config.validate(form, AR);
      if (err) { setError(err); return; }
    }
    setSaving(true); setError('');
    try {
      if (editId) await api.put(`${config.endpoint}/${editId}`, form);
      else        await api.post(config.endpoint, form);
      setSnack(t('common.success'));
      close(); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${config.endpoint}/${delId}`);
      setSnack(t('common.success')); setDelId(null); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  const filtered = config.filter ? config.filter(items, search) : items.filter(item => {
    if (!search) return true;
    return config.searchFields?.some(f =>
      String(item[f] || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  // Get form tabs
  const formTabs = config.formTabs || [{ label: AR ? 'المعلومات' : 'Information', fields: config.formFields }];

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Typography sx={{ fontSize:36 }}>{config.icon}</Typography>
            <Box>
              <Typography variant="h5" fontWeight={800}>{config.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {config.itemLabel || (AR?'سجل':'records')}
                {config.activeField && ` · ${items.filter(i=>i[config.activeField]).length} ${t('common.active')}`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:sectorColor, '&:hover':{ filter:'brightness(0.9)' }, borderRadius:2 }}>
              {config.addLabel || t('common.add')}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        {config.searchFields && (
          <TextField size="small" placeholder={`${t('common.search')}...`} value={search}
            onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:340 }}
            InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>
        )}

        {/* Extra filters */}
        {config.filters && (
          <Box sx={{ display:'flex', gap:1, mb:2 }}>
            {config.filters.map(f => (
              <Chip key={f.value} label={f.label} clickable
                variant={f.active ? 'filled' : 'outlined'}
                onClick={f.onClick} size="small"/>
            ))}
          </Box>
        )}

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                {config.columns.map(col => (
                  <TableCell key={col.key} sx={{ fontWeight:700, fontSize:'0.82rem' }} align={col.align||'left'}>
                    {col.label}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight:700, fontSize:'0.82rem' }} align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={config.columns.length+1} align="center" sx={{ py:4 }}>
                  <CircularProgress size={28} sx={{ color:sectorColor }}/>
                </TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={config.columns.length+1} align="center" sx={{ py:5, color:'text.secondary' }}>
                  <Typography variant="body2">{t('common.noData')}</Typography>
                  <Button size="small" onClick={openAdd} sx={{ mt:1, color:sectorColor }}>
                    + {config.addLabel}
                  </Button>
                </TableCell></TableRow>
              ) : filtered.map(item => (
                <TableRow key={item._id} hover>
                  {config.columns.map(col => (
                    <TableCell key={col.key} align={col.align||'left'}>
                      {col.render ? col.render(item, { t, AR, sectorColor }) : (
                        <Typography variant="body2">{item[col.key] ?? '—'}</Typography>
                      )}
                    </TableCell>
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

        {/* ── FORM DIALOG ── */}
        <Dialog open={dialog} onClose={close} maxWidth={config.dialogSize||'sm'} fullWidth
          PaperProps={{ sx:{ borderRadius:3, maxHeight:'90vh' } }}>
          <DialogTitle sx={{ pb:0 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Typography sx={{ fontSize:24 }}>{config.icon}</Typography>
                <Typography fontWeight={800}>
                  {editId ? `${t('common.edit')} ${config.itemLabel}` : config.addLabel}
                </Typography>
              </Box>
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
            {formTabs.length > 1 && (
              <Tabs value={activeTab} onChange={(_,v)=>setActiveTab(v)} sx={{ mt:1 }}>
                {formTabs.map((tab,i) => (
                  <Tab key={i} label={tab.label} sx={{ fontSize:'0.78rem', minWidth:0, px:2 }}/>
                ))}
              </Tabs>
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ overflow:'auto' }}>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0 }}>
              {formTabs[activeTab].fields.map(field => (
                <Grid item xs={12} sm={field.width||6} key={field.key}>
                  {field.type === 'select' ? (
                    <TextField fullWidth label={field.label} value={form[field.key]||''} select size="small"
                      onChange={e => setForm(p=>({...p,[field.key]:e.target.value}))}>
                      {field.options.map(opt => (
                        <MenuItem key={opt.value||opt} value={opt.value||opt}>
                          {opt.label||opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : field.type === 'textarea' ? (
                    <TextField fullWidth label={field.label} value={form[field.key]||''} multiline rows={field.rows||2} size="small"
                      onChange={e => setForm(p=>({...p,[field.key]:e.target.value}))}/>
                  ) : field.type === 'divider' ? (
                    <Box sx={{ gridColumn:'1/-1' }}>
                      <Divider sx={{ my:1 }}>
                        <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                      </Divider>
                    </Box>
                  ) : (
                    <TextField fullWidth label={field.label} type={field.type||'text'} size="small"
                      value={form[field.key]||''} required={field.required}
                      onChange={e => setForm(p=>({...p,[field.key]:e.target.value}))}
                      InputLabelProps={field.type==='date'?{ shrink:true }:undefined}
                      InputProps={field.inputProps}
                      helperText={field.helperText}/>
                  )}
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2 }}>
            {formTabs.length > 1 && (
              <Box sx={{ mr:'auto', display:'flex', gap:1 }}>
                {activeTab > 0 && (
                  <Button onClick={()=>setActiveTab(t=>t-1)} variant="outlined" size="small">
                    ← {AR?'السابق':'Previous'}
                  </Button>
                )}
                {activeTab < formTabs.length-1 && (
                  <Button onClick={()=>setActiveTab(t=>t+1)} variant="outlined" size="small">
                    {AR?'التالي':'Next'} →
                  </Button>
                )}
              </Box>
            )}
            <Button onClick={close}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:sectorColor, '&:hover':{ filter:'brightness(0.9)' } }}>
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── DELETE CONFIRM ── */}
        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {t('common.delete')}</DialogTitle>
          <DialogContent>
            <Typography>{AR?'هل أنت متأكد من الحذف؟':'Are you sure you want to delete?'}</Typography>
          </DialogContent>
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
