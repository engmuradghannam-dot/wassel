import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Divider, List, ListItemButton,
  ListItemIcon, ListItemText, Button, Alert, Snackbar, Grid,
  TextField, Switch, Tooltip, CircularProgress, IconButton, Link as MuiLink
} from '@mui/material';
import {
  Language, Notifications, VolumeUp, Security, Person, Check, Palette,
  LightMode, DarkMode, SettingsBrightness, SmartToy, Visibility, VisibilityOff,
  DeleteOutline, OpenInNew, VerifiedUser
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import LanguageSelector from '../../components/LanguageSelector';
import SoundSettings from '../../components/SoundSettings';
import { getCurrentLang } from '../../i18n/index';
import { useThemeSettings } from '../../contexts/ThemeSettingsContext';
import { ACCENT_COLORS } from '../../theme/appTheme';
import api from '../../services/api';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [section, setSection] = useState('language');
  const [snack,   setSnack]   = useState('');
  const { mode, setMode, accent, setAccent, syncError } = useThemeSettings();
  const AR = i18n.language === 'ar';

  const currentLang = getCurrentLang();

  const SECTIONS = [
    { id:'theme',        icon:<Palette/>,       label: AR ? 'المظهر والثيم' : 'Appearance & Theme' },
    { id:'ai',           icon:<SmartToy/>,      label: AR ? 'الذكاء الاصطناعي' : 'AI Assistant' },
    { id:'language',      icon:<Language/>,      label: t('settings.language')      || 'اللغة' },
    { id:'sounds',        icon:<VolumeUp/>,      label: t('settings.sounds')        || 'الأصوات' },
    { id:'notifications', icon:<Notifications/>, label: t('settings.notifications') || 'الإشعارات' },
    { id:'profile',       icon:<Person/>,        label: t('settings.profile')       || 'الملف الشخصي' },
    { id:'security',      icon:<Security/>,      label: t('settings.security')      || 'الأمان' },
  ];

  // ── مفتاح Claude API الخاص بالمستخدم ──────────────────────────────
  const [aiKeyStatus, setAiKeyStatus]   = useState(null); // { configured, maskedKey } | null (loading)
  const [aiKeyInput,  setAiKeyInput]    = useState('');
  const [aiKeySaving, setAiKeySaving]   = useState(false);
  const [aiKeyError,  setAiKeyError]    = useState('');
  const [showAiKey,   setShowAiKey]     = useState(false);

  useEffect(() => {
    if (section !== 'ai' || aiKeyStatus !== null) return;
    api.get('/api/ai/key-status')
      .then(r => setAiKeyStatus(r.data.data))
      .catch(() => setAiKeyStatus({ configured: false, maskedKey: null }));
  }, [section, aiKeyStatus]);

  const saveAiKey = async () => {
    if (!aiKeyInput.trim()) return;
    setAiKeySaving(true); setAiKeyError('');
    try {
      const r = await api.put('/api/ai/key', { apiKey: aiKeyInput.trim() });
      setAiKeyStatus({ configured: true, maskedKey: r.data.data.maskedKey });
      setAiKeyInput('');
      setSnack(AR ? 'تم حفظ مفتاح الذكاء الاصطناعي' : 'AI key saved');
    } catch (e) {
      setAiKeyError(e.response?.data?.message || (AR ? 'فشل حفظ المفتاح' : 'Failed to save key'));
    } finally { setAiKeySaving(false); }
  };

  const removeAiKey = async () => {
    setAiKeySaving(true);
    try {
      await api.delete('/api/ai/key');
      setAiKeyStatus({ configured: false, maskedKey: null });
      setSnack(AR ? 'تم حذف المفتاح' : 'Key removed');
    } catch (e) {
      setAiKeyError(e.response?.data?.message || (AR ? 'فشل حذف المفتاح' : 'Failed to remove key'));
    } finally { setAiKeySaving(false); }
  };

  return (
    <Layout>
      <Box sx={{ p:3, maxWidth:1000, mx:'auto' }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb:3 }}>
          ⚙️ {t('settings.title') || 'الإعدادات'}
        </Typography>

        <Grid container spacing={3}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ borderRadius:3 }}>
              <List dense disablePadding>
                {SECTIONS.map((sec, i) => (
                  <React.Fragment key={sec.id}>
                    <ListItemButton selected={section===sec.id}
                      onClick={()=>setSection(sec.id)}
                      sx={{ py:1.5, borderRadius:2, mx:0.5, my:0.3,
                        '&.Mui-selected':{ bgcolor:'#e8f0fe', color:'#1a73e8' } }}>
                      <ListItemIcon sx={{ minWidth:36, color:section===sec.id?'#1a73e8':'inherit' }}>
                        {sec.icon}
                      </ListItemIcon>
                      <ListItemText primary={
                        <Typography variant="body2" fontWeight={section===sec.id?700:400}>
                          {sec.label}
                        </Typography>
                      }/>
                    </ListItemButton>
                    {i<SECTIONS.length-1 && <Divider sx={{ mx:1 }}/>}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Content */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ borderRadius:3, p:3 }}>

              {/* ── THEME / APPEARANCE ── */}
              {section==='theme' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
                    <Palette sx={{ color:'#1a73e8' }}/>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {AR ? 'المظهر والثيم' : 'Appearance & Theme'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {AR ? 'مستوحى من تصميم Dynamics 365 و Windows 11' : 'Inspired by Dynamics 365 & Windows 11 design'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my:2.5 }}/>

                  {/* Mode: Light / Dark / Auto */}
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb:1.5 }}>
                    {AR ? 'وضع العرض' : 'Display mode'}
                  </Typography>
                  <Grid container spacing={2} sx={{ mb:3.5 }}>
                    {[
                      { id:'light', label: AR?'فاتح':'Light',  icon:<LightMode/>,
                        bg:'#faf9f8', fg:'#1f1f1f' },
                      { id:'dark',  label: AR?'داكن':'Dark',    icon:<DarkMode/>,
                        bg:'#1f1f1f', fg:'#ffffff' },
                      { id:'auto',  label: AR?'تلقائي (النظام)':'Auto (System)', icon:<SettingsBrightness/>,
                        bg:'linear-gradient(135deg,#faf9f8 50%,#1f1f1f 50%)', fg:'#1a73e8' },
                    ].map(opt => (
                      <Grid item xs={12} sm={4} key={opt.id}>
                        <Paper
                          onClick={() => { setMode(opt.id); setSnack(AR?'تم تحديث الثيم':'Theme updated'); }}
                          sx={{
                            cursor:'pointer', borderRadius:3, overflow:'hidden',
                            border:'2px solid', borderColor: mode===opt.id ? accent : 'divider',
                            transition:'all .15s', position:'relative',
                            '&:hover':{ borderColor: accent, transform:'translateY(-2px)' },
                          }}>
                          <Box sx={{ height:64, background:opt.bg, display:'flex',
                            alignItems:'center', justifyContent:'center' }}>
                            <Box sx={{ color:opt.fg, display:'flex' }}>{opt.icon}</Box>
                          </Box>
                          <Box sx={{ p:1.2, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <Typography variant="body2" fontWeight={600}>{opt.label}</Typography>
                            {mode===opt.id && <Check sx={{ fontSize:16, color:accent }}/>}
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ mb:2.5 }}/>

                  {/* Accent color */}
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb:0.5 }}>
                    {AR ? 'لون التمييز (Accent Color)' : 'Accent color'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb:1.5 }}>
                    {AR
                      ? 'نفس نظام ألوان Windows 11 — يُستخدم في الأزرار والنوافذ والعناصر النشطة'
                      : 'Same accent-color system as Windows 11 — used across buttons, windows and active elements'}
                  </Typography>
                  <Box sx={{ display:'flex', flexWrap:'wrap', gap:1.5, mb:3.5 }}>
                    {ACCENT_COLORS.map(c => (
                      <Tooltip key={c.id} title={AR ? c.nameAr : c.name}>
                        <Box
                          onClick={() => { setAccent(c.hex); setSnack(AR?'تم تحديث اللون':'Accent color updated'); }}
                          sx={{
                            width:40, height:40, borderRadius:'50%', bgcolor:c.hex,
                            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                            border:'2px solid', borderColor: accent===c.hex ? '#000' : 'transparent',
                            outline: accent===c.hex ? `2px solid ${c.hex}` : 'none',
                            outlineOffset:2,
                            transition:'transform .15s',
                            '&:hover':{ transform:'scale(1.1)' },
                          }}>
                          {accent===c.hex && <Check sx={{ color:'#fff', fontSize:18 }}/>}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>

                  <Divider sx={{ mb:2.5 }}/>

                  {/* Live "window" preview — mimics a Windows 11 / Fluent dialog */}
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb:1.5 }}>
                    {AR ? 'معاينة مباشرة' : 'Live preview'}
                  </Typography>
                  <Box sx={{
                    borderRadius:2, overflow:'hidden', border:'1px solid', borderColor:'divider',
                    borderTop: `2px solid ${accent}`, boxShadow:'0 6.4px 14.4px rgba(0,0,0,0.18)',
                    maxWidth:420,
                  }}>
                    <Box sx={{
                      px:2, py:1.2, bgcolor: mode==='dark' ? '#282828' : '#f3f2f1',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      borderBottom:'1px solid', borderColor:'divider',
                    }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: mode==='dark' ? '#fff' : '#1f1f1f' }}>
                        {AR ? 'أمر شراء جديد' : 'New Purchase Order'}
                      </Typography>
                      <Box sx={{ width:14, height:14, borderRadius:'50%', bgcolor: mode==='dark'?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)' }}/>
                    </Box>
                    <Box sx={{ p:2, bgcolor: mode==='dark' ? '#2b2b2b' : '#fff' }}>
                      <Typography variant="caption" sx={{ color: mode==='dark' ? 'rgba(255,255,255,0.6)' : 'text.secondary' }}>
                        {AR ? 'هذا مثال لشكل النوافذ في النظام' : 'This is how dialogs will look across the system'}
                      </Typography>
                      <Box sx={{ display:'flex', gap:1, mt:2, justifyContent:'flex-end' }}>
                        <Button size="small" sx={{ color: mode==='dark'?'rgba(255,255,255,0.7)':'inherit' }}>
                          {AR?'إلغاء':'Cancel'}
                        </Button>
                        <Button size="small" variant="contained" sx={{ bgcolor:accent, '&:hover':{ bgcolor:accent } }}>
                          {AR?'حفظ':'Save'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* ── AI ASSISTANT (Claude API key) ── */}
              {section==='ai' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1 }}>
                    <SmartToy sx={{ color:'#1a73e8' }}/>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {AR ? 'الذكاء الاصطناعي — WasselAI' : 'AI Assistant — WasselAI'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {AR
                          ? 'مدعوم بـ Claude من Anthropic — كل مستخدم يستخدم مفتاحه الخاص'
                          : 'Powered by Claude from Anthropic — each user brings their own key'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my:2.5 }}/>

                  {aiKeyStatus === null ? (
                    <Box sx={{ display:'flex', justifyContent:'center', py:4 }}><CircularProgress size={28}/></Box>
                  ) : (
                    <>
                      {aiKeyStatus.configured ? (
                        <Paper variant="outlined" sx={{ p:2, borderRadius:2, mb:3, display:'flex',
                          alignItems:'center', justifyContent:'space-between', bgcolor:'success.50',
                          borderColor:'success.main' }}>
                          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                            <VerifiedUser sx={{ color:'success.main' }}/>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {AR ? 'المفتاح مفعّل' : 'Key active'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {aiKeyStatus.maskedKey}
                              </Typography>
                            </Box>
                          </Box>
                          <Button size="small" color="error" startIcon={<DeleteOutline/>}
                            disabled={aiKeySaving} onClick={removeAiKey}>
                            {AR ? 'حذف' : 'Remove'}
                          </Button>
                        </Paper>
                      ) : (
                        <Alert severity="info" sx={{ mb:3, borderRadius:2 }}>
                          {AR
                            ? 'لم تُفعَّل بعد. أضف مفتاحك أدناه لتشغيل المساعد الذكي في كل صفحات النظام.'
                            : 'Not activated yet. Add your key below to enable the AI assistant across the system.'}
                        </Alert>
                      )}

                      {/* ── شرح كيفية الحصول على المفتاح ── */}
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb:1 }}>
                        {AR ? 'كيف تجلب مفتاح Claude API؟' : 'How to get a Claude API key'}
                      </Typography>
                      <Box component="ol" sx={{ pl:3, mb:1, '& li': { mb:0.8 } }}>
                        <Typography component="li" variant="body2">
                          {AR ? 'ادخل على ' : 'Go to '}
                          <MuiLink href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
                            sx={{ display:'inline-flex', alignItems:'center', gap:0.3 }}>
                            console.anthropic.com/settings/keys <OpenInNew sx={{ fontSize:14 }}/>
                          </MuiLink>
                          {AR ? ' وسجّل دخول أو أنشئ حساب جديد' : ' and sign in or create an account'}
                        </Typography>
                        <Typography component="li" variant="body2">
                          {AR ? 'من نفس الصفحة اضغط "Create Key" وأعطه اسم (مثلاً Wassel ERP)' : 'Click "Create Key" and name it (e.g. Wassel ERP)'}
                        </Typography>
                        <Typography component="li" variant="body2">
                          {AR ? 'انسخ المفتاح فورًا — يبدأ بـ ' : 'Copy it immediately — it starts with '}
                          <Typography component="span" fontFamily="monospace" fontWeight={700}>sk-ant-</Typography>
                          {AR ? ' (لن يُعرض مرة ثانية بعد إغلاق الصفحة)' : ' (it won\'t be shown again)'}
                        </Typography>
                        <Typography component="li" variant="body2">
                          {AR ? 'الصقه هنا واضغط حفظ' : 'Paste it below and click Save'}
                        </Typography>
                      </Box>
                      <Alert severity="warning" variant="outlined" sx={{ mb:3, borderRadius:2 }}>
                        {AR
                          ? 'استخدامك للمساعد يُحتسب من رصيدك الخاص في حساب Anthropic — راجع الأسعار من موقعهم. المفتاح يُخزَّن مشفّرًا ولا يظهر لأي شخص آخر، حتى مدير النظام.'
                          : 'Usage is billed to your own Anthropic account balance — check their pricing page. Your key is stored encrypted and never visible to anyone else, including system admins.'}
                      </Alert>

                      <Box sx={{ display:'flex', gap:1, alignItems:'flex-start' }}>
                        <TextField
                          fullWidth size="small"
                          type={showAiKey ? 'text' : 'password'}
                          label={AR ? 'مفتاح Claude API' : 'Claude API key'}
                          placeholder="sk-ant-api03-..."
                          value={aiKeyInput}
                          onChange={e => { setAiKeyInput(e.target.value); setAiKeyError(''); }}
                          error={!!aiKeyError}
                          helperText={aiKeyError}
                          InputProps={{
                            endAdornment: (
                              <IconButton size="small" onClick={() => setShowAiKey(s => !s)} tabIndex={-1}>
                                {showAiKey ? <VisibilityOff sx={{ fontSize:18 }}/> : <Visibility sx={{ fontSize:18 }}/>}
                              </IconButton>
                            ),
                          }}
                        />
                        <Button
                          variant="contained" sx={{ mt:0.2, minWidth:100 }}
                          disabled={aiKeySaving || !aiKeyInput.trim()}
                          onClick={saveAiKey}>
                          {aiKeySaving ? <CircularProgress size={20} color="inherit"/> : (AR ? 'حفظ' : 'Save')}
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>
              )}

              {/* ── LANGUAGE ── */}
              {section==='language' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2 }}>
                    <Language sx={{ color:'#1a73e8' }}/>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {t('settings.chooseLang') || 'اختر اللغة'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('settings.langNote') || 'سيتم تطبيق اللغة فوراً على جميع أجزاء النظام'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Active language banner */}
                  <Box sx={{ mb:2.5, p:2, bgcolor:'#e8f0fe', borderRadius:2,
                    display:'flex', alignItems:'center', gap:1.5,
                    border:'1px solid #c5cae9' }}>
                    <Typography sx={{ fontSize:28 }}>{currentLang.flag}</Typography>
                    <Box sx={{ flex:1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('settings.language') || 'اللغة الحالية'}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700} color="#1a73e8">
                        {currentLang.nativeName}
                      </Typography>
                    </Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5,
                      px:1.5, py:0.5, bgcolor:'#1a73e8', borderRadius:2 }}>
                      <Check sx={{ fontSize:14, color:'white' }}/>
                      <Typography variant="caption" sx={{ color:'white', fontWeight:700 }}>Active</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb:2 }}/>

                  {/* Full inline language grid */}
                  <LanguageSelector
                    variant="inline"
                    onSelect={() => setSnack(t('settings.languageChanged') || 'تم تغيير اللغة ✓')}
                  />

                  <Alert severity="info" sx={{ mt:3, borderRadius:2 }}>
                    <Typography variant="body2">
                      🌍 {i18n.language === 'ar'
                        ? 'النظام يدعم 11 لغة. اللغات العربية والأردية تعمل بنظام RTL تلقائياً.'
                        : 'The system supports 11 languages. Arabic and Urdu use RTL layout automatically.'}
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* ── SOUNDS ── */}
              {section==='sounds' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:3 }}>
                    <VolumeUp sx={{ color:'#1a73e8' }}/>
                    <Typography variant="h6" fontWeight={700}>
                      {t('settings.sounds') || 'إعدادات الصوت'}
                    </Typography>
                  </Box>
                  <SoundSettings/>
                </Box>
              )}

              {/* ── NOTIFICATIONS ── */}
              {section==='notifications' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:3 }}>
                    <Notifications sx={{ color:'#1a73e8' }}/>
                    <Typography variant="h6" fontWeight={700}>
                      {t('settings.notifications') || 'الإشعارات'}
                    </Typography>
                  </Box>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
                    {[
                      { key:'msg',   label: i18n.language==='ar' ? 'رسائل جديدة' : 'New messages' },
                      { key:'call',  label: i18n.language==='ar' ? 'مكالمات واردة' : 'Incoming calls' },
                      { key:'stock', label: i18n.language==='ar' ? 'تنبيهات المخزون' : 'Stock alerts' },
                      { key:'po',    label: i18n.language==='ar' ? 'أوامر الشراء' : 'Purchase orders' },
                    ].map(item => (
                      <Box key={item.key} sx={{ display:'flex', alignItems:'center',
                        justifyContent:'space-between', p:1.5, bgcolor:'#f8f9fa', borderRadius:2 }}>
                        <Typography variant="body2" fontWeight={500}>{item.label}</Typography>
                        <Switch defaultChecked size="small"/>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* ── PROFILE ── */}
              {section==='profile' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:3 }}>
                    <Person sx={{ color:'#1a73e8' }}/>
                    <Typography variant="h6" fontWeight={700}>
                      {t('settings.profile') || 'الملف الشخصي'}
                    </Typography>
                  </Box>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <TextField label={t('auth.fullName') || 'الاسم الكامل'}
                      defaultValue={localStorage.getItem('userName') || ''} fullWidth/>
                    <TextField label={t('auth.email') || 'البريد الإلكتروني'}
                      defaultValue="" fullWidth disabled
                      helperText={i18n.language==='ar'?'لا يمكن تغيير البريد الإلكتروني':'Email cannot be changed'}/>
                    <Button variant="contained" sx={{ alignSelf:'flex-start', borderRadius:2 }}
                      onClick={()=>setSnack(t('common.success')||'تم الحفظ')}>
                      {t('settings.saveChanges') || 'حفظ التغييرات'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* ── SECURITY ── */}
              {section==='security' && (
                <Box>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:3 }}>
                    <Security sx={{ color:'#1a73e8' }}/>
                    <Typography variant="h6" fontWeight={700}>
                      {t('settings.security') || 'الأمان'}
                    </Typography>
                  </Box>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
                    <TextField label={i18n.language==='ar'?'كلمة المرور الحالية':'Current Password'}
                      type="password" fullWidth/>
                    <TextField label={i18n.language==='ar'?'كلمة المرور الجديدة':'New Password'}
                      type="password" fullWidth/>
                    <TextField label={i18n.language==='ar'?'تأكيد كلمة المرور':'Confirm Password'}
                      type="password" fullWidth/>
                    <Button variant="contained" sx={{ alignSelf:'flex-start', borderRadius:2 }}>
                      {t('settings.changePassword') || 'تغيير كلمة المرور'}
                    </Button>
                  </Box>
                </Box>
              )}

            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity="success" onClose={()=>setSnack('')} sx={{ borderRadius:2 }}>
          {snack}
        </Alert>
      </Snackbar>

      {/* الاختيار يُطبَّق فورًا ومحليًا حتى لو فشلت المزامنة مع الحساب —
          هذا فقط يُعلمك لو الثيم ما راح يتبعك لجهاز/متصفح ثاني */}
      <Snackbar open={!!syncError} autoHideDuration={5000}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity="warning" sx={{ borderRadius:2 }}>
          {AR
            ? 'تم تطبيق الثيم على هذا الجهاز، لكن تعذّرت مزامنته مع حسابك'
            : 'Theme applied on this device, but syncing it to your account failed'}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
