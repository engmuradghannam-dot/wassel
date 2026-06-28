import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import './i18n';

// Lazy load pages for better performance
const ChatPage = React.lazy(() => import('./pages/Chat/ChatPage'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));

// Loading component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress size={60} />
  </Box>
);

// Create theme
const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/company-settings" element={<CompanySettings />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
