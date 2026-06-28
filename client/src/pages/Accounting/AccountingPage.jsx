import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Alert, CircularProgress, Divider, Tooltip
} from '@mui/material';
import {
  Add, AccountBalance, Receipt, Assessment, TrendingUp,
  CheckCircle, Cancel, Delete, Visibility, Refresh
} from '@mui/icons-material';
import axios from 'axios';
import Layout from '../../components/Layout';

const api = (url, opts = {}) => {
  const token = localStorage.getItem('token');
  return axios({ url: `/api/accounting${url}`, headers: { Authorization: `Bearer ${token}` }, ...opts });
};

const fmtAmount = (n) => Number(n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ar-SA') : '—';

const TYPE_LABELS = { asset: 'أصول', liability: 'خصوم', equity: 'حقوق ملكية', revenue: 'إيرادات', expense: 'مصروفات' };
const TYPE_COLORS = { asset: 'primary', liability: 'error', equity: 'secondary', revenue: 'success', expense: 'warning' };

// ─── Tab 1: Chart of Accounts ─────────────────────────────────────────────
const AccountsTab = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', nameEn: '', type: 'asset', category: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api('/accounts').then(r => setAccounts(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const seed = async () => {
    setSeeding(true);
    try {
      await api('/accounts/seed', { method: 'POST' });
      load();
    } catch (e) { alert(e.response?.data?.message || 'خطأ'); }
    setSeeding(false);
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await api('/accounts', { method: 'POST', data: form });
      setOpen(false);
      setForm({ code: '', name: '', nameEn: '', type: 'asset', category: '' });
      load();
    } catch (e) { setError(e.response?.data?.message || 'خطأ'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('حذف الحساب؟')) return;
    try { await api(`/accounts/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { alert(e.response?.data?.message || 'لا يمكن الحذف'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>إضافة حساب</Button>
        {accounts.length === 0 && (
          <Button variant="outlined" onClick={seed} disabled={seeding}>
            {seeding ? <CircularProgress size={18} /> : 'تحميل الحسابات الافتراضية'}
          </Button>
        )}
        <IconButton onClick={load}><Refresh /></IconButton>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell>الكود</TableCell>
              <TableCell>اسم الحساب</TableCell>
              <TableCell>النوع</TableCell>
              <TableCell align="left">الرصيد</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : accounts.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>لا توجد حسابات — اضغط "تحميل الحسابات الافتراضية"</TableCell></TableRow>
            ) : accounts.map(a => (
              <TableRow key={a._id} hover>
                <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>{a.code}</TableCell>
                <TableCell>{a.name}</TableCell>
                <TableCell><Chip label={TYPE_LABELS[a.type]} color={TYPE_COLORS[a.type]} size="small" /></TableCell>
                <TableCell align="left" sx={{ fontWeight: 600, color: a.balance >= 0 ? 'success.main' : 'error.main' }}>
                  {fmtAmount(a.balance)}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => del(a._id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة حساب جديد</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={4}><TextField fullWidth label="الكود" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></Grid>
            <Grid item xs={8}><TextField fullWidth label="اسم الحساب" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="الاسم (إنجليزي)" value={form.nameEn} onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="النوع" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Tab 2: Journal Entries ───────────────────────────────────────────────
const JournalTab = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ description: '', date: new Date().toISOString().split('T')[0], referenceType: 'manual', lines: [{ account: '', debit: 0, credit: 0, description: '' }, { account: '', debit: 0, credit: 0, description: '' }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api('/journal'), api('/accounts')]).then(([j, a]) => {
      setEntries(j.data.data);
      setAccounts(a.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addLine = () => setForm(p => ({ ...p, lines: [...p.lines, { account: '', debit: 0, credit: 0, description: '' }] }));
  const removeLine = (i) => setForm(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));
  const setLine = (i, field, val) => setForm(p => ({ ...p, lines: p.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const save = async () => {
    if (!isBalanced) { setError('مجموع المدين يجب أن يساوي مجموع الدائن'); return; }
    setSaving(true); setError('');
    try {
      await api('/journal', { method: 'POST', data: form });
      setOpen(false);
      load();
    } catch (e) { setError(e.response?.data?.message || 'خطأ'); }
    setSaving(false);
  };

  const post = async (id) => {
    try { await api(`/journal/${id}/post`, { method: 'PUT' }); load(); }
    catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const voidEntry = async (id) => {
    if (!window.confirm('إلغاء هذا القيد؟')) return;
    try { await api(`/journal/${id}/void`, { method: 'PUT' }); load(); }
    catch (e) { alert(e.response?.data?.message || 'خطأ'); }
  };

  const STATUS_COLOR = { draft: 'default', posted: 'success', voided: 'error' };
  const STATUS_LABEL = { draft: 'مسودة', posted: 'مرحّل', voided: 'ملغى' };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>قيد جديد</Button>
        <IconButton onClick={load}><Refresh /></IconButton>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell>رقم القيد</TableCell>
              <TableCell>التاريخ</TableCell>
              <TableCell>البيان</TableCell>
              <TableCell align="left">المدين</TableCell>
              <TableCell align="left">الدائن</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : entries.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>لا توجد قيود محاسبية بعد</TableCell></TableRow>
            ) : entries.map(e => (
              <TableRow key={e._id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>{e.entryNumber}</TableCell>
                <TableCell>{fmtDate(e.date)}</TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell align="left">{fmtAmount(e.totalDebit)}</TableCell>
                <TableCell align="left">{fmtAmount(e.totalCredit)}</TableCell>
                <TableCell><Chip label={STATUS_LABEL[e.status]} color={STATUS_COLOR[e.status]} size="small" /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="عرض التفاصيل"><IconButton size="small" onClick={() => setViewEntry(e)}><Visibility fontSize="small" /></IconButton></Tooltip>
                    {e.status === 'draft' && <Tooltip title="ترحيل"><IconButton size="small" color="success" onClick={() => post(e._id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>}
                    {e.status === 'posted' && <Tooltip title="إلغاء"><IconButton size="small" color="error" onClick={() => voidEntry(e._id)}><Cancel fontSize="small" /></IconButton></Tooltip>}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* New Entry Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>قيد محاسبي جديد</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid item xs={8}><TextField fullWidth label="البيان" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></Grid>
            <Grid item xs={4}><TextField fullWidth type="date" label="التاريخ" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell>الحساب</TableCell>
                <TableCell align="left">مدين</TableCell>
                <TableCell align="left">دائن</TableCell>
                <TableCell>البيان</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.lines.map((line, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <TextField select size="small" fullWidth value={line.account} onChange={e => setLine(i, 'account', e.target.value)}>
                      {accounts.map(a => <MenuItem key={a._id} value={a._id}>{a.code} — {a.name}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell align="left">
                    <TextField size="small" type="number" value={line.debit} onChange={e => setLine(i, 'debit', e.target.value)} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell align="left">
                    <TextField size="small" type="number" value={line.credit} onChange={e => setLine(i, 'credit', e.target.value)} sx={{ width: 100 }} />
                  </TableCell>
                  <TableCell><TextField size="small" fullWidth value={line.description} onChange={e => setLine(i, 'description', e.target.value)} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => removeLine(i)} disabled={form.lines.length <= 2}><Delete fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell><strong>الإجمالي</strong></TableCell>
                <TableCell align="left"><strong style={{ color: isBalanced ? 'green' : 'red' }}>{fmtAmount(totalDebit)}</strong></TableCell>
                <TableCell align="left"><strong style={{ color: isBalanced ? 'green' : 'red' }}>{fmtAmount(totalCredit)}</strong></TableCell>
                <TableCell colSpan={2}>
                  {!isBalanced && totalDebit > 0 && <Typography color="error" variant="caption">⚠ الميزان غير متساوٍ</Typography>}
                  {isBalanced && <Typography color="success.main" variant="caption">✓ الميزان متساوٍ</Typography>}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Button size="small" onClick={addLine} sx={{ mt: 1 }}>+ إضافة سطر</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={save} disabled={saving || !isBalanced}>{saving ? 'جاري الحفظ...' : 'حفظ القيد'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={!!viewEntry} onClose={() => setViewEntry(null)} maxWidth="sm" fullWidth>
        <DialogTitle>تفاصيل القيد — {viewEntry?.entryNumber}</DialogTitle>
        <DialogContent>
          {viewEntry && (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell>الحساب</TableCell>
                  <TableCell align="left">مدين</TableCell>
                  <TableCell align="left">دائن</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewEntry.lines?.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.account?.code} — {l.account?.name}</TableCell>
                    <TableCell align="left">{fmtAmount(l.debit)}</TableCell>
                    <TableCell align="left">{fmtAmount(l.credit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setViewEntry(null)}>إغلاق</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Tab 3: Financial Reports ─────────────────────────────────────────────
const ReportsTab = () => {
  const [report, setReport] = useState(null);
  const [type, setType] = useState('balance-sheet');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api(`/reports/${type}`).then(r => setReport(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {[
          { key: 'balance-sheet', label: 'الميزانية العمومية' },
          { key: 'income-statement', label: 'قائمة الدخل (أ/خ)' },
          { key: 'trial-balance', label: 'ميزان المراجعة' }
        ].map(r => (
          <Button key={r.key} variant={type === r.key ? 'contained' : 'outlined'} onClick={() => setType(r.key)}>{r.label}</Button>
        ))}
        <IconButton onClick={load}><Refresh /></IconButton>
      </Box>

      {loading && <CircularProgress />}

      {!loading && report && type === 'balance-sheet' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>الأصول</Typography>
              {report.assets?.map(a => (
                <Box key={a._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2">{a.code} — {a.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtAmount(a.balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: '2px solid' }}>
                <Typography fontWeight={700}>إجمالي الأصول</Typography>
                <Typography fontWeight={700} color="primary.main">{fmtAmount(report.totalAssets)}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'error.main' }}>الخصوم</Typography>
              {report.liabilities?.map(a => (
                <Box key={a._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2">{a.code} — {a.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtAmount(a.balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: '2px solid' }}>
                <Typography fontWeight={700}>إجمالي الخصوم</Typography>
                <Typography fontWeight={700} color="error.main">{fmtAmount(report.totalLiabilities)}</Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'secondary.main' }}>حقوق الملكية</Typography>
              {report.equity?.map(a => (
                <Box key={a._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2">{a.code} — {a.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtAmount(a.balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: '2px solid' }}>
                <Typography fontWeight={700}>إجمالي حقوق الملكية</Typography>
                <Typography fontWeight={700} color="secondary.main">{fmtAmount(report.totalEquity)}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {!loading && report && type === 'income-statement' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'success.main' }}>الإيرادات</Typography>
              {report.revenues?.map(a => (
                <Box key={a._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{a.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtAmount(a.balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: '2px solid' }}>
                <Typography fontWeight={700}>إجمالي الإيرادات</Typography>
                <Typography fontWeight={700} color="success.main">{fmtAmount(report.totalRevenue)}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: 'warning.main' }}>المصروفات</Typography>
              {report.expenses?.map(a => (
                <Box key={a._id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{a.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>{fmtAmount(a.balance)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 1, borderTop: '2px solid' }}>
                <Typography fontWeight={700}>إجمالي المصروفات</Typography>
                <Typography fontWeight={700} color="warning.main">{fmtAmount(report.totalExpenses)}</Typography>
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: report.netIncome >= 0 ? '#e8f5e9' : '#ffebee' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>{report.netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</Typography>
                <Typography variant="h6" fontWeight={700} color={report.netIncome >= 0 ? 'success.main' : 'error.main'}>
                  {fmtAmount(Math.abs(report.netIncome))}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {!loading && report && type === 'trial-balance' && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell>الكود</TableCell>
                <TableCell>اسم الحساب</TableCell>
                <TableCell align="left">مدين</TableCell>
                <TableCell align="left">دائن</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.accounts?.map(a => (
                <TableRow key={a._id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{a.code}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell align="left">{a.debit > 0 ? fmtAmount(a.debit) : '—'}</TableCell>
                  <TableCell align="left">{a.credit > 0 ? fmtAmount(a.credit) : '—'}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#f8f9fa', fontWeight: 700 }}>
                <TableCell colSpan={2}><strong>الإجمالي</strong></TableCell>
                <TableCell align="left"><strong>{fmtAmount(report.totalDebit)}</strong></TableCell>
                <TableCell align="left"><strong>{fmtAmount(report.totalCredit)}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// ─── Main AccountingPage ──────────────────────────────────────────────────
const AccountingPage = () => {
  const [tab, setTab] = useState(0);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>المحاسبة والمالية</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          دليل الحسابات — القيود المحاسبية — التقارير المالية
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
            <Tab icon={<AccountBalance />} label="دليل الحسابات" iconPosition="start" />
            <Tab icon={<Receipt />} label="القيود المحاسبية" iconPosition="start" />
            <Tab icon={<Assessment />} label="التقارير المالية" iconPosition="start" />
          </Tabs>
        </Paper>

        {tab === 0 && <AccountsTab />}
        {tab === 1 && <JournalTab />}
        {tab === 2 && <ReportsTab />}
      </Box>
    </Layout>
  );
};

export default AccountingPage;
