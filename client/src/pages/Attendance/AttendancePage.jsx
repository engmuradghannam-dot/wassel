import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Chip, Alert, CircularProgress, Snackbar, Card, CardContent
} from '@mui/material';
import { AccessTime, Login, Logout, Refresh } from '@mui/icons-material';
import Layout from '../../components/Layout';
import api from '../../services/api';

const STATUS_COLOR = { present:'success', absent:'error', late:'warning', half_day:'warning', on_leave:'info', holiday:'default', weekend:'default' };
const STATUS_AR = { present:'حاضر', absent:'غائب', late:'متأخر', half_day:'نصف يوم', on_leave:'إجازة', holiday:'عطلة', weekend:'نهاية أسبوع' };

export default function AttendancePage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [records, setRecords] = useState([]);
  const [today, setToday]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [snack, setSnack]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/attendance');
      setRecords(r.data.data||[]);
      const todayStr = new Date().toDateString();
      setToday((r.data.data||[]).find(rec => new Date(rec.date).toDateString()===todayStr));
    } catch (e) { setError(e.response?.data?.message||(AR?'فشل التحميل':'Failed')); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const handleCheckIn = async () => {
    setBusy(true); setError('');
    try { await api.post('/api/attendance/check-in'); setSnack(AR?'تم تسجيل الحضور':'Checked in'); load(); }
    catch (e) { setError(e.response?.data?.message||(AR?'فشل':'Failed')); }
    finally { setBusy(false); }
  };

  const handleCheckOut = async () => {
    setBusy(true); setError('');
    try { await api.post('/api/attendance/check-out'); setSnack(AR?'تم تسجيل الانصراف':'Checked out'); load(); }
    catch (e) { setError(e.response?.data?.message||(AR?'فشل':'Failed')); }
    finally { setBusy(false); }
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString(AR?'ar-SA':'en-US',{hour:'2-digit',minute:'2-digit'}) : '—';

  return (
    <Layout>
      <Box sx={{p:3}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',mb:3}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1.5}}>
            <AccessTime sx={{fontSize:32,color:'#00897b'}}/>
            <Box>
              <Typography variant="h5" fontWeight={800}>{AR?'الحضور والانصراف':'Attendance'}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date().toLocaleDateString(AR?'ar-SA':'en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</Typography>
            </Box>
          </Box>
          <IconButton onClick={load} size="small"><Refresh/></IconButton>
        </Box>

        {error&&<Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

        {/* Quick check-in/out card */}
        <Card sx={{mb:3,borderRadius:3,bgcolor:'#f0f9f7',border:'1px solid #00897b30'}}>
          <CardContent sx={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:2}}>
            <Box>
              <Typography variant="body2" color="text.secondary">{AR?'وقت الحضور':'Check-in'}</Typography>
              <Typography variant="h5" fontWeight={800}>{fmtTime(today?.checkIn)}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">{AR?'وقت الانصراف':'Check-out'}</Typography>
              <Typography variant="h5" fontWeight={800}>{fmtTime(today?.checkOut)}</Typography>
            </Box>
            <Box sx={{display:'flex',gap:1.5}}>
              <Button variant="contained" size="large" startIcon={<Login/>} disabled={busy||!!today?.checkIn}
                onClick={handleCheckIn} sx={{bgcolor:'#34a853',borderRadius:3,px:3}}>
                {AR?'تسجيل حضور':'Check In'}
              </Button>
              <Button variant="contained" size="large" startIcon={<Logout/>} disabled={busy||!today?.checkIn||!!today?.checkOut}
                onClick={handleCheckOut} sx={{bgcolor:'#e53935',borderRadius:3,px:3}}>
                {AR?'تسجيل انصراف':'Check Out'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <TableContainer component={Paper} sx={{borderRadius:3}}>
          <Table>
            <TableHead>
              <TableRow sx={{bgcolor:'#f8f9fa'}}>
                <TableCell sx={{fontWeight:700}}>{AR?'التاريخ':'Date'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحضور':'In'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الانصراف':'Out'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'ساعات العمل':'Hours'}</TableCell>
                <TableCell sx={{fontWeight:700}}>{AR?'الحالة':'Status'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading?<TableRow><TableCell colSpan={5} align="center" sx={{py:5}}><CircularProgress size={28}/></TableCell></TableRow>
              :records.length===0?<TableRow><TableCell colSpan={5} align="center" sx={{py:5,color:'text.secondary'}}>{AR?'لا توجد سجلات':'No records'}</TableCell></TableRow>
              :records.map(r=>(
                <TableRow key={r._id} hover>
                  <TableCell>{new Date(r.date).toLocaleDateString(AR?'ar-SA':'en-GB')}</TableCell>
                  <TableCell>{fmtTime(r.checkIn)}</TableCell>
                  <TableCell>{fmtTime(r.checkOut)}</TableCell>
                  <TableCell>{r.workedHours||0} {AR?'ساعة':'h'}</TableCell>
                  <TableCell><Chip label={AR?STATUS_AR[r.status]:r.status} color={STATUS_COLOR[r.status]} size="small" sx={{fontSize:'0.7rem'}}/></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity="success" onClose={()=>setSnack('')} sx={{borderRadius:2}}>{snack}</Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
}
