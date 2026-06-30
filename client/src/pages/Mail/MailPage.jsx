import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, TextField, Avatar, Chip,
  Dialog, DialogContent, CircularProgress, InputAdornment, Tooltip,
  Badge, Menu, MenuItem, Autocomplete, Checkbox
} from '@mui/material';
import {
  Inbox, Send, Drafts, StarBorder, Star, Archive, Delete,
  Add, Search, Refresh, Reply, Forward, MoreVert, AttachFile,
  Close, ArrowBack, Person, Mail as MailIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';

const FOLDERS = [
  { key:'inbox',   icon:Inbox,      labelAr:'الوارد',      labelEn:'Inbox' },
  { key:'starred', icon:StarBorder, labelAr:'المهم',       labelEn:'Starred' },
  { key:'sent',    icon:Send,       labelAr:'المرسل',      labelEn:'Sent' },
  { key:'drafts',  icon:Drafts,     labelAr:'المسودات',    labelEn:'Drafts' },
  { key:'archive', icon:Archive,    labelAr:'الأرشيف',     labelEn:'Archive' },
  { key:'trash',   icon:Delete,     labelAr:'سلة المحذوفات', labelEn:'Trash' },
];

const EMPTY_COMPOSE = {
  to: [], cc: [], externalTo: [], subject: '', body: '', priority: 'normal',
  inReplyTo: null, draftId: null,
};

export default function MailPage() {
  const { t, i18n } = useTranslation();
  const AR = i18n.language === 'ar';

  const [folder,   setFolder]   = useState('inbox');
  const [emails,   setEmails]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [thread,   setThread]   = useState([]);
  const [search,   setSearch]   = useState('');
  const [unread,   setUnread]   = useState(0);
  const [contacts, setContacts] = useState({ internal: [], external: [] });

  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose]   = useState(EMPTY_COMPOSE);
  const [sending, setSending]   = useState(false);
  const [error,   setError]     = useState('');

  // ── Load folder emails ────────────────────────────────────────
  const loadEmails = useCallback(async () => {
    setLoading(true); setSelected(null);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const r = await api.get(`/api/mail/folder/${folder}${params}`);
      if (r.data.success) setEmails(r.data.data || []);
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setLoading(false); }
  }, [folder, search, t]);

  const loadContacts = useCallback(async () => {
    try {
      const r = await api.get('/api/mail/contacts');
      if (r.data.success) setContacts(r.data.data);
    } catch (e) {}
  }, []);

  const loadUnread = useCallback(async () => {
    try {
      const r = await api.get('/api/mail/unread-count');
      if (r.data.success) setUnread(r.data.count);
    } catch (e) {}
  }, []);

  useEffect(() => { loadEmails(); }, [loadEmails]);
  useEffect(() => { loadContacts(); loadUnread(); }, [loadContacts, loadUnread]);

  // ── Open an email ─────────────────────────────────────────────
  const openEmail = async (email) => {
    try {
      const r = await api.get(`/api/mail/${email._id}`);
      if (r.data.success) {
        setSelected(r.data.data);
        setThread(r.data.thread || []);
        loadUnread();
        setEmails(prev => prev.map(e => e._id === email._id ? { ...e, isRead:true } : e));
      }
    } catch (e) {}
  };

  // ── Star toggle ───────────────────────────────────────────────
  const toggleStar = async (id, e) => {
    e.stopPropagation();
    try {
      const r = await api.put(`/api/mail/${id}/star`);
      setEmails(prev => prev.map(em => em._id === id ? { ...em, isStarred: r.data.isStarred } : em));
    } catch (err) {}
  };

  // ── Move (archive/trash/inbox) ───────────────────────────────
  const moveEmail = async (id, targetFolder) => {
    try {
      await api.put(`/api/mail/${id}/move`, { folder: targetFolder });
      setEmails(prev => prev.filter(e => e._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {}
  };

  // ── Compose ───────────────────────────────────────────────────
  const openCompose = (prefill = {}) => {
    setCompose({ ...EMPTY_COMPOSE, ...prefill });
    setError('');
    setComposeOpen(true);
  };

  const openReply = (email, all=false) => {
    const recipients = [email.from?._id].filter(Boolean);
    openCompose({
      to: recipients,
      subject: email.subject?.startsWith('رد:') ? email.subject : `رد: ${email.subject}`,
      body: `<br/><br/><div style="border-right:2px solid #ccc;padding-right:8px;color:#666">${AR?'بتاريخ':'On'} ${new Date(email.createdAt).toLocaleString()}، ${email.fromName} ${AR?'كتب':'wrote'}:<br/>${email.body}</div>`,
      inReplyTo: email.threadId || email._id,
    });
  };

  const openForward = (email) => {
    openCompose({
      subject: email.subject?.startsWith('إعادة توجيه:') ? email.subject : `إعادة توجيه: ${email.subject}`,
      body: `<br/><br/><div style="border-right:2px solid #ccc;padding-right:8px;color:#666">${AR?'رسالة محوّلة من':'Forwarded from'} ${email.fromName}:<br/>${email.body}</div>`,
      isForward: true,
    });
  };

  const handleSend = async (asDraft=false) => {
    if (!asDraft && compose.to.length===0 && compose.externalTo.length===0) {
      setError(AR?'حدد مستلماً واحداً على الأقل':'Add at least one recipient');
      return;
    }
    setSending(true); setError('');
    try {
      await api.post('/api/mail', { ...compose, asDraft });
      setComposeOpen(false);
      setCompose(EMPTY_COMPOSE);
      if (folder === 'sent' || folder === 'drafts') loadEmails();
    } catch (e) { setError(e.response?.data?.message || t('common.error')); }
    finally { setSending(false); }
  };

  const fmtDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(AR?'ar-SA':'en-US', { hour:'2-digit', minute:'2-digit' });
    }
    return date.toLocaleDateString(AR?'ar-SA':'en-GB', { day:'numeric', month:'short' });
  };

  const allContacts = [...contacts.internal, ...contacts.external];

  return (
    <Layout>
      <Box sx={{ display:'flex', height:'calc(100vh - 64px)', bgcolor:'#fff' }}>

        {/* ═══ LEFT SIDEBAR — FOLDERS ═══ */}
        <Box sx={{ width:240, borderRight:'1px solid #eee', p:2, flexShrink:0, overflowY:'auto' }}>
          <Button fullWidth variant="contained" startIcon={<Add/>}
            onClick={() => openCompose()}
            sx={{ mb:2, py:1.2, borderRadius:3, bgcolor:'#1a73e8', '&:hover':{ bgcolor:'#1557b0' } }}>
            {AR?'رسالة جديدة':'Compose'}
          </Button>

          <List dense>
            {FOLDERS.map(f => {
              const Icon = f.icon;
              const isStarredFilled = f.key==='starred';
              return (
                <ListItemButton key={f.key} selected={folder===f.key}
                  onClick={() => setFolder(f.key)}
                  sx={{ borderRadius:2, mb:0.3,
                    '&.Mui-selected': { bgcolor:'#e8f0fe', color:'#1a73e8', '& .MuiListItemIcon-root':{ color:'#1a73e8' } } }}>
                  <ListItemIcon sx={{ minWidth:36 }}>
                    {f.key==='inbox' && unread>0 ? (
                      <Badge badgeContent={unread} color="error"><Icon sx={{ fontSize:20 }}/></Badge>
                    ) : <Icon sx={{ fontSize:20 }}/>}
                  </ListItemIcon>
                  <ListItemText primary={AR?f.labelAr:f.labelEn}
                    primaryTypographyProps={{ fontSize:'0.88rem', fontWeight: folder===f.key?700:400 }}/>
                </ListItemButton>
              );
            })}
          </List>

          <Divider sx={{ my:2 }}/>
          <Typography variant="caption" color="text.secondary" sx={{ px:1, fontWeight:700 }}>
            {AR?'جهات الاتصال':'Contacts'}
          </Typography>
          <Box sx={{ mt:1, maxHeight:220, overflowY:'auto' }}>
            {contacts.internal.slice(0,8).map(c => (
              <Box key={c._id} sx={{ display:'flex', alignItems:'center', gap:1, p:0.7, borderRadius:2,
                cursor:'pointer', '&:hover':{ bgcolor:'#f5f5f5' } }}
                onClick={() => openCompose({ to:[c._id] })}>
                <Badge overlap="circular" variant="dot" color={c.isOnline?'success':'default'}
                  anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
                  <Avatar sx={{ width:24, height:24, fontSize:11, bgcolor:'#1a73e820', color:'#1a73e8' }}>{c.name?.[0]}</Avatar>
                </Badge>
                <Typography variant="caption" noWrap>{c.name}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ═══ MIDDLE — EMAIL LIST ═══ */}
        <Box sx={{ width: selected ? 380 : 'auto', flex: selected ? 'none' : 1,
          borderRight: selected ? '1px solid #eee' : 'none', display:'flex', flexDirection:'column', minWidth:0 }}>

          <Box sx={{ p:1.5, borderBottom:'1px solid #eee', display:'flex', gap:1, alignItems:'center' }}>
            <TextField size="small" fullWidth placeholder={AR?'بحث في البريد...':'Search mail...'}
              value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter' && loadEmails()}
              InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:18 }}/></InputAdornment> }}/>
            <IconButton size="small" onClick={loadEmails}><Refresh sx={{ fontSize:18 }}/></IconButton>
          </Box>

          <Box sx={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <Box sx={{ display:'flex', justifyContent:'center', py:5 }}><CircularProgress size={26}/></Box>
            ) : emails.length === 0 ? (
              <Box sx={{ textAlign:'center', py:6, color:'text.secondary' }}>
                <MailIcon sx={{ fontSize:40, opacity:0.3, mb:1 }}/>
                <Typography variant="body2">{AR?'لا توجد رسائل':'No messages'}</Typography>
              </Box>
            ) : emails.map(email => (
              <Box key={email._id} onClick={() => openEmail(email)}
                sx={{
                  display:'flex', gap:1.2, p:1.5, cursor:'pointer',
                  borderBottom:'1px solid #f5f5f5',
                  bgcolor: selected?._id===email._id ? '#e8f0fe' : (!email.isRead ? '#fff' : '#fafafa'),
                  '&:hover': { bgcolor:'#f0f4f9' },
                }}>
                <IconButton size="small" onClick={(e)=>toggleStar(email._id,e)} sx={{ p:0.3, alignSelf:'flex-start' }}>
                  {email.isStarred ? <Star sx={{ fontSize:18, color:'#f9ab00' }}/> : <StarBorder sx={{ fontSize:18, color:'#bbb' }}/>}
                </IconButton>
                <Avatar sx={{ width:34, height:34, fontSize:13, bgcolor:'#1a73e820', color:'#1a73e8', flexShrink:0 }}>
                  {(folder==='sent'||folder==='drafts' ? email.to?.[0]?.name : email.fromName)?.[0] || '?'}
                </Avatar>
                <Box sx={{ flex:1, minWidth:0 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <Typography variant="body2" noWrap fontWeight={!email.isRead?700:400} sx={{ maxWidth:180 }}>
                      {folder==='sent'||folder==='drafts'
                        ? (email.to?.map(u=>u.name).join(', ') || email.externalTo?.join(', ') || (AR?'(بدون مستلم)':'(no recipient)'))
                        : (email.fromName || email.from?.name)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink:0, ml:1 }}>
                      {fmtDate(email.createdAt)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" noWrap fontWeight={!email.isRead?600:400}>
                    {email.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div"
                    sx={{ '& *': { display:'inline' } }}
                    dangerouslySetInnerHTML={{ __html: (email.body||'').replace(/<[^>]+>/g,' ').slice(0,80) }}/>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ═══ RIGHT — EMAIL READER ═══ */}
        {selected && (
          <Box sx={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflowY:'auto' }}>
            <Box sx={{ p:2, borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:1 }}>
              <IconButton size="small" onClick={()=>setSelected(null)} sx={{ display:{ md:'none' } }}>
                <ArrowBack/>
              </IconButton>
              <Typography variant="h6" fontWeight={700} sx={{ flex:1 }}>{selected.subject}</Typography>
              <Tooltip title={AR?'أرشفة':'Archive'}>
                <IconButton size="small" onClick={()=>moveEmail(selected._id,'archive')}><Archive sx={{ fontSize:18 }}/></IconButton>
              </Tooltip>
              <Tooltip title={AR?'حذف':'Delete'}>
                <IconButton size="small" onClick={()=>moveEmail(selected._id,'trash')}><Delete sx={{ fontSize:18 }}/></IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ p:3, flex:1 }}>
              {(thread.length ? thread : [selected]).map((msg, idx) => (
                <Box key={msg._id||idx} sx={{ mb:3, pb:3, borderBottom: idx < thread.length-1 ? '1px solid #eee' : 'none' }}>
                  <Box sx={{ display:'flex', gap:1.5, mb:2 }}>
                    <Avatar sx={{ width:40, height:40, bgcolor:'#1a73e820', color:'#1a73e8' }}>
                      {msg.fromName?.[0] || msg.from?.name?.[0]}
                    </Avatar>
                    <Box sx={{ flex:1 }}>
                      <Typography variant="body2" fontWeight={700}>{msg.fromName || msg.from?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {AR?'إلى':'To'}: {msg.to?.map(u=>u.name||u.email).join(', ') || msg.externalTo?.join(', ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(msg.createdAt).toLocaleString(AR?'ar-SA':'en-GB')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ pl:0, fontSize:'0.92rem', lineHeight:1.7 }}
                    dangerouslySetInnerHTML={{ __html: msg.body || '' }}/>
                  {msg.attachments?.length > 0 && (
                    <Box sx={{ mt:2, display:'flex', gap:1, flexWrap:'wrap' }}>
                      {msg.attachments.map((a,i)=>(
                        <Chip key={i} icon={<AttachFile sx={{ fontSize:14 }}/>} label={a.name} size="small"
                          component="a" href={a.url} target="_blank" clickable/>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>

            <Box sx={{ p:2, borderTop:'1px solid #eee', display:'flex', gap:1 }}>
              <Button variant="outlined" startIcon={<Reply/>} onClick={()=>openReply(selected)}>
                {AR?'رد':'Reply'}
              </Button>
              <Button variant="outlined" startIcon={<Forward/>} onClick={()=>openForward(selected)}>
                {AR?'إعادة توجيه':'Forward'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* ═══ COMPOSE DIALOG ═══ */}
      <Dialog open={composeOpen} onClose={()=>setComposeOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx:{ borderRadius:3, position:'fixed', bottom:0, right:{ xs:0, sm:24 }, m:0,
          maxHeight:'80vh' } }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          bgcolor:'#1a73e8', color:'#fff', px:2, py:1.2 }}>
          <Typography fontWeight={700} fontSize="0.95rem">{AR?'رسالة جديدة':'New Message'}</Typography>
          <IconButton size="small" onClick={()=>setComposeOpen(false)} sx={{ color:'#fff' }}>
            <Close sx={{ fontSize:18 }}/>
          </IconButton>
        </Box>
        <DialogContent sx={{ p:0 }}>
          {error && <Box sx={{ p:1.5, bgcolor:'#fdecea', color:'#a32d2d', fontSize:'0.85rem' }}>{error}</Box>}

          <Box sx={{ borderBottom:'1px solid #eee' }}>
            <Autocomplete multiple size="small"
              options={allContacts}
              getOptionLabel={c => c.name ? `${c.name} (${c.email})` : c.email}
              value={allContacts.filter(c => compose.to.includes(c._id))}
              onChange={(_, vals) => setCompose(p => ({ ...p, to: vals.map(v=>v._id) }))}
              renderInput={params => (
                <TextField {...params} variant="standard" placeholder={AR?'إلى':'To'}
                  sx={{ px:2, py:0.5 }} InputProps={{ ...params.InputProps, disableUnderline:true }}/>
              )}/>
          </Box>
          <Box sx={{ borderBottom:'1px solid #eee' }}>
            <TextField fullWidth variant="standard" placeholder={AR?'إلى بريد خارجي (افصل بفاصلة)':'External email (comma-separated)'}
              value={compose.externalTo.join(', ')}
              onChange={e => setCompose(p => ({ ...p, externalTo: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }))}
              sx={{ px:2, py:0.8 }} InputProps={{ disableUnderline:true }}/>
          </Box>
          <Box sx={{ borderBottom:'1px solid #eee' }}>
            <TextField fullWidth variant="standard" placeholder={AR?'الموضوع':'Subject'}
              value={compose.subject} onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
              sx={{ px:2, py:0.8 }} InputProps={{ disableUnderline:true }}/>
          </Box>
          <TextField fullWidth multiline minRows={8} maxRows={14} variant="standard"
            placeholder={AR?'اكتب رسالتك...':'Write your message...'}
            value={compose.body?.replace(/<[^>]+>/g, '\n')}
            onChange={e => setCompose(p => ({ ...p, body: e.target.value.replace(/\n/g,'<br/>') }))}
            sx={{ px:2, py:1 }} InputProps={{ disableUnderline:true }}/>
        </DialogContent>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', p:1.5, borderTop:'1px solid #eee' }}>
          <Button variant="contained" onClick={()=>handleSend(false)} disabled={sending}
            startIcon={sending?<CircularProgress size={14} color="inherit"/>:<Send sx={{ fontSize:16 }}/>}
            sx={{ bgcolor:'#1a73e8', borderRadius:5, px:3 }}>
            {AR?'إرسال':'Send'}
          </Button>
          <Box>
            <Button size="small" onClick={()=>handleSend(true)} disabled={sending}>{AR?'حفظ كمسودة':'Save Draft'}</Button>
            <IconButton size="small" onClick={()=>setComposeOpen(false)}><Delete sx={{ fontSize:18 }}/></IconButton>
          </Box>
        </Box>
      </Dialog>
    </Layout>
  );
}
