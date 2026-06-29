import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import WasselAI from './components/AI/WasselAI';

const RTL_LANGS = ['ar', 'ur'];

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Lazy page imports
const LoginPage           = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage        = React.lazy(() => import('./pages/Register/RegisterPage'));
const AuthCallback        = React.lazy(() => import('./pages/AuthCallback/AuthCallback'));
const CompleteProfilePage = React.lazy(() => import('./pages/CompleteProfile/CompleteProfilePage'));
const Dashboard           = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const ChatPage            = React.lazy(() => import('./pages/Chat/ChatPage'));
const CompanySettings     = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));
const InventoryPage       = React.lazy(() => import('./pages/Inventory/InventoryPage'));
const SuppliersPage       = React.lazy(() => import('./pages/Suppliers/SuppliersPage'));
const EmployeesPage       = React.lazy(() => import('./pages/Employees/EmployeesPage'));
const PurchaseOrdersPage  = React.lazy(() => import('./pages/PurchaseOrders/PurchaseOrdersPage'));
const AccountingPage      = React.lazy(() => import('./pages/Accounting/AccountingPage'));
const BranchesPage        = React.lazy(() => import('./pages/Branches/BranchesPage'));
const WarehousesPage      = React.lazy(() => import('./pages/Warehouses/WarehousesPage'));
const ProjectsPage        = React.lazy(() => import('./pages/Projects/ProjectsPage'));
const RolesPage           = React.lazy(() => import('./pages/Roles/RolesPage'));
const SettingsPage        = React.lazy(() => import('./pages/Settings/SettingsPage'));

const PageLoader = () => (
  <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:2 }}>
    <CircularProgress sx={{ color:'#1a73e8' }}/>
    <Typography color="text.secondary" variant="body2">Loading...</Typography>
  </Box>
);

// Emotion caches — one for RTL, one for LTR
const rtlCache = createCache({ key:'muirtl', stylisPlugins:[prefixer, rtlPlugin] });
const ltrCache = createCache({ key:'muiltr', stylisPlugins:[prefixer] });

// Build MUI theme based on direction
const buildTheme = (dir) => createTheme({
  direction: dir,
  palette: {
    mode: 'light',
    primary:    { main: '#1a73e8' },
    secondary:  { main: '#34a853' },
    background: { default: '#f5f7fa', paper: '#ffffff' }
  },
  typography: {
    fontFamily: RTL_LANGS.includes(dir === 'rtl' ? 'ar' : 'en')
      ? '"Segoe UI", "Tahoma", "Arial", sans-serif'
      : '"Segoe UI", "Helvetica Neue", "Arial", sans-serif',
    h4: { fontWeight: 800 }, h5: { fontWeight: 700 }, h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton:    { styleOverrides: { root: { textTransform:'none', borderRadius:8, fontWeight:600 } } },
    MuiPaper:     { styleOverrides: { root: { boxShadow:'0 1px 4px rgba(0,0,0,0.08)' } } },
    MuiCard:      { styleOverrides: { root: { boxShadow:'0 2px 8px rgba(0,0,0,0.08)' } } },
    MuiTextField: { defaultProps: { size:'small' } },
  }
});

// AI floating button — only shown on private pages
const AIWrapper = () => {
  const token    = localStorage.getItem('token');
  const location = useLocation();
  const pub = ['/login','/register','/auth/callback','/complete-profile'];
  if (!token || pub.includes(location.pathname)) return null;
  return <WasselAI />;
};

// Inner app — watches language changes and rebuilds theme + cache
function AppInner() {
  const { i18n } = useTranslation();

  // derive direction from current language
  const getDir = (lng) => RTL_LANGS.includes(lng) ? 'rtl' : 'ltr';
  const [dir, setDir] = useState(() => getDir(i18n.language));

  useEffect(() => {
    const handler = (lng) => {
      const d = getDir(lng);
      setDir(d);
      document.documentElement.dir  = d;
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', handler);
    // Apply immediately for current language
    handler(i18n.language);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  const theme = buildTheme(dir);
  const cache = dir === 'rtl' ? rtlCache : ltrCache;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          {/* Public */}
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/auth/callback"    element={<AuthCallback />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />

          {/* Private */}
          <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/chat"             element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/company-settings" element={<PrivateRoute><CompanySettings /></PrivateRoute>} />
          <Route path="/inventory"        element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
          <Route path="/suppliers"        element={<PrivateRoute><SuppliersPage /></PrivateRoute>} />
          <Route path="/employees"        element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
          <Route path="/purchase-orders"  element={<PrivateRoute><PurchaseOrdersPage /></PrivateRoute>} />
          <Route path="/accounting"       element={<PrivateRoute><AccountingPage /></PrivateRoute>} />
          <Route path="/branches"         element={<PrivateRoute><BranchesPage /></PrivateRoute>} />
          <Route path="/warehouses"       element={<PrivateRoute><WarehousesPage /></PrivateRoute>} />
          <Route path="/projects"         element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
          <Route path="/roles"            element={<PrivateRoute><RolesPage /></PrivateRoute>} />
          <Route path="/settings"         element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
        <AIWrapper />
      </ThemeProvider>
    </CacheProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <AppInner />
      </Suspense>
    </Router>
  );
}
