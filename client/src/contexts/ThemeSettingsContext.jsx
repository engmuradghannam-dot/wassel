import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api from '../services/api';
import { DEFAULT_ACCENT } from '../theme/appTheme';

const ThemeSettingsContext = createContext(null);

const MODE_KEY   = 'wassel-theme-mode';    // 'light' | 'dark' | 'auto'
const ACCENT_KEY = 'wassel-theme-accent';  // hex color

const getSystemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;

export const ThemeSettingsProvider = ({ children }) => {
  const [mode, setModeState]     = useState(() => localStorage.getItem(MODE_KEY) || 'light');
  const [accent, setAccentState] = useState(() => localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT);
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  // Track OS-level light/dark changes for 'auto' mode
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler);
    };
  }, []);

  const resolvedMode = mode === 'auto' ? (systemDark ? 'dark' : 'light') : mode;

  // Keep <meta name="theme-color"> and html class in sync (for PWA chrome + native scrollbars)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedMode === 'dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolvedMode === 'dark' ? '#1f1f1f' : '#faf9f8');
  }, [resolvedMode]);

  const [syncError, setSyncError] = useState('');

  const persistToBackend = useCallback(async (patch) => {
    try {
      const token  = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) return;
      await api.put(`/api/users/${userId}`, patch, { timeout: 8000 });
      setSyncError('');
    } catch (err) {
      // Local selection already applied instantly (see setMode/setAccent
      // below) — this only affects whether the choice follows the user to
      // other devices. We surface it instead of failing silently so a real
      // backend problem is visible rather than looking like "it didn't save".
      setSyncError(err.response?.data?.message || err.message || 'sync failed');
    }
  }, []);

  const setMode = useCallback((m) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
    persistToBackend({ theme: m });
  }, [persistToBackend]);

  const setAccent = useCallback((hex) => {
    setAccentState(hex);
    localStorage.setItem(ACCENT_KEY, hex);
    persistToBackend({ accentColor: hex });
  }, [persistToBackend]);

  // Pick up the user's saved server-side preference once, on first login/load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await api.get('/api/auth/me');
        const u = res.data?.data;
        if (u?.theme && !localStorage.getItem(MODE_KEY))       setModeState(u.theme);
        if (u?.accentColor && !localStorage.getItem(ACCENT_KEY)) setAccentState(u.accentColor);
      } catch {
        // Not logged in yet / offline — keep local defaults
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    mode, resolvedMode, accent, setMode, setAccent, syncError,
  }), [mode, resolvedMode, accent, setMode, setAccent, syncError]);

  return (
    <ThemeSettingsContext.Provider value={value}>
      {children}
    </ThemeSettingsContext.Provider>
  );
};

export const useThemeSettings = () => {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeSettingsProvider');
  return ctx;
};

export default ThemeSettingsContext;
