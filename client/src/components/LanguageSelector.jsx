import React, { useState } from 'react';
import { Box, Menu, MenuItem, Typography, Fade, Button, Tooltip } from '@mui/material';
import { Translate, Check, KeyboardArrowDown } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '../i18n/index';

/**
 * variant:
 *  "button"  — full button with flag + name (used on Login/Register dark bg)
 *  "icon"    — compact icon-only (used in Layout header)
 *  "inline"  — full card grid (used in Settings page)
 */
const LanguageSelector = ({ variant = 'button', onDark = false, sx = {}, onSelect }) => {
  const { i18n } = useTranslation();
  const [anchor, setAnchor] = useState(null);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const select = (code) => {
    changeLanguage(code);
    setAnchor(null);
    onSelect && onSelect(code);
  };

  // ── INLINE grid (Settings page) ─────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <Box sx={{ display:'flex', flexWrap:'wrap', gap:1.5, ...sx }}>
        {LANGUAGES.map(lang => {
          const active = i18n.language === lang.code;
          return (
            <Box key={lang.code} onClick={() => select(lang.code)}
              sx={{
                display:'flex', alignItems:'center', gap:1.2,
                px:2, py:1.2, borderRadius:2.5, cursor:'pointer',
                border:'2px solid', minWidth:140,
                borderColor: active ? '#1a73e8' : 'divider',
                bgcolor: active ? '#e8f0fe' : 'background.paper',
                transition:'all 0.18s',
                '&:hover':{ borderColor:'#1a73e8', bgcolor:'#f0f5ff', transform:'translateY(-1px)', boxShadow:1 }
              }}>
              <Typography sx={{ fontSize:22 }}>{lang.flag}</Typography>
              <Box sx={{ flex:1 }}>
                <Typography variant="body2" fontWeight={700}
                  sx={{ color: active?'#1a73e8':'text.primary', lineHeight:1.2 }}>
                  {lang.nativeName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>
                  {lang.dir === 'rtl' ? '← RTL' : 'LTR →'}
                </Typography>
              </Box>
              {active && <Check sx={{ fontSize:18, color:'#1a73e8', flexShrink:0 }}/>}
            </Box>
          );
        })}
      </Box>
    );
  }

  // ── ICON (compact — used in dark header) ────────────────────────────────
  if (variant === 'icon') {
    return (
      <>
        <Tooltip title={current.nativeName} placement="bottom">
          <Box onClick={e => setAnchor(e.currentTarget)}
            sx={{
              display:'flex', alignItems:'center', gap:0.5,
              cursor:'pointer', px:1, py:0.5, borderRadius:2,
              transition:'all 0.15s',
              '&:hover':{ bgcolor:'rgba(255,255,255,0.12)' },
              ...sx
            }}>
            <Typography sx={{ fontSize:18, lineHeight:1 }}>{current.flag}</Typography>
            <Typography sx={{ fontSize:'0.72rem', fontWeight:700,
              color: onDark ? 'rgba(255,255,255,0.85)' : 'text.primary' }}>
              {current.code.toUpperCase()}
            </Typography>
          </Box>
        </Tooltip>

        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
          TransitionComponent={Fade}
          PaperProps={{ sx:{ borderRadius:3, minWidth:200, maxHeight:360, overflow:'auto',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)' } }}>
          <Box sx={{ px:2, py:1, borderBottom:'1px solid', borderColor:'divider' }}>
            <Typography variant="caption" color="text.secondary"
              sx={{ textTransform:'uppercase', letterSpacing:1, fontSize:'0.65rem', fontWeight:700 }}>
              Language / اللغة
            </Typography>
          </Box>
          {LANGUAGES.map(lang => (
            <MenuItem key={lang.code} onClick={() => select(lang.code)}
              selected={lang.code === i18n.language}
              sx={{ py:1, gap:1.5, '&.Mui-selected':{ bgcolor:'#e8f0fe' } }}>
              <Typography sx={{ fontSize:20 }}>{lang.flag}</Typography>
              <Box sx={{ flex:1 }}>
                <Typography variant="body2" fontWeight={600}>{lang.nativeName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>
                  {lang.dir === 'rtl' ? 'RTL' : 'LTR'}
                </Typography>
              </Box>
              {lang.code === i18n.language && <Check sx={{ fontSize:16, color:'#1a73e8' }}/>}
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // ── BUTTON (Login / Register dark background) ────────────────────────────
  return (
    <>
      <Button onClick={e => setAnchor(e.currentTarget)}
        endIcon={<KeyboardArrowDown sx={{ fontSize:16 }}/>}
        sx={{
          borderRadius:2.5, px:2, py:0.8, fontWeight:600, fontSize:'0.82rem',
          border:'1px solid',
          borderColor: onDark ? 'rgba(255,255,255,0.25)' : 'divider',
          color: onDark ? 'rgba(255,255,255,0.9)' : 'text.primary',
          bgcolor: onDark ? 'rgba(255,255,255,0.08)' : 'transparent',
          '&:hover':{
            borderColor: onDark ? 'rgba(255,255,255,0.5)' : '#1a73e8',
            bgcolor: onDark ? 'rgba(255,255,255,0.12)' : '#f0f5ff',
          },
          gap:1, ...sx
        }}>
        <Typography sx={{ fontSize:18, lineHeight:1 }}>{current.flag}</Typography>
        {current.nativeName}
      </Button>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
        TransitionComponent={Fade}
        PaperProps={{ sx:{ borderRadius:3, minWidth:220, maxHeight:420, overflow:'auto',
          boxShadow:'0 8px 40px rgba(0,0,0,0.25)' } }}>
        <Box sx={{ px:2, py:1.2, borderBottom:'1px solid', borderColor:'divider' }}>
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform:'uppercase', letterSpacing:1.5, fontSize:'0.65rem', fontWeight:700 }}>
            Language / اللغة
          </Typography>
        </Box>
        {LANGUAGES.map(lang => (
          <MenuItem key={lang.code} onClick={() => select(lang.code)}
            selected={lang.code === i18n.language}
            sx={{ py:1.2, gap:1.5, '&.Mui-selected':{ bgcolor:'#e8f0fe' } }}>
            <Typography sx={{ fontSize:22 }}>{lang.flag}</Typography>
            <Box sx={{ flex:1 }}>
              <Typography variant="body2" fontWeight={600}>{lang.nativeName}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>
                {lang.name} {lang.dir === 'rtl' ? '· RTL' : '· LTR'}
              </Typography>
            </Box>
            {lang.code === i18n.language && <Check sx={{ fontSize:16, color:'#1a73e8' }}/>}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;
