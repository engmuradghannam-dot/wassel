import React, { useState } from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Tooltip, Chip
} from '@mui/material';
import { ChevronLeft, ChevronRight, Logout } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { getNavForIndustry, getSectorColor } from '../utils/sectorNav';

const DRAWER_W = 242;
const DRAWER_M = 62;

const Layout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [mini, setMini]  = useState(false);
  const navigate         = useNavigate();
  const location         = useLocation();
  const isRTL            = ['ar','ur'].includes(i18n.language);

  const industry    = localStorage.getItem('userIndustry') || 'trading_general';
  const userName    = localStorage.getItem('userName')     || '';
  const userRole    = localStorage.getItem('userRole')     || '';
  const userCompany = localStorage.getItem('userCompany')  || '';
  const sectorColor = getSectorColor(industry);
  const navItems    = getNavForIndustry(industry);
  const drawerW     = mini ? DRAWER_M : DRAWER_W;

  const logout = () => {
    ['token','userId','userName','userRole','userIndustry','userCompany']
      .forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  return (
    <Box sx={{ display:'flex', minHeight:'100vh', bgcolor:'#f5f7fa' }}>

      {/* ── SIDEBAR ── */}
      <Box sx={{
        width: drawerW, flexShrink:0, height:'100vh',
        position:'fixed', top:0,
        [isRTL ? 'right' : 'left']: 0,
        display:'flex', flexDirection:'column',
        background:'linear-gradient(180deg,#0d1b2a 0%,#1a2e42 100%)',
        transition:'width 0.22s ease', overflow:'hidden', zIndex:1200,
        boxShadow: isRTL?'-2px 0 16px rgba(0,0,0,0.35)':'2px 0 16px rgba(0,0,0,0.35)',
      }}>

        {/* Logo */}
        <Box sx={{
          display:'flex', alignItems:'center', gap:1.5,
          px: mini?1.2:2.5, py:1.8,
          borderBottom:'1px solid rgba(255,255,255,0.07)', minHeight:62,
        }}>
          <Tooltip title={isRTL ? 'لوحة التحكم الدائرية' : 'Wheel Dashboard'} placement="right">
            <Box onClick={() => navigate('/wheel')} sx={{
              width:34, height:34, borderRadius:'9px', flexShrink:0,
              background:`linear-gradient(135deg,${sectorColor},${sectorColor}99)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 0 16px ${sectorColor}55`,
              cursor:'pointer', transition:'transform .2s',
              '&:hover': { transform:'scale(1.08) rotate(8deg)' },
            }}>
              <Typography sx={{ fontSize:17, fontWeight:900, color:'#fff', fontFamily:'Georgia,serif' }}>W</Typography>
            </Box>
          </Tooltip>
          {!mini && (
            <Box sx={{ flex:1, minWidth:0 }}>
              <Typography sx={{ color:'#fff', fontWeight:800, fontSize:14 }}>Wassel ERP</Typography>
              {userCompany && (
                <Typography sx={{ color:'rgba(255,255,255,0.38)', fontSize:9.5 }} noWrap>
                  {userCompany}
                </Typography>
              )}
            </Box>
          )}
          <IconButton size="small" onClick={() => setMini(v=>!v)}
            sx={{ color:'rgba(255,255,255,0.35)', p:0.4, '&:hover':{ color:'white' } }}>
            {mini
              ? (isRTL?<ChevronLeft sx={{ fontSize:17 }}/>:<ChevronRight sx={{ fontSize:17 }}/>)
              : (isRTL?<ChevronRight sx={{ fontSize:17 }}/>:<ChevronLeft sx={{ fontSize:17 }}/>)
            }
          </IconButton>
        </Box>

        {/* Sector indicator */}
        {!mini && (
          <Box sx={{ px:2, py:0.8, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <Typography sx={{ color:sectorColor, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>
              {t(`industries.${industry}`) || industry.replace(/_/g,' ')}
            </Typography>
          </Box>
        )}

        {/* Nav */}
        <Box sx={{
          flex:1, overflow:'auto', overflowX:'hidden', py:0.8,
          '&::-webkit-scrollbar':{ width:6 },
          '&::-webkit-scrollbar-track':{ bgcolor:'transparent' },
          '&::-webkit-scrollbar-thumb':{
            bgcolor:'rgba(255,255,255,0.12)', borderRadius:3,
            '&:hover':{ bgcolor:'rgba(255,255,255,0.22)' },
          },
          scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.12) transparent',
        }}>
          <List dense disablePadding>
            {navItems.map((item, i) => {
              if (item === null) return <Divider key={i} sx={{ my:0.4, borderColor:'rgba(255,255,255,0.06)' }}/>;
              const isActive = location.pathname === item.path;
              const label    = t(item.key) || item.key;
              return (
                <Tooltip key={item.path} title={mini ? label : ''}
                  placement={isRTL?'left':'right'}>
                  <ListItemButton onClick={() => navigate(item.path)}
                    sx={{
                      mx:0.8, mb:0.15, borderRadius:1.8, px:1.3, py:0.75,
                      bgcolor: isActive ? `${sectorColor}28` : 'transparent',
                      border:'1px solid', borderColor: isActive ? `${sectorColor}50` : 'transparent',
                      transform: isActive ? 'scale(1.045)' : 'scale(1)',
                      transformOrigin: isRTL ? 'right center' : 'left center',
                      boxShadow: isActive ? `0 2px 10px ${sectorColor}40` : 'none',
                      '&:hover':{
                        bgcolor: isActive ? `${sectorColor}33` : 'rgba(255,255,255,0.07)',
                        transform: isActive ? 'scale(1.045)' : 'scale(1.02)',
                      },
                      transition:'transform 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease',
                    }}>
                    <ListItemIcon sx={{
                      minWidth: mini?0:32,
                      mr: mini?0:(isRTL?0:0.8), ml: mini?0:(isRTL?0.8:0),
                      fontSize:17, color:'inherit',
                    }}>
                      <Typography sx={{ fontSize: isActive?19:17, lineHeight:1, transition:'font-size 0.16s ease' }}>{item.icon}</Typography>
                    </ListItemIcon>
                    {!mini && (
                      <ListItemText primary={
                        <Typography variant="body2" fontWeight={isActive?700:400} noWrap
                          sx={{ color: isActive?'#fff':'rgba(255,255,255,0.66)', fontSize:'0.83rem' }}>
                          {label}
                        </Typography>
                      }/>
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </Box>

        {/* Bottom: user + lang + logout */}
        <Box sx={{ borderTop:'1px solid rgba(255,255,255,0.07)', p:1 }}>
          {!mini && (
            <Box sx={{
              display:'flex', alignItems:'center', gap:0.8,
              bgcolor:'rgba(255,255,255,0.05)', borderRadius:1.8, px:1.2, py:0.8, mb:0.8,
            }}>
              <Avatar sx={{ width:24, height:24, bgcolor:sectorColor, fontSize:10, flexShrink:0 }}>
                {userName?.[0]}
              </Avatar>
              <Box sx={{ flex:1, minWidth:0 }}>
                <Typography sx={{ color:'#fff', fontSize:11, fontWeight:600 }} noWrap>{userName}</Typography>
                <Chip label={userRole} size="small"
                  sx={{ height:14, fontSize:'0.58rem', bgcolor:`${sectorColor}30`, color:sectorColor, mt:0.1 }}/>
              </Box>
            </Box>
          )}
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:mini?'center':'space-between', gap:0.5 }}>
            {!mini && <LanguageSelector variant="icon" onDark/>}
            <Tooltip title={t('auth.logout')||'Logout'}>
              <IconButton onClick={logout} size="small"
                sx={{ color:'rgba(255,255,255,0.38)', '&:hover':{ color:'#ef5350' } }}>
                <Logout sx={{ fontSize:17 }}/>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── MAIN ── */}
      <Box sx={{
        flex:1,
        [isRTL?'mr':'ml']: `${drawerW}px`,
        transition: isRTL?`margin-right 0.22s ease`:`margin-left 0.22s ease`,
        minHeight:'100vh', overflow:'auto',
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
