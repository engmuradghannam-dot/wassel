/**
 * WasselERP Sound System
 * Manages all notification sounds with user preferences
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Sound preference keys in localStorage
const PREF_KEY = 'wasselSoundPrefs';

const DEFAULT_PREFS = {
  enabled:          true,
  volume:           0.7,        // 0-1
  messageSound:     'pop',      // pop | chime | bell | none
  callSound:        'ring',     // ring | vibrate | none  
  notifSound:       'chime',    // chime | bell | none
  desktopNotif:     true,       // browser notifications
  callVibrate:      true,       // vibrate on mobile
};

// Sound types mapping
const SOUND_TYPES = {
  message:     ['pop','chime','bell','none'],
  call:        ['ring','phone','none'],
  notification:['chime','bell','pop','none'],
};

export const SOUND_LABELS = {
  pop:    'نقرة',
  chime:  'رنة',
  bell:   'جرس',
  ring:   'رنين مكالمة',
  phone:  'هاتف',
  none:   'بدون صوت',
};

const play = (type, prefs) => {
  if (!prefs?.enabled) return;
  const S = window.WasselSounds;
  if (!S) return;

  try {
    switch(type) {
      case 'message':
        if (prefs.messageSound === 'pop')   S.message();
        if (prefs.messageSound === 'chime') S.notification();
        if (prefs.messageSound === 'bell')  S.callConnected();
        break;
      case 'sent':
        S.sent();
        break;
      case 'call_start':
        if (prefs.callSound !== 'none') S.startRing();
        if (prefs.callVibrate && navigator.vibrate) navigator.vibrate([300,200,300]);
        break;
      case 'call_stop':
        S.stopRing();
        break;
      case 'call_connected':
        S.stopRing();
        S.callConnected();
        break;
      case 'call_ended':
        S.callEnded();
        break;
      case 'notification':
        if (prefs.notifSound === 'chime') S.notification();
        if (prefs.notifSound === 'bell')  S.callConnected();
        if (prefs.notifSound === 'pop')   S.message();
        break;
      case 'meeting':
        S.meetingStart();
        break;
      case 'error':
        S.error();
        break;
    }
  } catch(e) {
    console.warn('Sound error:', e);
  }
};

const showDesktopNotification = async (title, body, icon, onClick) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission === 'granted') {
    const n = new Notification(title, { body, icon: icon || '/favicon.ico', badge: '/favicon.ico', tag: 'wassel-erp' });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
    setTimeout(() => n.close(), 5000);
    return n;
  }
};

export const useSounds = () => {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(PREF_KEY);
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch { return DEFAULT_PREFS; }
  });

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const savePrefs = useCallback((newPrefs) => {
    const merged = { ...prefsRef.current, ...newPrefs };
    setPrefs(merged);
    localStorage.setItem(PREF_KEY, JSON.stringify(merged));
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if (prefs.desktopNotif && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sound = useCallback((type) => {
    play(type, prefsRef.current);
  }, []);

  const notify = useCallback((title, body, onClick) => {
    if (prefsRef.current.desktopNotif) {
      showDesktopNotification(title, body, null, onClick);
    }
    sound('notification');
  }, [sound]);

  const incomingCall = useCallback((callerName, mode, onAccept, onReject) => {
    sound('call_start');
    if (prefsRef.current.desktopNotif) {
      showDesktopNotification(
        `مكالمة ${mode === 'video' ? 'فيديو' : 'صوتية'} واردة`,
        `${callerName} يتصل بك...`,
        null,
        onAccept
      );
    }
  }, [sound]);

  return { prefs, savePrefs, sound, notify, incomingCall, SOUND_TYPES, DEFAULT_PREFS };
};

export default useSounds;
