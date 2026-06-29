import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Alert, CircularProgress, Snackbar, InputAdornment,
  MenuItem, Avatar, Tooltip, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Search, Refresh, Hotel, Close, Save } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { getSectorColor } from '../../utils/sectorNav';

const ROOM_TYPES = [
  { value:'single', ar:'فردية', en:'Single' },
  { value:'double', ar:'مزدوجة', en:'Double' },
  { value:'suite',  ar:'جناح', en:'Suite' },
  { value:'family', ar:'عائلية', en:'Family' },
  { value:'deluxe', ar:'ديلوكس', en:'Deluxe' },
  { value:'studio', ar:'ستوديو', en:'Studio' },
  { value:'apartment', ar:'شقة', en:'Apartment' },
];
const ROOM_STATUS = [
  { value:'available',  ar:'متاحة',  en:'Available',  color:'#34a853' },
  { value:'occupied',   ar:'مشغولة', en:'Occupied',   color:'#e53935' },
  { value:'maintenance',ar:'صيانة',  en:'Maintenance',color:'#f57c00' },
  { value:'cleaning',   ar:'تنظيف',  en:'Cleaning',   color:'#7b1fa2' },
];
const FLOORS = Array.from({length:15},(_,i)=>i+1);
const EMPTY = { number:'', type:'single', floor:1, capacity:2, pricePerNight:0, description:'', status:'available', amenities:'' };

export default function RoomsPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';
  const color = getSectorColor(localStorage.getItem('userIndustry')||'hotel');

  const [items,  setItems]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [dialog, setDialog] = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [snack,  setSnack]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/sector/rooms');
      if (r.data.success) setItems(r.data.data||[]);
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{load();},[load]);

  const openAdd  = () => { setForm({...EMPTY}); setEditId(null); setError(''); setDialog(true); };
  const openEdit = (r)  => { setForm({...r}); setEditId(r._id); setError(''); setDialog(true); };
  const close    = ()   => { setDialog(false); setForm(EMPTY); setEditId(null); setError(''); };
  const set      = k=>e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    if (!form.number) { setError(AR?'رقم الغرفة مطلوب':'Room number required'); return; }
    setSaving(true);
    try {
      if (editId) await api.put(`/api/sector/rooms/${editId}`,form);
      else        await api.post('/api/sector/rooms',form);
      setSnack(t('common.success')||'تم'); close(); load();
    } catch(e) { setError(e.response?.data?.message||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(AR?'تأكيد الحذف؟':'Confirm delete?')) return;
    try { await api.delete(`/api/sector/rooms/${id}`); setSnack(t('common.success')||'تم'); load(); }
    catch(e) { setError(e.response?.data?.message||'خطأ'); }
  };

  const filtered = items.filter(r=>{
    if (!search) return true;
    const q = search.toLowerCase();
    return r.number?.toLowerCase().includes(q) || r.type?.toLowerCase().includes(q);
  });

  const statusInfo = (val) => ROOM_STATUS.find(s=>s.value===val)||ROOM_STATUS[0];
  const typeLabel  = (val) => { const t=ROOM_TYPES.find(t=>t.value===val); return t?(AR?t.ar:t.en):val; };

  // Stats
  const stats = {
    total:       items.length,
    available:   items.filter(r=>r.status==='available').length,
    occupied:    items.filter(r=>r.status==='occupied').length,
    maintenance: items.filter(r=>r.status==='maintenance').length,
  };

  return (
    <Layout>
      <Box sx={{ p:3 }}>
        {/* Header */}
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Hotel sx={{ fontSize:32, color }}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'الغرف':'Rooms'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.total} {AR?'غرفة':'rooms'} · {stats.available} {AR?'متاحة':'available'} · {stats.occupied} {AR?'مشغولة':'occupied'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <IconButton onClick={load} size="small"><Refresh/></IconButton>
            <Button variant="contained" startIcon={<Add/>} onClick={openAdd}
              sx={{ bgcolor:color, borderRadius:2 }}>
              {AR?'غرفة جديدة':'New Room'}
            </Button>
          </Box>
        </Box>

        {/* Stats cards */}
        <Grid container spacing={2} sx={{ mb:3 }}>
          {ROOM_STATUS.map(s => (
            <Grid item xs={6} sm={3} key={s.value}>
              <Card sx={{ borderLeft:`4px solid ${s.color}`, borderRadius:2 }}>
                <CardContent sx={{ py:1.5, '&:last-child':{pb:1.5} }}>
                  <Typography variant="h4" fontWeight={800} sx={{ color:s.color }}>
                    {items.filter(r=>r.status===s.value).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {AR?s.ar:s.en}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }} onClose={()=>setError('')}>{error}</Alert>}

        <TextField size="small" placeholder={`${t('common.search')||'Search'}...`} value={search}
          onChange={e=>setSearch(e.target.value)} sx={{ mb:2, width:300 }}
          InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18, color:'text.secondary' }}/></InputAdornment> }}/>

        <TableContainer component={Paper} sx={{ borderRadius:3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor:'#f8f9fa' }}>
                <TableCell sx={{ fontWeight:700 }}>{AR?'رقم الغرفة':'Room No.'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'النوع':'Type'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الطابق':'Floor'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'السعة':'Capacity'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'السعر/ليلة':'Price/Night'}</TableCell>
                <TableCell sx={{ fontWeight:700 }}>{AR?'الحالة':'Status'}</TableCell>
                <TableCell sx={{ fontWeight:700 }} align="center">{t('common.actions')||'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4 }}><CircularProgress size={28}/></TableCell></TableRow>
              ) : filtered.length===0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py:4, color:'text.secondary' }}>{AR?'لا توجد غرف':'No rooms found'}</TableCell></TableRow>
              ) : filtered.map(room => {
                const st = statusInfo(room.status);
                return (
                  <TableRow key={room._id} hover>
                    <TableCell>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                        <Avatar sx={{ width:32, height:32, bgcolor:`${color}20`, color, fontSize:13, fontWeight:700 }}>
                          {room.number}
                        </Avatar>
                        {room.amenities && <Typography variant="caption" color="text.secondary">{room.amenities}</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={typeLabel(room.type)} size="small" sx={{ fontSize:'0.72rem' }}/></TableCell>
                    <TableCell><Typography variant="body2">{AR?`الطابق ${room.floor}`:`Floor ${room.floor}`}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{room.capacity} 👤</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{(room.pricePerNight||0).toLocaleString()} {AR?'ر.س':'SAR'}</Typography></TableCell>
                    <TableCell>
                      <Chip label={AR?st.ar:st.en} size="small"
                        sx={{ bgcolor:`${st.color}18`, color:st.color, fontWeight:600, fontSize:'0.7rem' }}/>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')||'Edit'}>
                        <IconButton size="small" onClick={()=>openEdit(room)} sx={{ color:'#1a73e8' }}><Edit sx={{ fontSize:16 }}/></IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')||'Delete'}>
                        <IconButton size="small" onClick={()=>handleDelete(room._id)} sx={{ color:'#e53935' }}><Delete sx={{ fontSize:16 }}/></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog */}
        <Dialog open={dialog} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
          <DialogTitle sx={{ fontWeight:700, pb:0 }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {editId ? (AR?`✏️ تعديل الغرفة: ${form.number}`:`Edit Room: ${form.number}`) : (AR?'+ غرفة جديدة':'+ New Room')}
              <IconButton onClick={close} size="small"><Close sx={{ fontSize:18 }}/></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb:2, mt:1, borderRadius:2 }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt:0.5 }}>
              <Grid item xs={6} sm={4}>
                <TextField label={AR?'رقم الغرفة *':'Room Number *'} value={form.number} onChange={set('number')} fullWidth required/>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField label={AR?'الطابق':'Floor'} value={form.floor} onChange={set('floor')} fullWidth select>
                  {FLOORS.map(f=><MenuItem key={f} value={f}>{AR?`الطابق ${f}`:`Floor ${f}`}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField label={AR?'السعة (أشخاص)':'Capacity'} type="number" value={form.capacity} onChange={set('capacity')} fullWidth inputProps={{ min:1, max:20 }}/>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={AR?'نوع الغرفة':'Room Type'} value={form.type} onChange={set('type')} fullWidth select>
                  {ROOM_TYPES.map(tp=><MenuItem key={tp.value} value={tp.value}>{AR?tp.ar:tp.en}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={AR?'الحالة':'Status'} value={form.status} onChange={set('status')} fullWidth select>
                  {ROOM_STATUS.map(s=><MenuItem key={s.value} value={s.value}>{AR?s.ar:s.en}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField label={AR?'السعر لكل ليلة (ر.س)':'Price per Night (SAR)'} type="number" value={form.pricePerNight} onChange={set('pricePerNight')} fullWidth
                  inputProps={{ min:0 }}
                  InputProps={{ startAdornment:<InputAdornment position="start">💰</InputAdornment> }}/>
              </Grid>
              <Grid item xs={12}>
                <TextField label={AR?'المرافق والخدمات':'Amenities'} value={form.amenities||''} onChange={set('amenities')} fullWidth
                  placeholder={AR?'مثال: واي فاي، تلفزيون، مكيف':'e.g. WiFi, TV, AC'}/>
              </Grid>
              <Grid item xs={12}>
                <TextField label={AR?'وصف':'Description'} value={form.description||''} onChange={set('description')} fullWidth multiline rows={2}/>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px:3, py:2 }}>
            <Button onClick={close}>{t('common.cancel')||'Cancel'}</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              startIcon={saving?<CircularProgress size={16}/>:<Save/>}
              sx={{ bgcolor:color }}>
              {t('common.save')||'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{ vertical:'bottom',horizontal:'center' }}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
