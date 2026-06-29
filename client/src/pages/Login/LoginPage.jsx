import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Divider,
  IconButton, InputAdornment, Alert, CircularProgress, Grow, Fade
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import LanguageSelector from '../../components/LanguageSelector';
;

const FEATURES = [
  { icon:'📦', key:'inventory' }, { icon:'💰', key:'accounting' },
  { icon:'🚢', key:'logistics' }, { icon:'👥', key:'hr' },
  { icon:'📊', key:'projects'  }, { icon:'🤖', key:'ai' },
];

const FEATURE_LABELS = {
  ar: ['مخزون ومستودعات','محاسبة متكاملة','لوجستيك وجمارك','موارد بشرية','مشاريع وميزانيات','WasselAI مدمج'],
  en: ['Inventory & Warehouses','Integrated Accounting','Logistics & Customs','Human Resources','Projects & Budgets','WasselAI Built-in'],
  fr: ['Inventaire & Entrepôts','Comptabilité intégrée','Logistique & Douanes','Ressources Humaines','Projets & Budgets','WasselAI intégré'],
  ur: ['انوینٹری اور گودام','مربوط محاسبہ','لاجسٹکس اور کسٹمز','انسانی وسائل','منصوبے اور بجٹ','WasselAI مدمج'],
  hi: ['इन्वेंट्री और गोदाम','एकीकृत लेखा','लॉजिस्टिक्स','मानव संसाधन','परियोजनाएं और बजट','WasselAI अंतर्निर्मित'],
  default: ['Inventory','Accounting','Logistics','HR','Projects','WasselAI'],
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [params]  = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [featureIdx, setFeatureIdx] = useState(0);
  const [visible, setVisible]   = useState(true);

  const isRTL = ['ar','ur'].includes(i18n.language);

  useEffect(() => {
    if (params.get('error')) setError('فشل تسجيل الدخول عبر Google');
    if (localStorage.getItem('token')) navigate('/dashboard');
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setFeatureIdx(i => (i+1) % 6); setVisible(true); }, 350);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError(t('auth.email') + ' ' + t('auth.password')); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/users/login', { email: email.trim().toLowerCase(), password });
      if (res.data.success) {
        const u = res.data.data?.user || res.data.user || {};
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userId', u._id || '');
        localStorage.setItem('userName', u.name || '');
        localStorage.setItem('userRole', u.role || '');
        localStorage.setItem('userIndustry', u.company?.industry || u.industry || 'trading_general');
        localStorage.setItem('userCompany', u.company?.name || '');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
    } finally { setLoading(false); }
  };

  const handleGoogle = () => {
    const API = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';
    window.location.href = `${API}/api/auth/google`;
  };

  const featureLabels = FEATURE_LABELS[i18n.language] || FEATURE_LABELS.default;
  const featureLabel  = featureLabels[featureIdx];

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', background:'#060d1a', position:'relative', overflow:'hidden' }}>
      {/* Orbs */}
      {[{s:500,x:-100,y:-100,c:'rgba(26,115,232,0.12)'},{s:400,x:'70%',y:'60%',c:'rgba(108,71,255,0.10)'},{s:300,x:'40%',y:'80%',c:'rgba(52,168,83,0.07)'}].map((o,i)=>(
        <Box key={i} sx={{position:'absolute',width:o.s,height:o.s,left:o.x,top:o.y,borderRadius:'50%',background:`radial-gradient(circle, ${o.c} 0%, transparent 70%)`,pointerEvents:'none'}}/>
      ))}
      <Box sx={{position:'absolute',inset:0,opacity:0.025,backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none'}}/>

      {/* Language selector - top */}
      <Box sx={{position:'absolute',top:20,right:isRTL?'auto':20,left:isRTL?20:'auto',zIndex:10}}>
        <LanguageSelector />
      </Box>

      {/* LEFT — Branding */}
      <Box sx={{display:{xs:'none',lg:'flex'},flex:1,flexDirection:'column',justifyContent:'center',alignItems:'center',p:6,zIndex:1}}>
        <Box sx={{textAlign:'center',mb:5}}>
          <Box sx={{width:72,height:72,borderRadius:'18px',mx:'auto',mb:3,background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 40px rgba(26,115,232,0.4)'}}>
            <Typography sx={{fontSize:36,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif',letterSpacing:'-1px'}}>W</Typography>
          </Box>
          <Typography sx={{fontSize:32,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>Wassel ERP</Typography>
          <Typography sx={{color:'rgba(255,255,255,0.4)',fontSize:12,mt:0.5,letterSpacing:2,textTransform:'uppercase'}}>Enterprise Resource Planning</Typography>
        </Box>

        {/* Rotating feature */}
        <Box sx={{width:320,bgcolor:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:3,p:3,backdropFilter:'blur(10px)',minHeight:100}}>
          <Fade in={visible} timeout={350}>
            <Box>
              <Typography sx={{fontSize:32,mb:1}}>{FEATURES[featureIdx].icon}</Typography>
              <Typography sx={{color:'#fff',fontWeight:700,fontSize:16,mb:0.5}}>{featureLabel}</Typography>
            </Box>
          </Fade>
          <Box sx={{display:'flex',gap:0.6,mt:2}}>
            {FEATURES.map((_,i)=>(
              <Box key={i} onClick={()=>setFeatureIdx(i)} sx={{width:i===featureIdx?20:6,height:6,borderRadius:3,cursor:'pointer',bgcolor:i===featureIdx?'#1a73e8':'rgba(255,255,255,0.2)',transition:'all 0.3s'}}/>
            ))}
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{display:'flex',gap:4,mt:5}}>
          {[['69','industry types'],['100+','API endpoints'],['ZATCA','compliant']].map(([v,l])=>(
            <Box key={v} sx={{textAlign:'center'}}>
              <Typography sx={{color:'#fff',fontWeight:800,fontSize:18}}>{v}</Typography>
              <Typography sx={{color:'rgba(255,255,255,0.35)',fontSize:11}}>{l}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* RIGHT — Form */}
      <Box sx={{flex:{xs:1,lg:'0 0 480px'},display:'flex',alignItems:'center',justifyContent:'center',p:3,zIndex:1}}>
        <Grow in timeout={600}>
          <Box sx={{width:'100%',maxWidth:420,bgcolor:'rgba(255,255,255,0.97)',borderRadius:4,p:{xs:3,sm:4.5},boxShadow:'0 32px 100px rgba(0,0,0,0.5)'}}>

            {/* Mobile logo */}
            <Box sx={{display:{xs:'flex',lg:'none'},alignItems:'center',gap:1.5,mb:3}}>
              <Box sx={{width:40,height:40,borderRadius:'10px',background:'linear-gradient(135deg,#1a73e8,#4fc3f7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Typography sx={{fontSize:20,fontWeight:900,color:'#fff',fontFamily:'Georgia,serif'}}>W</Typography>
              </Box>
              <Box><Typography variant="h6" fontWeight={800}>Wassel ERP</Typography></Box>
              <Box sx={{ml:'auto'}}><LanguageSelector variant="icon" sx={{color:'text.secondary',borderColor:'divider'}}/></Box>
            </Box>

            <Typography variant="h5" fontWeight={800} gutterBottom>{t('auth.welcomeBack')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{mb:3}}>
              {i18n.language==='ar' ? 'سجّل دخولك للمتابعة إلى نظامك' : 'Sign in to continue to your system'}
            </Typography>

            {error && <Alert severity="error" sx={{mb:2.5,borderRadius:2,fontSize:'0.85rem'}} onClose={()=>setError('')}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label={t('auth.email')} type="email" value={email}
                onChange={e=>setEmail(e.target.value)} required fullWidth sx={{mb:2}}
                InputProps={{startAdornment:<InputAdornment position="start">📧</InputAdornment>}}/>
              <TextField
                label={t('auth.password')} type={showPw?'text':'password'}
                value={password} onChange={e=>setPassword(e.target.value)} required fullWidth sx={{mb:2.5}}
                InputProps={{
                  startAdornment:<InputAdornment position="start">🔒</InputAdornment>,
                  endAdornment:<InputAdornment position="end">
                    <IconButton onClick={()=>setShowPw(v=>!v)} edge="end" size="small">
                      {showPw?<VisibilityOff sx={{fontSize:18}}/>:<Visibility sx={{fontSize:18}}/>}
                    </IconButton>
                  </InputAdornment>
                }}/>

              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                sx={{py:1.5,fontWeight:700,fontSize:'0.95rem',borderRadius:2,mb:1.5,
                  background:'linear-gradient(135deg,#1a73e8,#1557b0)',
                  boxShadow:'0 4px 20px rgba(26,115,232,0.4)',
                  '&:hover':{background:'linear-gradient(135deg,#1557b0,#0d47a1)'}}}>
                {loading?<CircularProgress size={22} color="inherit"/>:`${t('auth.signIn')} →`}
              </Button>

              <Divider sx={{my:2}}><Typography variant="caption" color="text.secondary" sx={{px:1}}>{t('common.or')}</Typography></Divider>

              <Button fullWidth variant="outlined" size="large" onClick={handleGoogle}
                sx={{py:1.3,borderRadius:2,fontWeight:600,fontSize:'0.88rem',borderColor:'#dadce0',color:'#3c4043',gap:1.5,'&:hover':{borderColor:'#1a73e8',bgcolor:'#f8f9ff'}}}>
                <Box component="img" src="https://www.google.com/favicon.ico" sx={{width:18,height:18}} alt="Google"/>
                {t('auth.signInGoogle')}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{textAlign:'center',mt:2.5}}>
              {t('auth.noAccount')}{' '}
              <Link to="/register" style={{color:'#1a73e8',fontWeight:700,textDecoration:'none'}}>{t('auth.startFree')}</Link>
            </Typography>

            <Box sx={{mt:3,pt:2.5,borderTop:'1px solid',borderColor:'divider',display:'flex',justifyContent:'center',gap:2,flexWrap:'wrap'}}>
              {['🔒','☁️','🇸🇦'].map((e,i)=>(
                <Typography key={i} variant="caption" color="text.disabled" sx={{fontSize:'0.7rem'}}>{e}</Typography>
              ))}
            </Box>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}
