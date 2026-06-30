import React, { useState, useMemo, useRef } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNavForIndustry, getSectorColor } from '../../utils/sectorNav';

/**
 * WheelNav — لوحة تحكم دائرية تفاعلية (بديل اختياري للقائمة الجانبية)
 * أيقونات الأقسام تدور ببطء حول شعار البرنامج الدوار في المنتصف.
 * - دوران تلقائي بطيء ومستمر (CSS keyframes، أداء عالٍ بلا إعادة رسم JS)
 * - يتوقف الدوران عند تمرير الفأرة فوق العجلة (hover) لتسهيل الاختيار
 * - كل أيقونة تدور عكسياً بنفس سرعة الحاوية لتبقى مستقيمة دائماً (لا تنقلب)
 * - نقرة على أي أيقونة تنقل مباشرة لذلك القسم عبر react-router
 */

const ROTATION_SECONDS = 90; // دورة كاملة كل 90 ثانية — بطيئة وهادئة

export default function WheelNav({ size = 480 }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const industry   = localStorage.getItem('userIndustry') || 'trading_general';
  const userName   = localStorage.getItem('userName') || '';
  const userRole   = localStorage.getItem('userRole') || 'user';
  const companyName= localStorage.getItem('userCompany') || 'Wassel';

  const [paused, setPaused] = useState(false);

  const accentColor = useMemo(() => getSectorColor(industry), [industry]);

  // استبعاد لوحة التحكم نفسها من العجلة (لأننا أصلاً فيها) والعناصر الفاصلة (null)
  const items = useMemo(() => {
    const raw = getNavForIndustry(industry) || [];
    return raw.filter(it => it && it.path !== '/dashboard');
  }, [industry]);

  const radius = size * 0.38;
  const center = size / 2;

  return (
    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', py:4 }}>

      {/* ── العجلة ── */}
      <Box
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        sx={{
          position:'relative',
          width: size, height: size,
          maxWidth:'92vw', maxHeight:'92vw',
        }}>

        {/* خلفية دوائر متراكزة زخرفية */}
        {[1, 0.78, 0.56].map((scale, i) => (
          <Box key={i} sx={{
            position:'absolute', inset:0, margin:'auto',
            width:`${scale*100}%`, height:`${scale*100}%`,
            borderRadius:'50%',
            border:`1px solid ${accentColor}33`,
            pointerEvents:'none',
          }}/>
        ))}

        {/* الحاوية الدوارة — كل الأيقونات بداخلها تدور سوياً */}
        <Box sx={{
          position:'absolute', inset:0,
          animation: `wheelSpin ${ROTATION_SECONDS}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
          '@keyframes wheelSpin': {
            from: { transform:'rotate(0deg)' },
            to:   { transform:'rotate(360deg)' },
          },
        }}>
          {items.map((item, idx) => {
            const angle = (360 / items.length) * idx - 90; // البداية من الأعلى
            const rad   = (angle * Math.PI) / 180;
            const x     = center + radius * Math.cos(rad);
            const y     = center + radius * Math.sin(rad);
            const isActive = location.pathname === item.path;
            const label = t(item.key) || item.path;

            return (
              <Box key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  position:'absolute',
                  left:x, top:y,
                  transform:'translate(-50%,-50%)',
                  // عكس الدوران — الأيقونة نفسها تبقى مستقيمة دائماً وسط دوران العجلة
                  animation: `wheelSpinReverse ${ROTATION_SECONDS}s linear infinite`,
                  animationPlayState: paused ? 'paused' : 'running',
                  '@keyframes wheelSpinReverse': {
                    from: { transform:'translate(-50%,-50%) rotate(0deg)' },
                    to:   { transform:'translate(-50%,-50%) rotate(-360deg)' },
                  },
                  display:'flex', flexDirection:'column', alignItems:'center', gap:0.5,
                  cursor:'pointer',
                  zIndex:2,
                }}>
                <Box sx={{
                  width:56, height:56, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:24,
                  background: isActive
                    ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                    : 'rgba(255,255,255,0.08)',
                  border: `2px solid ${isActive ? accentColor : `${accentColor}55`}`,
                  boxShadow: isActive
                    ? `0 0 24px ${accentColor}99, 0 0 0 4px ${accentColor}22`
                    : `0 0 14px ${accentColor}33`,
                  transition:'all .25s ease',
                  '&:hover': {
                    transform:'scale(1.12)',
                    boxShadow:`0 0 28px ${accentColor}aa`,
                    background:`linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  },
                }}>
                  {item.icon}
                </Box>
                <Typography sx={{
                  fontSize:'0.68rem', fontWeight: isActive ? 700 : 500,
                  color: isActive ? accentColor : 'rgba(255,255,255,0.78)',
                  whiteSpace:'nowrap', maxWidth:90, textAlign:'center',
                  overflow:'hidden', textOverflow:'ellipsis',
                  textShadow:'0 1px 4px rgba(0,0,0,0.6)',
                }}>
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* ── الشعار الدوار في المنتصف ── */}
        <Box
          onClick={() => navigate('/dashboard')}
          sx={{
            position:'absolute', left:center, top:center,
            transform:'translate(-50%,-50%)',
            width:88, height:88, borderRadius:'22px',
            display:'flex', alignItems:'center', justifyContent:'center',
            background:`linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
            boxShadow:`0 0 40px ${accentColor}88, 0 0 0 6px rgba(255,255,255,0.06)`,
            cursor:'pointer', zIndex:3,
            animation:'logoSpin 14s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
            '@keyframes logoSpin': {
              from:{ transform:'translate(-50%,-50%) rotateY(0deg)' },
              to:  { transform:'translate(-50%,-50%) rotateY(360deg)' },
            },
          }}>
          <Typography sx={{
            fontSize:38, fontWeight:900, color:'#fff',
            fontFamily:'Georgia, serif', letterSpacing:'-1px',
          }}>W</Typography>
        </Box>

      </Box>

      {/* ── بطاقة المستخدم أسفل العجلة ── */}
      <Box sx={{
        mt:4, display:'flex', alignItems:'center', gap:1.5,
        bgcolor:'rgba(255,255,255,0.06)', borderRadius:'999px',
        px:2, py:1, border:`1px solid ${accentColor}33`,
      }}>
        <Avatar sx={{ width:40, height:40, bgcolor:`${accentColor}33`, color:accentColor, fontWeight:700 }}>
          {userName?.[0] || 'U'}
        </Avatar>
        <Box sx={{ textAlign: AR ? 'right' : 'left' }}>
          <Typography sx={{ color:'#fff', fontWeight:700, fontSize:'0.9rem' }}>{userName}</Typography>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
            <Chip label={userRole} size="small" sx={{ height:18, fontSize:'0.62rem', bgcolor:`${accentColor}33`, color:accentColor }}/>
            <Typography sx={{ color:'rgba(255,255,255,0.5)', fontSize:'0.7rem' }}>{companyName}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
