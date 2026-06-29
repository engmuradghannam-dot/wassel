import React, { useState } from 'react';
import {
  Box, Typography, Switch, Slider, Select, MenuItem,
  FormControlLabel, Button, Divider, Chip, Alert,
  Paper, Grid, IconButton, Tooltip
} from '@mui/material';
import {
  VolumeUp, Notifications, Call, Message,
  PlayArrow, NotificationsOff, VolumeOff
} from '@mui/icons-material';
import { useSounds, SOUND_LABELS } from '../hooks/useSounds';

const SoundSettings = ({ onClose }) => {
  const { prefs, savePrefs, sound, SOUND_TYPES } = useSounds();
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const requestNotifPerm = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
    }
  };

  const testSound = (type) => {
    const tempPrefs = { ...prefs, enabled: true };
    window._soundTestPrefs = tempPrefs;
    sound(type);
  };

  return (
    <Box sx={{ p: 0.5 }}>

      {/* Master toggle */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: prefs.enabled ? '#e8f5e9' : '#fafafa', border: '1px solid', borderColor: prefs.enabled ? '#a5d6a7' : 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {prefs.enabled ? <VolumeUp color="success" /> : <VolumeOff color="disabled" />}
            <Typography fontWeight={700}>الأصوات {prefs.enabled ? 'مفعّلة' : 'معطّلة'}</Typography>
          </Box>
          <Switch checked={prefs.enabled} onChange={e => savePrefs({ enabled: e.target.checked })} color="success" />
        </Box>
      </Paper>

      {/* Volume */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <VolumeUp sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" fontWeight={600}>مستوى الصوت</Typography>
          <Chip label={`${Math.round(prefs.volume * 100)}%`} size="small" sx={{ ml: 'auto', fontSize: '0.7rem' }} />
        </Box>
        <Slider
          value={prefs.volume}
          onChange={(_, v) => savePrefs({ volume: v })}
          min={0} max={1} step={0.05}
          disabled={!prefs.enabled}
          sx={{ color: '#1a73e8' }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Message sound */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Message sx={{ fontSize: 18, color: '#1a73e8' }} />
          <Typography variant="body2" fontWeight={600}>صوت الرسائل</Typography>
          <Tooltip title="اختبار">
            <IconButton size="small" onClick={() => testSound('message')} disabled={!prefs.enabled}>
              <PlayArrow sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Select size="small" fullWidth value={prefs.messageSound}
          onChange={e => savePrefs({ messageSound: e.target.value })} disabled={!prefs.enabled}>
          {SOUND_TYPES.message.map(s => <MenuItem key={s} value={s}>{SOUND_LABELS[s]}</MenuItem>)}
        </Select>
      </Box>

      {/* Call sound */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Call sx={{ fontSize: 18, color: '#34a853' }} />
          <Typography variant="body2" fontWeight={600}>نغمة المكالمة</Typography>
          <Tooltip title="اختبار">
            <IconButton size="small" onClick={() => { testSound('call_start'); setTimeout(() => sound('call_stop'), 3000); }} disabled={!prefs.enabled}>
              <PlayArrow sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Select size="small" fullWidth value={prefs.callSound}
          onChange={e => savePrefs({ callSound: e.target.value })} disabled={!prefs.enabled}>
          {SOUND_TYPES.call.map(s => <MenuItem key={s} value={s}>{SOUND_LABELS[s]}</MenuItem>)}
        </Select>
        <FormControlLabel sx={{ mt: 1 }}
          control={<Switch size="small" checked={prefs.callVibrate} onChange={e => savePrefs({ callVibrate: e.target.checked })} />}
          label={<Typography variant="caption">اهتزاز عند المكالمة</Typography>}
        />
      </Box>

      {/* Notification sound */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Notifications sx={{ fontSize: 18, color: '#f57c00' }} />
          <Typography variant="body2" fontWeight={600}>صوت الإشعارات</Typography>
          <Tooltip title="اختبار">
            <IconButton size="small" onClick={() => testSound('notification')} disabled={!prefs.enabled}>
              <PlayArrow sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Select size="small" fullWidth value={prefs.notifSound}
          onChange={e => savePrefs({ notifSound: e.target.value })} disabled={!prefs.enabled}>
          {SOUND_TYPES.notification.map(s => <MenuItem key={s} value={s}>{SOUND_LABELS[s]}</MenuItem>)}
        </Select>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Desktop notifications */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications sx={{ fontSize: 18, color: '#7b1fa2' }} />
            <Typography variant="body2" fontWeight={600}>إشعارات المتصفح</Typography>
          </Box>
          <Switch checked={prefs.desktopNotif} onChange={e => savePrefs({ desktopNotif: e.target.checked })} color="secondary" />
        </Box>

        {notifPermission === 'default' && prefs.desktopNotif && (
          <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.8rem', mb: 1 }}
            action={<Button size="small" onClick={requestNotifPerm}>السماح</Button>}>
            اضغط السماح لتفعيل إشعارات المتصفح
          </Alert>
        )}
        {notifPermission === 'denied' && (
          <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
            الإشعارات محظورة. فعّلها من إعدادات المتصفح.
          </Alert>
        )}
        {notifPermission === 'granted' && (
          <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
            ✓ إشعارات المتصفح مفعّلة
          </Alert>
        )}
      </Box>

      {/* Test all */}
      <Button fullWidth variant="outlined" onClick={() => { testSound('meeting'); }} sx={{ mt: 2, borderRadius: 2 }} disabled={!prefs.enabled}>
        🔔 اختبار الأصوات
      </Button>
    </Box>
  );
};

export default SoundSettings;
