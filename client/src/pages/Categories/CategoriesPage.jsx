import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, MenuItem, Avatar
} from '@mui/material';
import { Add, Edit, Delete, Category as CategoryIcon, Refresh } from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const ICONS = ['📦','🍔','🥤','👕','💊','🔧','📱','🪑','🚗','🧴','📚','🎮'];
const empty = { name:'', nameEn:'', code:'', parent:'', description:'', color:'#1a73e8', icon:'📦', isActive:true };

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [snack, setSnack]       = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data.data || []);
    } catch (e) { setError(e.response?.data?.message || (AR?'فشل تحميل الفئات':'Failed to load')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openDialog = (cat = null) => {
    setEditing(cat);
    setForm(cat ? { ...cat, parent: cat.parent?._id || cat.parent || '' } : empty);
    setError(''); setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError(AR?'اسم الفئة مطلوب':'Name required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.parent) delete payload.parent;
      if (editing) { await api.put(`/api/categories/${editing._id}`, payload); setSnack(AR?'تم التحديث':'Updated'); }
      else         { await api.post('/api/categories', payload); setSnack(AR?'تم الإنشاء':'Created'); }
      setDialog(false); load();
    } catch (e) { setError(e.response?.data?.detail || e.response?.data?.message || (AR?'فشل الحفظ':'Save failed')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'حذف هذه الفئة؟':'Delete this category?')) return;
    try { await api.delete(`/api/categories/${id}`); setSnack(AR?'تم الحذف':'Deleted'); load(); }
    catch (e) { setError(e.response?.data?.message || (AR?'فشل الحذف':'Delete failed')); }
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <CategoryIcon sx={{ fontSize:32, color:'#1a73e8' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'فئات المخزون':'Inventory Categories'}</Typography>
              <Typography variant="caption" color="text.secondary">{categories.length} {AR?'فئة':'categories'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={()=>openDialog()} sx={{ bgcolor:'#1a73e8', borderRadius:2 }}>
              {AR?'+ فئة جديدة':'+ New Category'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الفئة':'Category'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الكود':'Code'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الفئة الأم':'Parent'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell align="center">—</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={5} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :categories.length===0?<TableRow><TableCell colSpan={5} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد فئات':'No categories'}</TableCell></TableRow>
              :categories.map(c=>(
                <TableRow key={c._id} hover>
                  <TableCell>
                    <Box sx={{display:'flex',alignItems:'center',gap:1}}>
                      <Avatar sx={{width:30,height:30,bgcolor:`${c.color}20`,fontSize:15}}>{c.icon}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" sx={{fontFamily:'monospace'}}>{c.code}</Typography></TableCell>
                  <TableCell>{c.parent?.name||'—'}</TableCell>
                  <TableCell><Chip label={c.isActive?(AR?'فعّال':'Active'):(AR?'معطّل':'Inactive')} size="small" color={c.isActive?'success':'default'}/></TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={()=>openDialog(c)} sx={{color:'#1a73e8'}}><Edit sx={{fontSize:16}}/></IconButton>
                    <IconButton size="small" onClick={()=>handleDelete(c._id)} sx={{color:'#e53935'}}><Delete sx={{fontSize:16}}/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={dialog} onClose={()=>setDialog(false)} maxWidth="sm" fullWidth PaperProps={{sx:{borderRadius:3}}}>
          <DialogTitle fontWeight={800}>{editing?(AR?'تعديل فئة':'Edit Category'):(AR?'فئة جديدة':'New Category')}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}
            <Grid container spacing={2} sx={{mt:0.5}}>
              <Grid item xs={12} sm={6}><TextField fullWidth label={`${AR?'الاسم':'Name'} *`} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Name (EN)" value={form.nameEn} onChange={e=>setForm(p=>({...p,nameEn:e.target.value}))}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={AR?'الفئة الأم (اختياري)':'Parent (optional)'} value={form.parent} onChange={e=>setForm(p=>({...p,parent:e.target.value}))} select>
                <MenuItem value=""><em>{AR?'بدون':'None'}</em></MenuItem>
                {categories.filter(c=>c._id!==editing?._id).map(c=><MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={AR?'الأيقونة':'Icon'} value={form.icon} onChange={e=>setForm(p=>({...p,icon:e.target.value}))} select>
                {ICONS.map(i=><MenuItem key={i} value={i}>{i}</MenuItem>)}
              </TextField></Grid>
              <Grid item xs={12}><TextField fullWidth label={AR?'الوصف':'Description'} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} multiline rows={2}/></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{px:3,py:2}}>
            <Button onClick={()=>setDialog(false)}>{AR?'إلغاء':'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{bgcolor:'#1a73e8'}}>
              {saving?<CircularProgress size={18} color="inherit"/>:(AR?'حفظ':'Save')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
