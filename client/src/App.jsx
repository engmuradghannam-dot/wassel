import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { arSD } from '@mui/material/locale';
import './i18n';

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

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>جارٍ التحميل...</Typography>
  </Box>
);

const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary:    { main: '#1a73e8' },
    secondary:  { main: '#34a853' },
    background: { default: '#f8f9fa', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Segoe UI", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton:    { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
    MuiPaper:     { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } }
  }
}, arSD);

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

            <Route path="/"  element={<Navigate to="/login" replace />} />
            <Route path="*"  element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
