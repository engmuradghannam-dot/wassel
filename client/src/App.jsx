import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider }    from '@emotion/react';
import createCache          from '@emotion/cache';
import { prefixer }         from 'stylis';
import rtlPlugin            from 'stylis-plugin-rtl';
import CssBaseline          from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation }   from 'react-i18next';
import './i18n/index';
import WasselAI             from './components/AI/WasselAI';

const RTL_LANGS = ['ar','ur'];

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// ── Core pages ────────────────────────────────────────────────────────────
const LoginPage          = React.lazy(() => import('./pages/Login/LoginPage'));
const RegisterPage       = React.lazy(() => import('./pages/Register/RegisterPage'));
const AuthCallback       = React.lazy(() => import('./pages/AuthCallback/AuthCallback'));
const CompleteProfile    = React.lazy(() => import('./pages/CompleteProfile/CompleteProfilePage'));
const Dashboard          = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const SettingsPage       = React.lazy(() => import('./pages/Settings/SettingsPage'));
const CompanySettings    = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));
const ChatPage           = React.lazy(() => import('./pages/Chat/ChatPage'));
const RolesPage          = React.lazy(() => import('./pages/Roles/RolesPage'));
const UsersPage          = React.lazy(() => import('./pages/Users/UsersPage'));

// ── Core business pages (all sectors) ────────────────────────────────────
const SuppliersPage      = React.lazy(() => import('./pages/Suppliers/SuppliersPage'));
const PurchaseOrdersPage = React.lazy(() => import('./pages/PurchaseOrders/PurchaseOrdersPage'));
const InventoryPage      = React.lazy(() => import('./pages/Inventory/InventoryPage'));
const EmployeesPage      = React.lazy(() => import('./pages/Employees/EmployeesPage'));
const AccountingPage     = React.lazy(() => import('./pages/Accounting/AccountingPage'));
const BranchesPage       = React.lazy(() => import('./pages/Branches/BranchesPage'));
const WarehousesPage     = React.lazy(() => import('./pages/Warehouses/WarehousesPage'));
const ProjectsPage       = React.lazy(() => import('./pages/Projects/ProjectsPage'));
const CustomersPage      = React.lazy(() => import('./pages/Customers/CustomersPage'));
const SalesOrdersPage    = React.lazy(() => import('./pages/SalesOrders/SalesOrdersPage'));

// ── Sector-specific pages ─────────────────────────────────────────────────
const RoomsPage            = React.lazy(() => import('./pages/Sector/RoomsPage'));
const BookingsPage         = React.lazy(() => import('./pages/Sector/BookingsPage'));
const PatientsPage         = React.lazy(() => import('./pages/Sector/PatientsPage'));
const AppointmentsPage     = React.lazy(() => import('./pages/Sector/AppointmentsPage'));
const StudentsPage         = React.lazy(() => import('./pages/Sector/StudentsPage'));
const GradesPage           = React.lazy(() => import('./pages/Sector/GradesPage'));
const MembershipsPage      = React.lazy(() => import('./pages/Sector/MembershipsPage'));
const TablesPage           = React.lazy(() => import('./pages/Sector/TablesPage'));
const RestaurantOrdersPage = React.lazy(() => import('./pages/Sector/RestaurantOrdersPage'));
const PropertiesPage       = React.lazy(() => import('./pages/Sector/PropertiesPage'));
const LeasesPage           = React.lazy(() => import('./pages/Sector/LeasesPage'));
const SalonAppointmentsPage= React.lazy(() => import('./pages/Sector/SalonAppointmentsPage'));
const PurchaseRequestsPage  = React.lazy(() => import('./pages/PurchaseRequests/PurchaseRequestsPage'));
const LegalPage             = React.lazy(() => import('./pages/Legal/LegalPage'));
const ContractsPage         = React.lazy(() => import('./pages/Contracts/ContractsPage'));
const GoogleSetupPage        = React.lazy(() => import('./pages/GoogleSetup/GoogleSetupPage'));
const MailPage               = React.lazy(() => import('./pages/Mail/MailPage'));

const Loader = () => (
  <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column', gap:2 }}>
    <CircularProgress sx={{ color:'#1a73e8' }}/>
    <Typography color="text.secondary" variant="body2">Loading...</Typography>
  </Box>
);

const rtlCache = createCache({ key:'muirtl', stylisPlugins:[prefixer, rtlPlugin] });
const ltrCache = createCache({ key:'muiltr', stylisPlugins:[prefixer] });

const buildTheme = (dir) => createTheme({
  direction: dir,
  palette: {
    mode:'light',
    primary:{ main:'#1a73e8' },
    secondary:{ main:'#34a853' },
    background:{ default:'#f5f7fa', paper:'#ffffff' }
  },
  typography: {
    fontFamily: dir==='rtl'
      ? '"Segoe UI","Tahoma","Arial",sans-serif'
      : '"Segoe UI","Helvetica Neue","Arial",sans-serif',
    h4:{ fontWeight:800 }, h5:{ fontWeight:700 }, h6:{ fontWeight:600 }
  },
  shape:{ borderRadius:10 },
  components:{
    MuiButton:{ styleOverrides:{ root:{ textTransform:'none', borderRadius:8, fontWeight:600 } } },
    MuiTextField:{ defaultProps:{ size:'small' } },
  }
});

const AIWrapper = () => {
  const token    = localStorage.getItem('token');
  const location = useLocation();
  const pub      = ['/login','/register','/auth/callback','/complete-profile'];
  if (!token || pub.includes(location.pathname)) return null;
  return <WasselAI/>;
};

function AppInner() {
  const { i18n } = useTranslation();
  const getDir   = (lng) => RTL_LANGS.includes(lng) ? 'rtl' : 'ltr';
  const [dir, setDir] = useState(() => getDir(i18n.language));

  useEffect(() => {
    const h = (lng) => {
      const d = getDir(lng);
      setDir(d);
      document.documentElement.dir  = d;
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', h);
    h(i18n.language);
    return () => i18n.off('languageChanged', h);
  }, [i18n]);

  const theme = buildTheme(dir);
  const cache = dir==='rtl' ? rtlCache : ltrCache;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <Routes>
          {/* Public */}
          <Route path="/login"            element={<LoginPage/>}/>
          <Route path="/register"         element={<RegisterPage/>}/>
          <Route path="/auth/callback"    element={<AuthCallback/>}/>
          <Route path="/google-setup"     element={<GoogleSetupPage/>}/>
          <Route path="/complete-profile" element={<CompleteProfile/>}/>

          {/* Core — all sectors */}
          <Route path="/dashboard"         element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
          <Route path="/settings"          element={<PrivateRoute><SettingsPage/></PrivateRoute>}/>
          <Route path="/company-settings"  element={<PrivateRoute><CompanySettings/></PrivateRoute>}/>
          <Route path="/chat"              element={<PrivateRoute><ChatPage/></PrivateRoute>}/>
          <Route path="/mail"              element={<PrivateRoute><MailPage/></PrivateRoute>}/>
          <Route path="/roles"             element={<PrivateRoute><RolesPage/></PrivateRoute>}/>
          <Route path="/users"             element={<PrivateRoute><UsersPage/></PrivateRoute>}/>
          <Route path="/accounting"        element={<PrivateRoute><AccountingPage/></PrivateRoute>}/>
          <Route path="/employees"         element={<PrivateRoute><EmployeesPage/></PrivateRoute>}/>
          <Route path="/branches"          element={<PrivateRoute><BranchesPage/></PrivateRoute>}/>

          {/* Trade / General */}
          <Route path="/inventory"         element={<PrivateRoute><InventoryPage/></PrivateRoute>}/>
          <Route path="/suppliers"         element={<PrivateRoute><SuppliersPage/></PrivateRoute>}/>
          <Route path="/purchase-orders"   element={<PrivateRoute><PurchaseOrdersPage/></PrivateRoute>}/>
          <Route path="/customers"         element={<PrivateRoute><CustomersPage/></PrivateRoute>}/>
          <Route path="/sales-orders"      element={<PrivateRoute><SalesOrdersPage/></PrivateRoute>}/>
          <Route path="/warehouses"        element={<PrivateRoute><WarehousesPage/></PrivateRoute>}/>
          <Route path="/projects"          element={<PrivateRoute><ProjectsPage/></PrivateRoute>}/>

          {/* Hotel / Hospitality */}
          <Route path="/rooms"             element={<PrivateRoute><RoomsPage/></PrivateRoute>}/>
          <Route path="/bookings"          element={<PrivateRoute><BookingsPage/></PrivateRoute>}/>

          {/* Health / Clinic */}
          <Route path="/patients"          element={<PrivateRoute><PatientsPage/></PrivateRoute>}/>
          <Route path="/appointments"      element={<PrivateRoute><AppointmentsPage/></PrivateRoute>}/>

          {/* Education */}
          <Route path="/students"          element={<PrivateRoute><StudentsPage/></PrivateRoute>}/>
          <Route path="/grades"            element={<PrivateRoute><GradesPage/></PrivateRoute>}/>

          {/* Gym */}
          <Route path="/memberships"       element={<PrivateRoute><MembershipsPage/></PrivateRoute>}/>

          {/* Restaurant */}
          <Route path="/tables"            element={<PrivateRoute><TablesPage/></PrivateRoute>}/>
          <Route path="/restaurant-orders" element={<PrivateRoute><RestaurantOrdersPage/></PrivateRoute>}/>

          {/* Real Estate */}
          <Route path="/properties"        element={<PrivateRoute><PropertiesPage/></PrivateRoute>}/>
          <Route path="/leases"            element={<PrivateRoute><LeasesPage/></PrivateRoute>}/>

const PurchaseRequestsPage = React.lazy(() => import('./pages/PurchaseRequests/PurchaseRequestsPage'));
const LegalPage            = React.lazy(() => import('./pages/Legal/LegalPage'));

          {/* Salon */}
          <Route path="/salon-appointments" element={<PrivateRoute><SalonAppointmentsPage/></PrivateRoute>}/>

          {/* PR + Legal + Contracts */}
          <Route path="/purchase-requests"  element={<PrivateRoute><PurchaseRequestsPage/></PrivateRoute>}/>
          <Route path="/legal"              element={<PrivateRoute><LegalPage/></PrivateRoute>}/>
          <Route path="/contracts"          element={<PrivateRoute><ContractsPage/></PrivateRoute>}/>

          <Route path="/"  element={<Navigate to="/login" replace/>}/>
          <Route path="*"  element={<Navigate to="/login" replace/>}/>
        </Routes>
        <AIWrapper/>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loader/>}>
        <AppInner/>
      </Suspense>
    </Router>
  );
}
