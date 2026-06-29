import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, Avatar,
  Chip, Fab, Slide, Tooltip, CircularProgress,
  Divider, Button, Collapse
} from '@mui/material';
import {
  AutoAwesome, Send, Close, Refresh, Psychology,
  ExpandMore, ExpandLess, SmartToy, TipsAndUpdates,
  Code, Analytics, Person
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';

// ─── Message Bubble ───────────────────────────────────────────────────────
const Bubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5 }}>
      {!isUser && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#6c47ff', mr: 1, mt: 0.5, fontSize: 14 }}>
          <SmartToy sx={{ fontSize: 16 }} />
        </Avatar>
      )}
      <Box sx={{
        maxWidth: '80%',
        p: 1.5,
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        bgcolor: isUser ? '#1a73e8' : 'background.paper',
        border: isUser ? 'none' : '1px solid',
        borderColor: 'divider',
        color: isUser ? 'white' : 'text.primary',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        {msg.content}
        {msg.fallback && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.6 }}>
            وضع عدم الاتصال
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ─── Main WasselAI Component ──────────────────────────────────────────────
const WasselAI = () => {
  const location   = useLocation();
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState('chat'); // chat | analyze | develop | hr
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const currentPage = location.pathname.replace('/', '') || 'dashboard';

  // Welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `مرحباً! أنا WasselAI 🤖\n\nأنا هنا لمساعدتك في:\n• استخدام نظام وصّل ERP\n• تحليل بيانات شركتك\n• الإجابة على أسئلة المحاسبة والمشتريات\n• نصائح قانون العمل السعودي\n\nكيف أساعدك اليوم؟`
      }]);
      loadSuggestions();
    }
  }, [open]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reload suggestions when page changes
  useEffect(() => {
    if (open) loadSuggestions();
  }, [currentPage, open]);

  const loadSuggestions = async () => {
    try {
      const res = await api.get(`/api/ai/suggestions?page=${currentPage}`);
      if (res.data.success) setSuggestions(res.data.data.suggestions || []);
    } catch {}
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    setSuggestions([]);

    try {
      let res;
      switch (mode) {
        case 'analyze':
          res = await api.post('/api/ai/analyze', { question: msg, type: currentPage });
          setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.analysis }]);
          break;
        case 'develop':
          res = await api.post('/api/ai/develop', { request: msg, context: currentPage });
          setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.code }]);
          break;
        case 'hr':
          res = await api.post('/api/ai/hr-advice', { question: msg });
          setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.advice }]);
          break;
        default:
          res = await api.post('/api/ai/chat', { message: msg, page: currentPage });
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: res.data.data.message,
            fallback: res.data.data.fallback
          }]);
      }
      setTimeout(loadSuggestions, 500);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    try { await api.delete('/api/ai/chat'); } catch {}
    setTimeout(() => setOpen(true), 100);
  };

  const MODES = [
    { id: 'chat',    icon: <SmartToy sx={{ fontSize: 14 }} />,    label: 'مساعد' },
    { id: 'analyze', icon: <Analytics sx={{ fontSize: 14 }} />,   label: 'تحليل' },
    { id: 'hr',      icon: <Person sx={{ fontSize: 14 }} />,      label: 'HR' },
    { id: 'develop', icon: <Code sx={{ fontSize: 14 }} />,        label: 'تطوير' },
  ];

  return (
    <>
      {/* FAB Button */}
      {!open && (
        <Tooltip title="WasselAI — مساعدك الذكي" placement="left">
          <Fab
            onClick={() => setOpen(true)}
            sx={{
              position: 'fixed', bottom: 24, left: 24, zIndex: 1300,
              bgcolor: '#6c47ff', color: 'white',
              '&:hover': { bgcolor: '#5533cc' },
              boxShadow: '0 4px 20px rgba(108,71,255,0.4)',
              width: 56, height: 56
            }}
          >
            <AutoAwesome />
          </Fab>
        </Tooltip>
      )}

      {/* Chat Panel */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed', bottom: 16, left: 16, zIndex: 1300,
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            height: { xs: 'calc(100vh - 80px)', sm: 580 },
            display: 'flex', flexDirection: 'column',
            borderRadius: 3, overflow: 'hidden',
            border: '1px solid rgba(108,71,255,0.3)'
          }}
        >
          {/* Header */}
          <Box sx={{
            display: 'flex', alignItems: 'center', p: 1.5,
            bgcolor: '#6c47ff', color: 'white', gap: 1
          }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 16 }}>
              <SmartToy sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} lineHeight={1}>WasselAI</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>مساعدك الذكي • {currentPage}</Typography>
            </Box>
            <IconButton onClick={clearChat} size="small" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <Refresh fontSize="small" />
            </IconButton>
            <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: 'white' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Mode Tabs */}
          <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            {MODES.map(m => (
              <Button key={m.id} onClick={() => setMode(m.id)} size="small"
                startIcon={m.icon}
                sx={{
                  flex: 1, py: 0.8, borderRadius: 0,
                  fontSize: '0.7rem',
                  color: mode === m.id ? '#6c47ff' : 'text.secondary',
                  borderBottom: mode === m.id ? '2px solid #6c47ff' : '2px solid transparent',
                  '&:hover': { bgcolor: 'rgba(108,71,255,0.05)' }
                }}>
                {m.label}
              </Button>
            ))}
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'background.default' }}>
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#6c47ff', fontSize: 14 }}>
                  <SmartToy sx={{ fontSize: 16 }} />
                </Avatar>
                <Box sx={{ display: 'flex', gap: 0.4 }}>
                  {[0,1,2].map(i => (
                    <Box key={i} sx={{
                      width: 6, height: 6, borderRadius: '50%', bgcolor: '#6c47ff',
                      animation: 'bounce 1.2s infinite',
                      animationDelay: `${i * 0.2}s`,
                      '@keyframes bounce': {
                        '0%,60%,100%': { transform: 'translateY(0)' },
                        '30%': { transform: 'translateY(-6px)' }
                      }
                    }} />
                  ))}
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Box sx={{ px: 1.5, pb: 1 }}>
              <Box
                onClick={() => setSuggestionsOpen(v => !v)}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mb: 0.5 }}
              >
                <TipsAndUpdates sx={{ fontSize: 14, color: '#6c47ff' }} />
                <Typography variant="caption" color="#6c47ff" fontWeight={600}>اقتراحات ذكية</Typography>
                {suggestionsOpen ? <ExpandLess sx={{ fontSize: 14, color: '#6c47ff' }} /> : <ExpandMore sx={{ fontSize: 14, color: '#6c47ff' }} />}
              </Box>
              <Collapse in={suggestionsOpen}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {suggestions.map((s, i) => (
                    <Chip key={i} label={s} size="small" onClick={() => send(s)}
                      sx={{
                        fontSize: '0.7rem', height: 26, cursor: 'pointer',
                        bgcolor: 'rgba(108,71,255,0.08)', color: '#6c47ff',
                        border: '1px solid rgba(108,71,255,0.2)',
                        '&:hover': { bgcolor: 'rgba(108,71,255,0.15)' }
                      }} />
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Input */}
          <Box sx={{
            display: 'flex', gap: 1, p: 1.5, pt: 1,
            borderTop: '1px solid', borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <TextField
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={
                mode === 'analyze' ? 'اسأل عن تحليل بياناتك...' :
                mode === 'develop' ? 'صف الميزة التي تريد إضافتها...' :
                mode === 'hr'      ? 'سؤال قانون العمل السعودي...' :
                'اسألني أي شيء...'
              }
              multiline maxRows={3} size="small" fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.875rem' } }}
            />
            <IconButton
              onClick={() => send()} disabled={!input.trim() || loading}
              sx={{
                bgcolor: '#6c47ff', color: 'white', width: 40, height: 40,
                '&:hover': { bgcolor: '#5533cc' },
                '&:disabled': { bgcolor: 'action.disabledBackground' }
              }}
            >
              <Send sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Paper>
      </Slide>
    </>
  );
};

export default WasselAI;
