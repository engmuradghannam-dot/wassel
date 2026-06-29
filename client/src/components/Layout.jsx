import React, { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Tooltip, Chip
} from '@mui/material';
import {
  Dashboard, Inventory2, People, LocalShipping, ShoppingCart,
  Chat, Business, Assessment, Logout, AccountBalance,
  AccountTree, Warehouse, ChevronLeft, ChevronRight
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const DRAWER_WIDTH = 240;
const DRAWER_MINI = 64;

const navItems = [
  { path: '/dashboard',       icon: <Dashboard />,       label: 'الرئيسية' },
  { path: '/inventory',       icon: <Inventory2 />,      label: 'المخزون' },
  { path: '/suppliers',       icon: <LocalShipping />,   label: 'الموردون' },
  { path: '/purchase-orders', icon: <ShoppingCart />,    label: 'أوامر الشراء' },
  { path: '/employees',       icon: <People />,          label: 'الموظفون' },
  { path: '/branches',        icon: <AccountTree />,     label: 'الفروع' },
  { path: '/warehouses',      icon: <Warehouse />,       label: 'المستودعات' },
  { path: '/roles',           icon: <AccountTree />,     label: 'الأدوار والصلاحيات' },
  { path: '/projects',        icon: <AccountTree />,     label: 'المشاريع' },
  { divider: true },
  { path: '/accounting',      icon: <AccountBalance />,  label: 'المحاسبة' }, // NEW
  { path: '/chat',            icon: <Chat />,            label: 'المحادثات' },
  { divider: true },
  { path: '/reports',         icon: <Assessment />,      label: 'التقارير' },
  { path: '/company-settings',icon: <Business />,        label: 'الشركة' },
];

const Layout = ({ children }) => {
  const [mini, setMini] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userName = localStorage.getItem('userName') || 'مستخدم';
  const userRole = localStorage.getItem('userRole') || 'user';

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const width = mini ? DRAWER_MINI : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box sx={{
        width, flexShrink: 0,
        bgcolor: '#1a1a2e', color: 'white',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.2s', overflow: 'hidden'
      }}>
        {/* Header */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: mini ? 'center' : 'space-between', minHeight: 64 }}>
          {!mini && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>و</Typography>
              </Box>
              <Typography fontWeight={700} sx={{ color: 'white', fontSize: 16 }}>Wassel ERP</Typography>
            </Box>
          )}
          <IconButton onClick={() => setMini(v => !v)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {mini ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Nav */}
        <List sx={{ flex: 1, overflow: 'auto', py: 1, px: mini ? 0.5 : 1 }}>
          {navItems.map((item, i) => {
            if (item.divider) return <Divider key={i} sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />;
            const active = location.pathname === item.path;
            return (
              <Tooltip key={item.path} title={mini ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    bgcolor: active ? '#1a73e8' : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.7)',
                    minHeight: 44,
                    justifyContent: mini ? 'center' : 'flex-start',
                    px: mini ? 1 : 1.5,
                    '&:hover': { bgcolor: active ? '#1a73e8' : 'rgba(255,255,255,0.08)' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: mini ? 0 : 36 }}>
                    {item.icon}
                  </ListItemIcon>
                  {!mini && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* User */}
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: mini ? 'center' : 'flex-start' }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#1a73e8', fontSize: 15 }}>
            {userName?.[0]}
          </Avatar>
          {!mini && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 600 }} noWrap>{userName}</Typography>
              <Chip size="small" label={userRole === 'admin' ? 'مشرف' : 'مستخدم'} sx={{ height: 16, fontSize: 10, bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }} />
            </Box>
          )}
          {!mini && (
            <Tooltip title="تسجيل الخروج">
              <IconButton onClick={logout} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.5 }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Main */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f8f9fa' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
