import React, { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Tooltip, Chip
} from '@mui/material';
import {
  Dashboard, Inventory2, People, LocalShipping, ShoppingCart,
  Chat, Business, Assessment, Logout, AccountBalance,
  Warehouse, ChevronLeft, ChevronRight,
  FolderOpen, AdminPanelSettings, Settings, AccountTree
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const DRAWER_W  = 240;
const DRAWER_M  = 64;

// Nav items — labels use t() at render time
const getNavItems = (t) => [
  { path:'/dashboard',       icon:<Dashboard/>,           label: t('nav.dashboard')     || 'Dashboard' },
  { path:'/inventory',       icon:<Inventory2/>,          label: t('nav.inventory')     || 'Inventory' },
  { path:'/suppliers',       icon:<LocalShipping/>,       label: t('nav.suppliers')     || 'Suppliers' },
  { path:'/purchase-orders', icon:<ShoppingCart/>,        label: t('nav.purchaseOrders')|| 'Purchases' },
  { path:'/employees',       icon:<People/>,              label: t('nav.employees')     || 'Employees' },
  { path:'/branches',        icon:<AccountTree/>,         label: t('nav.branches')      || 'Branches' },
  { path:'/warehouses',      icon:<Warehouse/>,           label: t('nav.warehouses')    || 'Warehouses' },
  { path:'/projects',        icon:<FolderOpen/>,          label: t('nav.projects')      || 'Projects' },
  { divider: true },
  { path:'/accounting',      icon:<AccountBalance/>,      label: t('nav.accounting')    || 'Accounting' },
  { path:'/chat',            icon:<Chat/>,                label: t('nav.chat')          || 'Chat' },
  { divider: true },
  { path:'/roles',           icon:<AdminPanelSettings/>,  label: t('nav.roles')         || 'Roles' },
  { path:'/company-settings',icon:<Business/>,            label: t('nav.company')       || 'Company' },
  { path:'/settings',        icon:<Settings/>,            label: t('settings.title')    || 'Settings' },
];

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [mini, setMini]  = useState(false);
  const navigate         = useNavigate();
  const location         = useLocation();
  const navItems         = getNavItems(t);
  const isRTL            = ['ar','ur'].includes(i18n.language);

  const userName    = localStorage.getItem('userName')    || 'User';
  const userRole    = localStorage.getItem('userRole')    || 'user';
  const userCompany = localStorage.getItem('userCompany') || '';
  const industry    = localStorage.getItem('userIndustry') || '';

  const logout = () => {
    ['token','userId','userName','userRole','userIndustry','userCompany'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  const drawerW = mini ? DRAWER_M : DRAWER_W;

  return (
    <Box sx={{ display:'flex', minHeight:'100vh', bgcolor:'background.default' }}>

      {/* ── SIDEBAR ── */}
      <Box sx={{
        width: drawerW, flexShrink: 0, height:'100vh',
        position:'fixed', top:0, [isRTL?'right':'left']:0,
        display:'flex', flexDirection:'column',
        background:'linear-gradient(180deg, #0d1b2a 0%, #1a2e42 100%)',
        transition:'width 0.25s ease', overflow:'hidden', zIndex: 1200,
        boxShadow:'2px 0 12px rgba(0,0,0,0.3)'
      }}>

        {/* Logo */}
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, px:mini?1.5:2.5, py:2,
          borderBottom:'1px solid rgba(255,255,255,0.08)', minHeight:64 }}>
          <Box sx={{ width:36, height:36, borderRadius:'10px', flexShrink:0,
            background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 16px rgba(26,115,232,0.4)' }}>
            <Typography sx={{ fontSize:18, fontWeight:900, color:'#fff', fontFamily:'Georgia,serif' }}>W</Typography>
          </Box>
          {!mini && (
            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography sx={{ color:'#fff', fontWeight:800, fontSize:15, letterSpacing:'-0.3px' }}>
                Wassel ERP
              </Typography>
              {userCompany && (
                <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:10 }} noWrap>
                  {userCompany}
                </Typography>
              )}
            </Box>
          )}
          <IconButton size="small" onClick={() => setMini(v=>!v)}
            sx={{ color:'rgba(255,255,255,0.4)', p:0.5, '&:hover':{ color:'white' } }}>
            {(mini ? !isRTL : isRTL) ? <ChevronRight sx={{ fontSize:18 }}/> : <ChevronLeft sx={{ fontSize:18 }}/>}
          </IconButton>
        </Box>

        {/* Nav items */}
        <Box sx={{ flex:1, overflow:'auto', py:1,
          '&::-webkit-scrollbar':{ width:4 },
          '&::-webkit-scrollbar-thumb':{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:2 } }}>
          {navItems.map((item, i) => {
            if (item.divider) return (
              <Divider key={i} sx={{ my:0.5, borderColor:'rgba(255,255,255,0.08)' }}/>
            );
            const isActive = location.pathname === item.path;
            return (
              <Tooltip key={item.path} title={mini ? item.label : ''} placement={isRTL?'left':'right'}>
                <ListItemButton onClick={() => navigate(item.path)}
                  sx={{
                    mx:1, mb:0.3, borderRadius:2, px:1.5, py:1,
                    bgcolor: isActive ? 'rgba(26,115,232,0.25)' : 'transparent',
                    border: isActive ? '1px solid rgba(26,115,232,0.4)' : '1px solid transparent',
                    '&:hover':{ bgcolor:'rgba(255,255,255,0.08)' },
                    transition:'all 0.15s'
                  }}>
                  <ListItemIcon sx={{
                    minWidth:mini?0:36, mr:mini?0:1.2,
                    color: isActive ? '#4fc3f7' : 'rgba(255,255,255,0.55)',
                    '& .MuiSvgIcon-root':{ fontSize:20 }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!mini && (
                    <ListItemText primary={
                      <Typography variant="body2" fontWeight={isActive?700:400} noWrap
                        sx={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
                        {item.label}
                      </Typography>
                    }/>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </Box>

        {/* Bottom: user info + lang + logout */}
        <Box sx={{ borderTop:'1px solid rgba(255,255,255,0.08)', p:1.5 }}>
          {!mini && (
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.2,
              bgcolor:'rgba(255,255,255,0.06)', borderRadius:2, px:1.2, py:1 }}>
              <Avatar sx={{ width:28, height:28, bgcolor:'#1a73e8', fontSize:12 }}>
                {userName[0]}
              </Avatar>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Typography sx={{ color:'#fff', fontSize:12, fontWeight:600 }} noWrap>{userName}</Typography>
                <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:10 }} noWrap>{userRole}</Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ display:'flex', alignItems:'center', justifyContent: mini?'center':'space-between' }}>
            {!mini && <LanguageSelector variant="icon" onDark/>}
            <Tooltip title={t('auth.logout')||'Logout'}>
              <IconButton onClick={logout} size="small"
                sx={{ color:'rgba(255,255,255,0.45)', '&:hover':{ color:'#e53935' } }}>
                <Logout sx={{ fontSize:18 }}/>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── MAIN CONTENT ── */}
      <Box sx={{
        flex:1,
        [isRTL?'mr':'ml']: `${drawerW}px`,
        transition:'margin 0.25s ease',
        minHeight:'100vh',
        overflow:'auto'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
