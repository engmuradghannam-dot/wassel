import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ViewList, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WheelNav from '../../components/WheelNav/WheelNav';

/**
 * WheelDashboardPage — لوحة التحكم الدائرية كاملة الشاشة
 * صفحة بديلة اختيارية للوحة التحكم التقليدية (Dashboard.jsx)
 * تُفتح من زر في القائمة الجانبية أو من رابط مباشر /wheel
 */
export default function WheelDashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  return (
    <Box sx={{
      minHeight:'100vh', position:'relative', overflow:'hidden',
      background:'radial-gradient(ellipse at center, #0d1b2e 0%, #060d1a 70%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    }}>
      {/* خلفية نجوم/شبكة زخرفية */}
      <Box sx={{
        position:'absolute', inset:0, opacity:0.4, pointerEvents:'none',
        backgroundImage:'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize:'28px 28px',
      }}/>
      {[{s:600,x:-150,y:-150,c:'rgba(26,115,232,0.12)'},{s:500,x:'70%',y:'60%',c:'rgba(108,71,255,0.10)'}].map((o,i)=>(
        <Box key={i} sx={{
          position:'absolute', width:o.s, height:o.s, left:o.x, top:o.y, borderRadius:'50%',
          background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`, pointerEvents:'none',
        }}/>
      ))}

      {/* زر العودة للوحة التقليدية */}
      <Tooltip title={AR ? 'العرض الكلاسيكي' : 'Classic view'}>
        <IconButton onClick={() => navigate('/dashboard')}
          sx={{
            position:'absolute', top:20, [AR?'left':'right']:20, zIndex:10,
            color:'#fff', bgcolor:'rgba(255,255,255,0.08)',
            '&:hover':{ bgcolor:'rgba(255,255,255,0.16)' },
          }}>
          <ViewList/>
        </IconButton>
      </Tooltip>

      <Typography sx={{ color:'rgba(255,255,255,0.6)', fontSize:'0.85rem', mb:1, letterSpacing:1 }}>
        {AR ? 'اختر القسم' : 'Choose a section'}
      </Typography>

      <WheelNav size={520}/>

      <Typography sx={{ color:'rgba(255,255,255,0.35)', fontSize:'0.72rem', mt:2 }}>
        {AR ? 'مرّر الفأرة فوق العجلة لإيقاف الدوران' : 'Hover the wheel to pause rotation'}
      </Typography>
    </Box>
  );
}
