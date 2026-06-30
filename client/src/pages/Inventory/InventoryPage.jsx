import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  Tooltip, Avatar, MenuItem
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Warning, Inventory2 } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const EMPTY = {
  name:'', nameEn:'', sku:'', barcode:'', category:'', categoryRef:'', unit:'',
  quantity:0, minQuantity:5, costPrice:0, salePrice:0, taxRate:15,
  description:'', isActive:true
};

const InventoryPage = () => {
  const { t, i18n } = useTranslation();
  const L = i18n.language;
  const AR = L === 'ar';

  const [items,   setItems]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog,  setDialog]  = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [snack,   setSnack]   = useState('');
  const [delId,   setDelId]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, catRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/categories').catch(() => ({ data:{ data:[] } })),
      ]);
      if (invRes.data.success) setItems(invRes.data.data || []);
      if (catRes.data.success) setCategories(catRes.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({...EMPTY}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (item) => { setForm({...item}); setEditId(item._id); setError(''); setDialog(true); };
  const close    = () => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k => e => setForm(p => ({...p, [k]: e.target.value}));

  const handleSave = async () => {
    if (!form.name.trim()) { setError(t('common.required')+': '+t('inventory.itemName')); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.categoryRef) delete payload.categoryRef; // تجنّب CastError على ObjectId فارغ
      if (editId) await api.put(`/api/inventory/${editId}`, payload);
      else        await api.post('/api/inventory', payload);
      setSnack(t('common.success'));
      close(); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/inventory/${delId}`);
      setSnack(t('common.success')); setDelId(null); load();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); setDelId(null); }
  };

  const filtered = items.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name?.toLowerCase().includes(q) || i.nameEn?.toLowerCase().includes(q) ||
           i.sku?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q);
  });

  // ── Labels (language-aware) ────────────────────────────────────
  const lbl = {
    title:      t('inventory.title')      || (AR?'المخزون':'Inventory'),
    newItem:    t('inventory.newItem')    || (AR?'إضافة منتج':'New Item'),
    itemName:   t('inventory.itemName')   || (AR?'اسم الصنف':'Item Name'),
    sku:        t('inventory.sku')        || 'SKU',
    qty:        t('inventory.quantity')   || (AR?'الكمية':'Quantity'),
    unit:       t('inventory.unit')       || (AR?'الوحدة':'Unit'),
    minQty:     t('inventory.minQty')     || (AR?'الحد الأدنى':'Min Qty'),
    cost:       t('inventory.costPrice')  || (AR?'سعر التكلفة':'Cost Price'),
    sell:       t('inventory.sellingPrice')|| (AR?'سعر البيع':'Selling Price'),
    category:   t('inventory.category')  || (AR?'الفئة':'Category'),
    status:     t('common.status')        || (AR?'الحالة':'Status'),
    actions:    t('common.actions')       || (AR?'إجراءات':'Actions'),
    search:     t('common.search')        || (AR?'بحث':'Search'),
    save:       t('common.save')          || (AR?'حفظ':'Save'),
    cancel:     t('common.cancel')        || (AR?'إلغاء':'Cancel'),
    edit:       t('common.edit')          || (AR?'تعديل':'Edit'),
    delete:     t('common.delete')        || (AR?'حذف':'Delete'),
    loading:    t('common.loading')       || (AR?'جارٍ التحميل...':'Loading...'),
    noData:     t('common.noData')        || (AR?'لا توجد بيانات':'No data'),
    lowStock:   t('inventory.lowStock')   || (AR?'مخزون منخفض':'Low Stock'),
    inStock:    t('inventory.inStock')    || (AR?'متوفر':'In Stock'),
    active:     t('common.active')        || (AR?'نشط':'Active'),
    inactive:   t('common.inactive')      || (AR?'غير نشط':'Inactive'),
    currency:   t('common.currency')      || (AR?'ر.س':'SAR'),
    description:t('common.notes')         || (AR?'الوصف':'Description'),
    tax:        AR?'نسبة الضريبة %':'Tax Rate %',
    barcode:    t('inventory.barcode')    || 'Barcode',
    nameAr:     AR?'الاسم بالعربي':'Name (Arabic)',
    nameEn:     AR?'الاسم بالإنجليزي':'Name (English)',
    warehouse:  t('inventory.warehouse')  || (AR?'المستودع':'Warehouse'),
    count:      AR?`${filtered.length} ${items.length!==filtered.length?`/ ${items.length}`:''} ${lbl?.unit||''}`:
                   `${filtered.length}${items.length!==filtered.length?` / ${items.length}`:''} items`,
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Inventory2 sx={{ fontSize:32, color:'#1a73e8' }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{lbl.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} {AR?'صنف':'items'} · {items.filter(i=>i.isActive).length} {lbl.active}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ borderRadius:2 }}>
              {lbl.newItem}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        {/* Search */}
        <TextField size="small" placeholder={`${lbl.search}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:340 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{lbl.itemName}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.sku}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.category}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.qty}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.cost}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.sell}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{lbl.status}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{lbl.actions}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4 }}>
                  <CircularProgress size={28}/>
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py:4, color:'text.secondary' }}>
                  {lbl.noData}
                </TableCell></TableRow>
              ) : filtered.map(item => {
                const isLow = item.quantity <= (item.minQuantity || 5);
                return (
                  <TableRow key={item._id} hover>
                    <TableCell>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                        <Avatar sx={{ width:32, height:32, bgcolor:'#1a73e820', color:'#1a73e8', fontSize:13, fontWeight:700 }}>
                          {item.name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                          {item.nameEn && <Typography variant="caption" color="text.secondary">{item.nameEn}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily:'monospace', bgcolor:'#f5f5f5', px:1, py:0.3, borderRadius:1 }}>
                        {item.sku || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.category ? <Chip label={item.category} size="small" sx={{ fontSize:'0.7rem' }}/> : '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                        {isLow && <Tooltip title={lbl.lowStock}><Warning sx={{ color:'error.main', fontSize:16 }}/></Tooltip>}
                        <Typography variant="body2" fontWeight={isLow?700:400} color={isLow?'error.main':'text.primary'}>
                          {item.quantity ?? 0} {item.unit || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{(item.costPrice||0).toLocaleString()} {lbl.currency}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{(item.salePrice||0).toLocaleString()} {lbl.currency}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.isActive ? lbl.active : lbl.inactive}
                        color={item.isActive?'success':'default'} size="small" sx={{ fontSize:'0.7rem' }}/>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={lbl.edit}>
                        <IconButton size="small" onClick={()=>openEdit(item)} sx={{ color:'#1a73e8' }}>
                          <Edit sx={{ fontSize:16 }}/>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={lbl.delete}>
                        <IconButton size="small" onClick={()=>setDelId(item._id)} sx={{ color:'#e53935' }}>
                          <Delete sx={{ fontSize:16 }}/>
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── ADD/EDIT DIALOG ── */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>
            {editId ? `✏️ ${lbl.edit}` : `+ ${lbl.newItem}`}
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.nameAr} value={form.name} onChange={set('name')} required/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.nameEn} value={form.nameEn||''} onChange={set('nameEn')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.sku} value={form.sku||''} onChange={set('sku')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.barcode} value={form.barcode||''} onChange={set('barcode')}/></Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label={lbl.category}
                  value={form.categoryRef || ''}
                  onChange={e => {
                    const catId = e.target.value;
                    const cat = categories.find(c => c._id === catId);
                    setForm(p => ({ ...p, categoryRef: catId, category: cat ? (AR ? cat.name : (cat.nameEn || cat.name)) : '' }));
                  }}>
                  <MenuItem value="">{AR ? 'بدون فئة' : 'No category'}</MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c._id} value={c._id}>{c.icon} {AR ? c.name : (c.nameEn || c.name)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={lbl.unit} value={form.unit||''} onChange={set('unit')}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label={lbl.qty} type="number" value={form.quantity} onChange={set('quantity')}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label={lbl.minQty} type="number" value={form.minQuantity} onChange={set('minQuantity')}/></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label={lbl.tax} type="number" value={form.taxRate||15} onChange={set('taxRate')} InputProps={{ endAdornment:<InputAdornment position="end">%</InputAdornment> }}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={`${lbl.cost} (${lbl.currency})`} type="number" value={form.costPrice||0} onChange={set('costPrice')}/></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label={`${lbl.sell} (${lbl.currency})`} type="number" value={form.salePrice||0} onChange={set('salePrice')}/></Grid>
              <Grid item xs={12}><TextField fullWidth label={lbl.description} multiline rows={2} value={form.description||''} onChange={set('description')}/></Grid>
              <Grid item xs={12}>
                <TextField fullWidth label={lbl.status} value={form.isActive?'active':'inactive'} select
                  onChange={e=>setForm(p=>({...p,isActive:e.target.value==='active'}))}>
                  <MenuItem value="active">{lbl.active}</MenuItem>
                  <MenuItem value="inactive">{lbl.inactive}</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3 }}>
            <Button onClick={close}>{lbl.cancel}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={18}/> : lbl.save}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── DELETE CONFIRM ── */}
        <Dialog open={!!delId} onClose={()=>setDelId(null)} maxWidth="xs" PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle fontWeight={700}>🗑️ {lbl.delete}</DialogTitle>
          <DialogContent>
            <Typography>{AR?'هل أنت متأكد من الحذف؟':'Are you sure you want to delete?'}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setDelId(null)}>{lbl.cancel}</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>{lbl.delete}</Button>
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

export default InventoryPage;
