import React, { useState } from 'react';
import {
  Box, Typography, Paper, Divider, List, ListItemButton,
  ListItemIcon, ListItemText, Button, Alert, Snackbar, Grid,
  TextField, Switch
} from '@mui/material';
import {
  Language, Notifications, VolumeUp, Security, Person, Check
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Layout from '../../components/Layout';
import LanguageSelector from '../../components/LanguageSelector';
import SoundSettings from '../../components/SoundSettings';
import { getCurrentLang } from '../../i18n/index';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [section, setSection] = useState('language');
  const [snack,   setSnack]   = useState('');

  const currentLang = getCurrentLang();

  const SECTIONS = [
    { id:'language',      icon:<Language/>,      label: t('settings.language')      || 'اللغة' },
    { id:'sounds',        icon:<VolumeUp/>,      label: t('settings.sounds')        || 'الأصوات' },
    { id:'notifications', icon:<Notifications/>, label: t('settings.notifications') || 'الإشعارات' },
    { id:'profile',       icon:<Person/>,        label: t('settings.profile')       || 'الملف الشخصي' },
    { id:'security',      icon:<Security/>,      label: t('settings.security')      || 'الأمان' },
  ];

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
    </Layout>
  );
}
