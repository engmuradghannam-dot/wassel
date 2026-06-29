import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField, MenuItem, Box, Typography, Chip, Divider,
  InputAdornment, CircularProgress
} from '@mui/material';
import { Flag, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Built-in country list (matches server/config/countries.js)
const BUILT_IN_COUNTRIES = [
  // GCC — First
  { code:'SA', name:'المملكة العربية السعودية', nameEn:'Saudi Arabia',  flag:'🇸🇦', currency:'SAR', group:'gcc', vatRate:15, dir:'rtl', lang:'ar' },
  { code:'AE', name:'الإمارات العربية المتحدة',  nameEn:'United Arab Emirates', flag:'🇦🇪', currency:'AED', group:'gcc', vatRate:5,  dir:'rtl', lang:'ar' },
  { code:'KW', name:'الكويت',                    nameEn:'Kuwait',        flag:'🇰🇼', currency:'KWD', group:'gcc', vatRate:0,  dir:'rtl', lang:'ar' },
  { code:'QA', name:'قطر',                       nameEn:'Qatar',         flag:'🇶🇦', currency:'QAR', group:'gcc', vatRate:0,  dir:'rtl', lang:'ar' },
  { code:'BH', name:'البحرين',                   nameEn:'Bahrain',       flag:'🇧🇭', currency:'BHD', group:'gcc', vatRate:10, dir:'rtl', lang:'ar' },
  { code:'OM', name:'سلطنة عُمان',               nameEn:'Oman',          flag:'🇴🇲', currency:'OMR', group:'gcc', vatRate:5,  dir:'rtl', lang:'ar' },
  // Arab
  { code:'EG', name:'مصر',                       nameEn:'Egypt',         flag:'🇪🇬', currency:'EGP', group:'arab', vatRate:14, dir:'rtl', lang:'ar' },
  { code:'JO', name:'الأردن',                    nameEn:'Jordan',        flag:'🇯🇴', currency:'JOD', group:'arab', vatRate:16, dir:'rtl', lang:'ar' },
  { code:'LB', name:'لبنان',                     nameEn:'Lebanon',       flag:'🇱🇧', currency:'LBP', group:'arab', vatRate:11, dir:'rtl', lang:'ar' },
  { code:'IQ', name:'العراق',                    nameEn:'Iraq',          flag:'🇮🇶', currency:'IQD', group:'arab', vatRate:0,  dir:'rtl', lang:'ar' },
  { code:'SY', name:'سوريا',                     nameEn:'Syria',         flag:'🇸🇾', currency:'SYP', group:'arab', vatRate:0,  dir:'rtl', lang:'ar' },
  { code:'YE', name:'اليمن',                     nameEn:'Yemen',         flag:'🇾🇪', currency:'YER', group:'arab', vatRate:5,  dir:'rtl', lang:'ar' },
  { code:'LY', name:'ليبيا',                     nameEn:'Libya',         flag:'🇱🇾', currency:'LYD', group:'arab', vatRate:0,  dir:'rtl', lang:'ar' },
  { code:'TN', name:'تونس',                      nameEn:'Tunisia',       flag:'🇹🇳', currency:'TND', group:'arab', vatRate:19, dir:'rtl', lang:'ar' },
  { code:'DZ', name:'الجزائر',                   nameEn:'Algeria',       flag:'🇩🇿', currency:'DZD', group:'arab', vatRate:19, dir:'rtl', lang:'ar' },
  { code:'MA', name:'المغرب',                    nameEn:'Morocco',       flag:'🇲🇦', currency:'MAD', group:'arab', vatRate:20, dir:'rtl', lang:'ar' },
  { code:'SD', name:'السودان',                   nameEn:'Sudan',         flag:'🇸🇩', currency:'SDG', group:'arab', vatRate:17, dir:'rtl', lang:'ar' },
  // Asia
  { code:'PK', name:'باكستان',                   nameEn:'Pakistan',      flag:'🇵🇰', currency:'PKR', group:'asia', vatRate:17, dir:'ltr', lang:'ur' },
  { code:'IN', name:'الهند',                     nameEn:'India',         flag:'🇮🇳', currency:'INR', group:'asia', vatRate:18, dir:'ltr', lang:'hi' },
  { code:'ID', name:'إندونيسيا',                 nameEn:'Indonesia',     flag:'🇮🇩', currency:'IDR', group:'asia', vatRate:11, dir:'ltr', lang:'id' },
  { code:'TR', name:'تركيا',                     nameEn:'Turkey',        flag:'🇹🇷', currency:'TRY', group:'europe', vatRate:20, dir:'ltr', lang:'tr' },
  { code:'CN', name:'الصين',                     nameEn:'China',         flag:'🇨🇳', currency:'CNY', group:'asia', vatRate:13, dir:'ltr', lang:'zh' },
  // Europe
  { code:'DE', name:'ألمانيا',                   nameEn:'Germany',       flag:'🇩🇪', currency:'EUR', group:'europe', vatRate:19, dir:'ltr', lang:'de' },
  { code:'FR', name:'فرنسا',                     nameEn:'France',        flag:'🇫🇷', currency:'EUR', group:'europe', vatRate:20, dir:'ltr', lang:'fr' },
  { code:'GB', name:'المملكة المتحدة',           nameEn:'United Kingdom',flag:'🇬🇧', currency:'GBP', group:'europe', vatRate:20, dir:'ltr', lang:'en' },
  // Americas
  { code:'US', name:'الولايات المتحدة',          nameEn:'United States', flag:'🇺🇸', currency:'USD', group:'americas', vatRate:0, dir:'ltr', lang:'en' },
  // Other
  { code:'OTHER', name:'دولة أخرى',              nameEn:'Other',         flag:'🌍', currency:'USD', group:'other', vatRate:0, dir:'ltr', lang:'en' },
];

const GROUP_LABELS = {
  gcc:      { ar:'دول الخليج العربي (GCC)',    en:'Gulf Countries (GCC)' },
  arab:     { ar:'الدول العربية',               en:'Arab Countries' },
  asia:     { ar:'آسيا',                        en:'Asia' },
  europe:   { ar:'أوروبا',                      en:'Europe' },
  americas: { ar:'الأمريكيتان',                 en:'Americas' },
  other:    { ar:'أخرى',                        en:'Other' },
};

const CountrySelector = ({
  value, onChange, onCountryData,
  label, size='small', required=false,
  showVAT=true, showCurrency=true, fullWidth=true
}) => {
  const { i18n } = useTranslation();
  const AR = ['ar','ur'].includes(i18n.language);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return BUILT_IN_COUNTRIES;
    const q = search.toLowerCase();
    return BUILT_IN_COUNTRIES.filter(c =>
      c.name.includes(q) || c.nameEn.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = BUILT_IN_COUNTRIES.find(c => c.code === value);

  const handleChange = (code) => {
    const country = BUILT_IN_COUNTRIES.find(c => c.code === code);
    onChange(code);
    if (onCountryData && country) onCountryData(country);
  };

  const groups = [...new Set(filtered.map(c => c.group))];

  return (
    <TextField
      select fullWidth={fullWidth} size={size}
      label={label || (AR ? 'الدولة *' : 'Country *')}
      value={value || ''}
      onChange={e => handleChange(e.target.value)}
      required={required}
      SelectProps={{
        renderValue: (v) => {
          if (!v) return <em>{AR ? 'اختر الدولة' : 'Select Country'}</em>;
          const c = BUILT_IN_COUNTRIES.find(x => x.code === v);
          if (!c) return v;
          return (
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Typography sx={{ fontSize:18 }}>{c.flag}</Typography>
              <Typography variant="body2">{AR ? c.name : c.nameEn}</Typography>
              {showCurrency && <Chip label={c.currency} size="small" sx={{ fontSize:'0.65rem', height:18, ml:'auto' }}/>}
              {showVAT && c.vatRate > 0 && (
                <Chip label={`VAT ${c.vatRate}%`} size="small" color="primary" variant="outlined" sx={{ fontSize:'0.65rem', height:18 }}/>
              )}
            </Box>
          );
        }
      }}>
      {/* Search inside select — simplified */}
      {groups.map(group => [
        <MenuItem key={`g-${group}`} disabled sx={{ bgcolor:'#f5f5f5', py:0.5 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            — {AR ? GROUP_LABELS[group]?.ar : GROUP_LABELS[group]?.en} —
          </Typography>
        </MenuItem>,
        ...filtered.filter(c => c.group === group).map(country => (
          <MenuItem key={country.code} value={country.code} sx={{ py:1 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5, width:'100%' }}>
              <Typography sx={{ fontSize:20 }}>{country.flag}</Typography>
              <Box sx={{ flex:1 }}>
                <Typography variant="body2" fontWeight={value===country.code?700:400}>
                  {AR ? country.name : country.nameEn}
                </Typography>
                <Box sx={{ display:'flex', gap:0.5, mt:0.2 }}>
                  <Chip label={country.currency} size="small" sx={{ fontSize:'0.6rem', height:16 }}/>
                  {country.vatRate > 0 && (
                    <Chip label={`VAT ${country.vatRate}%`} size="small" color="primary" variant="outlined" sx={{ fontSize:'0.6rem', height:16 }}/>
                  )}
                  {country.vatRate === 0 && (
                    <Chip label={AR?'لا ضريبة':'No VAT'} size="small" sx={{ fontSize:'0.6rem', height:16, bgcolor:'#f5f5f5' }}/>
                  )}
                </Box>
              </Box>
            </Box>
          </MenuItem>
        ))
      ])}
    </TextField>
  );
};

export default CountrySelector;
export { BUILT_IN_COUNTRIES };
