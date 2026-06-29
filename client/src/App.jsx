import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { arSD } from '@mui/material/locale';
import './i18n';
import WasselAI from './components/AI/WasselAI';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

const LoginPage          = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage       = React.lazy(() => import('./pages/Register/RegisterPage'));
const AuthCallback       = React.lazy(() => import('./pages/AuthCallback/AuthCallback'));
const Dashboard          = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const ChatPage           = React.lazy(() => import('./pages/Chat/ChatPage'));
const CompanySettings    = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));
const InventoryPage      = React.lazy(() => import('./pages/Inventory/InventoryPage'));
const SuppliersPage      = React.lazy(() => import('./pages/Suppliers/SuppliersPage'));
const EmployeesPage      = React.lazy(() => import('./pages/Employees/EmployeesPage'));
const PurchaseOrdersPage = React.lazy(() => import('./pages/PurchaseOrders/PurchaseOrdersPage'));
const AccountingPage     = React.lazy(() => import('./pages/Accounting/AccountingPage'));
const BranchesPage       = React.lazy(() => import('./pages/Branches/BranchesPage'));
const WarehousesPage     = React.lazy(() => import('./pages/Warehouses/WarehousesPage'));
const ProjectsPage       = React.lazy(() => import('./pages/Projects/ProjectsPage'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
    <CircularProgress />
    <Typography color="text.secondary">جارٍ التحميل...</Typography>
  </Box>
);

const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary:    { main: '#1a73e8' },
    secondary:  { main: '#34a853' },
    background: { default: '#f5f7fa', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", "Arial", sans-serif',
    h4: { fontWeight: 800 }, h5: { fontWeight: 700 }, h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 } } },
    MuiPaper:  { styleOverrides: { root: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } } },
    MuiCard:   { styleOverrides: { root: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, bgcolor: '#f8f9fa' } } }
  }
}, arSD);

const AIWrapper = () => {
  const token = localStorage.getItem('token');
  const loc   = useLocation();
  const publicPaths = ['/login', '/register', '/auth/callback'];
  if (!token || publicPaths.includes(loc.pathname)) return null;
  return <WasselAI />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
            <Route path="/"  element={<Navigate to="/login" replace />} />
            <Route path="*"  element={<Navigate to="/login" replace />} />
          </Routes>
          <AIWrapper />
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
