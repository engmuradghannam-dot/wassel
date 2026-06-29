import React, { useState } from 'react';
import {
  Box, Button, Menu, MenuItem, Typography, Fade, Tooltip
} from '@mui/material';
import { Translate, Check } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, changeLanguage } from '../i18n/index';

const LanguageSelector = ({ variant = 'button', sx = {} }) => {
  const { i18n } = useTranslation();
  const [anchor, setAnchor] = useState(null);
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const select = (code) => {
    changeLanguage(code);
    setAnchor(null);
  };

  if (variant === 'icon') {
    return (
      <Tooltip title="Language / اللغة">
        <Button
          onClick={e => setAnchor(e.currentTarget)}
          sx={{ minWidth: 'auto', px: 1.5, ...sx }}
          startIcon={<Typography sx={{ fontSize: 18 }}>{current.flag}</Typography>}
        >
          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
            {current.code.toUpperCase()}
          </Typography>
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={e => setAnchor(e.currentTarget)}
        startIcon={<Translate sx={{ fontSize: 18 }} />}
        sx={{
          borderRadius: 2, fontSize: '0.82rem', fontWeight: 600,
          borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)',
          '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.08)' },
          ...sx
        }}
      >
        {current.flag} {current.nativeName}
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 3, minWidth: 200, maxHeight: 400,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.65rem' }}>
            Language / اللغة
          </Typography>
        </Box>
        {LANGUAGES.map(lang => (
          <MenuItem
            key={lang.code}
            onClick={() => select(lang.code)}
            selected={lang.code === i18n.language}
            sx={{
              py: 1.2, px: 2, gap: 1.5, borderRadius: 1, mx: 0.5, my: 0.2,
              '&.Mui-selected': { bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }
            }}
          >
            <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{lang.flag}</Typography>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>{lang.nativeName}</Typography>
              {lang.nativeName !== lang.name && (
                <Typography variant="caption" color="text.secondary">{lang.name}</Typography>
              )}
            </Box>
            {lang.code === i18n.language && <Check sx={{ fontSize: 16, color: 'primary.main' }} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector;
