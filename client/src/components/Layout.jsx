import React, { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  Dashboard, Inventory2, People, LocalShipping, ShoppingCart,
  Chat, Business, Logout, AccountBalance, Warehouse,
  ChevronLeft, ChevronRight, FolderOpen, AdminPanelSettings,
  Settings, AccountTree
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const DRAWER_W = 240;
const DRAWER_M = 64;

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [mini, setMini]  = useState(false);
  const navigate         = useNavigate();
  const location         = useLocation();
  const isRTL            = ['ar', 'ur'].includes(i18n.language);

  // ── Nav items — ALL labels from t() ──────────────────────────
  const NAV = [
    { path:'/dashboard',       icon:<Dashboard/>,          key:'nav.dashboard'      },
    { path:'/inventory',       icon:<Inventory2/>,         key:'nav.inventory'      },
    { path:'/suppliers',       icon:<LocalShipping/>,      key:'nav.suppliers'      },
    { path:'/purchase-orders', icon:<ShoppingCart/>,       key:'nav.purchaseOrders' },
    { path:'/employees',       icon:<People/>,             key:'nav.employees'      },
    { path:'/branches',        icon:<AccountTree/>,        key:'nav.branches'       },
    { path:'/warehouses',      icon:<Warehouse/>,          key:'nav.warehouses'     },
    { path:'/projects',        icon:<FolderOpen/>,         key:'nav.projects'       },
    null, // divider
    { path:'/accounting',      icon:<AccountBalance/>,     key:'nav.accounting'     },
    { path:'/chat',            icon:<Chat/>,               key:'nav.chat'           },
    null, // divider
    { path:'/roles',           icon:<AdminPanelSettings/>, key:'nav.roles'          },
    { path:'/company-settings',icon:<Business/>,           key:'nav.company'        },
    { path:'/settings',        icon:<Settings/>,           key:'settings.title'     },
  ];

  const userName    = localStorage.getItem('userName')    || '';
  const userRole    = localStorage.getItem('userRole')    || '';
  const userCompany = localStorage.getItem('userCompany') || '';
  const drawerW     = mini ? DRAWER_M : DRAWER_W;

  const logout = () => {
    ['token','userId','userName','userRole','userIndustry','userCompany']
      .forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  return (
    <Box sx={{ display:'flex', minHeight:'100vh', bgcolor:'background.default' }}>

      {/* ── SIDEBAR ── */}
      <Box sx={{
        width: drawerW, flexShrink:0, height:'100vh',
        position:'fixed', top:0,
        [isRTL ? 'right' : 'left']: 0,
        display:'flex', flexDirection:'column',
        background:'linear-gradient(180deg,#0d1b2a 0%,#1a2e42 100%)',
        transition:'width 0.22s ease', overflow:'hidden', zIndex:1200,
        boxShadow: isRTL ? '-2px 0 12px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.3)',
      }}>

        {/* Logo row */}
        <Box sx={{
          display:'flex', alignItems:'center', gap:1.5,
          px: mini ? 1.5 : 2.5, py:2,
          borderBottom:'1px solid rgba(255,255,255,0.08)', minHeight:64
        }}>
          <Box sx={{
            width:36, height:36, borderRadius:'10px', flexShrink:0,
            background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 16px rgba(26,115,232,0.4)'
          }}>
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
            sx={{ color:'rgba(255,255,255,0.4)', p:0.5, flexShrink:0,
              '&:hover':{ color:'white' } }}>
            {mini
              ? (isRTL ? <ChevronLeft sx={{ fontSize:18 }}/> : <ChevronRight sx={{ fontSize:18 }}/>)
              : (isRTL ? <ChevronRight sx={{ fontSize:18 }}/> : <ChevronLeft sx={{ fontSize:18 }}/>)
            }
          </IconButton>
        </Box>

        {/* Nav list */}
        <Box sx={{
          flex:1, overflow:'auto', py:1,
          '&::-webkit-scrollbar':{ width:3 },
          '&::-webkit-scrollbar-thumb':{ bgcolor:'rgba(255,255,255,0.1)', borderRadius:2 }
        }}>
          {NAV.map((item, i) => {
            if (item === null) return (
              <Divider key={i} sx={{ my:0.5, borderColor:'rgba(255,255,255,0.07)' }}/>
            );
            const isActive = location.pathname === item.path;
            const label    = t(item.key);
            return (
              <Tooltip key={item.path} title={mini ? label : ''}
                placement={isRTL ? 'left' : 'right'}>
                <ListItemButton onClick={() => navigate(item.path)}
                  sx={{
                    mx:1, mb:0.2, borderRadius:2, px:1.5, py:0.9,
                    bgcolor: isActive ? 'rgba(26,115,232,0.22)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(26,115,232,0.4)' : 'transparent',
                    '&:hover':{ bgcolor:'rgba(255,255,255,0.07)' },
                    transition:'all 0.15s'
                  }}>
                  <ListItemIcon sx={{
                    minWidth: mini ? 0 : 34,
                    mr: mini ? 0 : (isRTL ? 0 : 1),
                    ml: mini ? 0 : (isRTL ? 1 : 0),
                    color: isActive ? '#4fc3f7' : 'rgba(255,255,255,0.5)',
                    '& .MuiSvgIcon-root':{ fontSize:19 }
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {!mini && (
                    <ListItemText primary={
                      <Typography variant="body2" fontWeight={isActive ? 700 : 400} noWrap
                        sx={{
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.68)',
                          fontSize:'0.84rem'
                        }}>
                        {label}
                      </Typography>
                    }/>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </Box>

        {/* Bottom: user + lang + logout */}
        <Box sx={{ borderTop:'1px solid rgba(255,255,255,0.08)', p:1.2 }}>
          {!mini && (
            <Box sx={{
              display:'flex', alignItems:'center', gap:1,
              bgcolor:'rgba(255,255,255,0.06)', borderRadius:2,
              px:1.2, py:0.8, mb:1
            }}>
              <Avatar sx={{ width:26, height:26, bgcolor:'#1a73e8', fontSize:11, flexShrink:0 }}>
                {userName?.[0]}
              </Avatar>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Typography sx={{ color:'#fff', fontSize:12, fontWeight:600 }} noWrap>
                  {userName}
                </Typography>
                <Typography sx={{ color:'rgba(255,255,255,0.4)', fontSize:10 }} noWrap>
                  {userRole}
                </Typography>
              </Box>
            </Box>
          )}
          <Box sx={{
            display:'flex', alignItems:'center',
            justifyContent: mini ? 'center' : 'space-between', gap:0.5
          }}>
            {!mini && <LanguageSelector variant="icon" onDark />}
            <Tooltip title={t('auth.logout') || 'Logout'}>
              <IconButton onClick={logout} size="small"
                sx={{ color:'rgba(255,255,255,0.4)', '&:hover':{ color:'#ef5350' } }}>
                <Logout sx={{ fontSize:18 }}/>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── MAIN CONTENT ── */}
      <Box sx={{
        flex:1,
        [isRTL ? 'mr' : 'ml']: `${drawerW}px`,
        transition: isRTL
          ? `margin-right 0.22s ease`
          : `margin-left 0.22s ease`,
        minHeight:'100vh',
        overflow:'auto'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
