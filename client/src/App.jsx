import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { arSD } from '@mui/material/locale';
import './i18n';

// ─── Auth Guard ───────────────────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// ─── Lazy Pages ───────────────────────────────────────────────────────────
const LoginPage           = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage        = React.lazy(() => import('./pages/Register/RegisterPage')); // FIX: was missing
const Dashboard           = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const ChatPage            = React.lazy(() => import('./pages/Chat/ChatPage'));
const CompanySettings     = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));
const InventoryPage       = React.lazy(() => import('./pages/Inventory/InventoryPage'));
const SuppliersPage       = React.lazy(() => import('./pages/Suppliers/SuppliersPage'));
const EmployeesPage       = React.lazy(() => import('./pages/Employees/EmployeesPage'));
const PurchaseOrdersPage  = React.lazy(() => import('./pages/PurchaseOrders/PurchaseOrdersPage'));
const AccountingPage      = React.lazy(() => import('./pages/Accounting/AccountingPage')); // NEW

// ─── Loading ──────────────────────────────────────────────────────────────
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8f9fa' }}>
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
        <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>و</span>
      </Box>
      <CircularProgress size={28} sx={{ color: '#1a73e8' }} />
    </Box>
  </Box>
);

// ─── Theme ────────────────────────────────────────────────────────────────
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#1a73e8' },
    secondary: { main: '#34a853' },
    background: { default: '#f8f9fa', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Segoe UI", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
    MuiPaper: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } }
  }
}, arSD);

// ─── Auth Callback (Google OAuth) ─────────────────────────────────────────
// FIX: was defined in App but not imported → caused ReferenceError
const AuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');

  React.useEffect(() => {
    if (error || !token) {
      window.location.href = '/login?error=auth_failed';
      return;
    }
    localStorage.setItem('token', token);
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          localStorage.setItem('userId', d.data._id);
          localStorage.setItem('userName', d.data.name);
          localStorage.setItem('userRole', d.data.role);
        }
      })
      .catch(() => {})
      .finally(() => { window.location.href = '/dashboard'; });
  }, [token, error]);

  return <PageLoader />;
};

// ─── App ──────────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} /> {/* FIX: RegisterPage now imported */}

            {/* Auth callback (Google OAuth) */}
            <Route path="/auth/callback" element={<AuthCallback />} /> {/* FIX: AuthCallback now defined above */}

            {/* Private */}
            <Route path="/dashboard"        element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/chat"             element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/inventory"        element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
            <Route path="/suppliers"        element={<PrivateRoute><SuppliersPage /></PrivateRoute>} />
            <Route path="/employees"        element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
            <Route path="/purchase-orders"  element={<PrivateRoute><PurchaseOrdersPage /></PrivateRoute>} />
            <Route path="/company-settings" element={<PrivateRoute><CompanySettings /></PrivateRoute>} />
            <Route path="/accounting"       element={<PrivateRoute><AccountingPage /></PrivateRoute>} /> {/* NEW */}

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
