import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, IconButton, Avatar, Chip,
  List, ListItemButton, ListItemAvatar, ListItemText, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, CircularProgress, Paper, Tooltip,
  MenuItem, Snackbar, Alert, InputAdornment,
  Tabs, Tab, Drawer, Switch
} from '@mui/material';
import {
  Send, Close, Search, Videocam, Phone, MoreVert, Add,
  Reply, Delete, Done, DoneAll, Groups, PersonAdd,
  MeetingRoom, ContentCopy, Settings, Link as LinkIcon,
  VolumeUp, Translate, AccessTime
} from '@mui/icons-material';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import MeetRoom from '../../components/MeetRoom';
import IncomingCallModal from '../../components/IncomingCallModal';
import SoundSettings from '../../components/SoundSettings';
import { useSounds } from '../../hooks/useSounds';

const API_URL = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';

// ─── Translate text via LibreTranslate / MyMemory ─────────────────────────
const translateText = async (text, targetLang) => {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|${targetLang}`
    );
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch { return text; }
};

// ─── Online dot ───────────────────────────────────────────────────────────
const OnlineDot = ({ online }) => (
  <Box sx={{
    position:'absolute', bottom:2, right:2, width:10, height:10,
    borderRadius:'50%', bgcolor:online?'#34a853':'#bdbdbd', border:'2px solid white'
  }} />
);

// ─── URL detector ─────────────────────────────────────────────────────────
const urlRegex = /(https?:\/\/[^\s]+)/g;
const MessageText = ({ text }) => {
  const parts = text.split(urlRegex);
  return (
    <Typography variant="body2" sx={{ lineHeight:1.6, wordBreak:'break-word' }}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <Box key={i} component="a" href={part} target="_blank" rel="noopener noreferrer"
            onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(part,'_blank','noopener'); }}
            sx={{ color:'#90caf9', textDecoration:'underline', cursor:'pointer',
              display:'inline-flex', alignItems:'center', gap:0.3 }}>
            <LinkIcon sx={{ fontSize:12 }} />
            {part.length > 40 ? part.slice(0,40)+'...' : part}
          </Box>
        ) : part
      )}
    </Typography>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────
const TRANSLATE_LANGS = [
  { code:'en', label:'English' },{ code:'fr', label:'Français' },
  { code:'hi', label:'हिंदी'  },{ code:'tr', label:'Türkçe'   },
  { code:'ur', label:'اردو'   },{ code:'de', label:'Deutsch'  },
  { code:'es', label:'Español'},{ code:'zh', label:'中文'      },
];

const MessageBubble = ({ msg, myId, onReply, onDelete }) => {
  const isMe = msg.sender?._id === myId || msg.sender === myId;
  const time  = new Date(msg.createdAt).toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
  const [menu, setMenu]           = useState(null);
  const [translated, setTranslated] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);

  const handleTranslate = async (lang) => {
    setTranslateOpen(false); setTranslating(true);
    const result = await translateText(msg.text, lang);
    setTranslated(result);
    setTranslating(false);
    // Auto-clear after 60 seconds
    setTimeout(() => setTranslated(''), 60000);
  };

  return (
    <Box sx={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', mb:1.5, gap:1 }}>
      {!isMe && (
        <Avatar src={msg.sender?.avatar} sx={{ width:28, height:28, mt:0.5, fontSize:12, bgcolor:'#1a73e8' }}>
          {msg.sender?.name?.[0]}
        </Avatar>
      )}
      <Box sx={{ maxWidth:'72%' }}>
        {!isMe && <Typography variant="caption" color="text.secondary" sx={{ px:0.5, display:'block' }}>{msg.sender?.name}</Typography>}

        {/* Reply reference */}
        {msg.replyTo && (
          <Box sx={{ mb:0.5, px:1.5, py:0.8, bgcolor:'rgba(0,0,0,0.06)', borderRadius:2, borderRight:'3px solid #1a73e8' }}>
            <Typography variant="caption" color="primary" fontWeight={700} display="block">{msg.replyTo.sender?.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{msg.replyTo.text}</Typography>
          </Box>
        )}

        <Box
          sx={{ px:2, py:1.2, borderRadius:isMe?'18px 18px 4px 18px':'18px 18px 18px 4px',
            bgcolor:isMe?'#1a73e8':'white', color:isMe?'white':'text.primary',
            boxShadow:'0 1px 4px rgba(0,0,0,0.1)', cursor:'context-menu',
            position:'relative'
          }}
          onContextMenu={e => { e.preventDefault(); setMenu({x:e.clientX,y:e.clientY}); }}
        >
          {msg.isDeleted ? (
            <Typography variant="body2" sx={{ fontStyle:'italic', opacity:0.6 }}>🚫 تم حذف هذه الرسالة</Typography>
          ) : (
            <MessageText text={msg.text || ''} />
          )}
        </Box>

        {/* Translation result */}
        {(translated || translating) && (
          <Box sx={{ mt:0.5, px:1.5, py:0.8, bgcolor:'#fff8e1', borderRadius:2, border:'1px solid #ffe082', display:'flex', gap:0.5, alignItems:'flex-start' }}>
            <Translate sx={{ fontSize:14, color:'#f57c00', mt:0.2 }} />
            {translating ? (
              <CircularProgress size={12} sx={{ color:'#f57c00' }} />
            ) : (
              <Box sx={{ flex:1 }}>
                <Typography variant="caption" sx={{ display:'block', color:'#f57c00', fontSize:'0.65rem' }}>
                  ترجمة (تنتهي بعد دقيقة)
                </Typography>
                <Typography variant="body2" sx={{ color:'#333' }}>{translated}</Typography>
              </Box>
            )}
            {translated && <IconButton size="small" onClick={() => setTranslated('')} sx={{ p:0 }}><Close sx={{ fontSize:12 }} /></IconButton>}
          </Box>
        )}

        {/* Time + read receipts */}
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5, px:0.5, mt:0.3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>{time}</Typography>
          {isMe && <DoneAll sx={{ fontSize:13, color:msg.readBy?.length>1?'#1a73e8':'text.disabled' }} />}
          {translated && <AccessTime sx={{ fontSize:11, color:'#f57c00' }} />}
        </Box>
      </Box>

      {/* Context menu */}
      {menu && (
        <Box sx={{ position:'fixed', left:menu.x, top:menu.y, zIndex:9999, bgcolor:'white',
          borderRadius:2, boxShadow:'0 4px 20px rgba(0,0,0,0.15)', py:0.5, minWidth:160 }}
          onMouseLeave={() => setMenu(null)}>
          <MenuItem dense onClick={() => { onReply(msg); setMenu(null); }}>
            <Reply sx={{ fontSize:16, mr:1, color:'#1a73e8' }} /> رد
          </MenuItem>
          <MenuItem dense onClick={() => { setTranslateOpen(true); setMenu(null); }}>
            <Translate sx={{ fontSize:16, mr:1, color:'#f57c00' }} /> ترجمة (60 ثانية)
          </MenuItem>
          <MenuItem dense onClick={() => { navigator.clipboard.writeText(msg.text||''); setMenu(null); }}>
            <ContentCopy sx={{ fontSize:16, mr:1 }} /> نسخ
          </MenuItem>
          {isMe && !msg.isDeleted && (
            <MenuItem dense onClick={() => { onDelete(msg._id); setMenu(null); }} sx={{ color:'error.main' }}>
              <Delete sx={{ fontSize:16, mr:1 }} /> حذف
            </MenuItem>
          )}
        </Box>
      )}

      {/* Translate language picker */}
      <Dialog open={translateOpen} onClose={() => setTranslateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb:1, fontWeight:700 }}>
          <Translate sx={{ mr:1, color:'#f57c00' }} />ترجمة الرسالة
          <Typography variant="caption" display="block" color="text.secondary">
            ستظهر الترجمة لمدة 60 ثانية فقط
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', flexWrap:'wrap', gap:1, pt:1 }}>
            {TRANSLATE_LANGS.map(l => (
              <Chip key={l.code} label={l.label} onClick={() => handleTranslate(l.code)} clickable
                sx={{ cursor:'pointer', '&:hover':{ bgcolor:'#e3f2fd' } }} />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const { sound, notify, incomingCall, prefs } = useSounds();

  const [rooms, setRooms]           = useState([]);
  const [users, setUsers]           = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [search, setSearch]         = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [myId]                      = useState(localStorage.getItem('userId'));
  const [myName]                    = useState(localStorage.getItem('userName'));
  const [socket, setSocket]         = useState(null);
  const [onlineIds, setOnlineIds]   = useState(new Set());
  const [typing, setTyping]         = useState('');
  const [replyTo, setReplyTo]       = useState(null);
  const [meetOpen, setMeetOpen]     = useState(false);
  const [meetRoom, setMeetRoom]     = useState('');
  const [meetMode, setMeetMode]     = useState('video');
  const [incomingCall_, setIncomingCall_] = useState(null);
  const [soundOpen, setSoundOpen]   = useState(false);
  const [tab, setTab]               = useState(0);
  const [snack, setSnack]           = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const messagesEnd  = useRef(null);
  const typingTimer  = useRef(null);
  const activeRoomRef = useRef(null);
  activeRoomRef.current = activeRoom;

  // ── Socket ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const sock  = io(API_URL, {
      auth: { token }, transports:['websocket','polling'], reconnection:true
    });

    sock.on('connect', () => sock.emit('user_online', myId));

    sock.on('user_status', ({ userId, isOnline }) => {
      setOnlineIds(prev => { const n=new Set(prev); isOnline?n.add(userId):n.delete(userId); return n; });
    });

    sock.on('new_message', (msg) => {
      // Add to messages if in same room
      if (msg.room === activeRoomRef.current?._id) {
        setMessages(prev => prev.find(m=>m._id===msg._id)?prev:[...prev,msg]);
      }
      // Update room list
      setRooms(prev =>
        prev.map(r => r._id===msg.room ? {...r, lastMessage:msg, lastActivity:msg.createdAt} : r)
           .sort((a,b) => new Date(b.lastActivity)-new Date(a.lastActivity))
      );
      // Sound + notification
      if (msg.sender?._id !== myId && msg.sender !== myId) {
        sound('message');
        if (document.hidden) {
          notify(`رسالة من ${msg.sender?.name || 'مستخدم'}`, msg.text?.slice(0,60)||'', () => window.focus());
        }
      }
    });

    sock.on('user_typing', ({ userId, userName, isTyping }) => {
      if (userId !== myId) setTyping(isTyping ? userName : '');
    });

    sock.on('online_users', (ids) => setOnlineIds(new Set(ids)));

    sock.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id===messageId ? {...m,isDeleted:true} : m));
    });

    // ── Incoming call ───────────────────────────────────────────
    sock.on('incoming_call', ({ callerName, callerAvatar, callerCompany, mode, meetRoom }) => {
      setIncomingCall_({ callerName, callerAvatar, callerCompany, mode, meetRoom });
      incomingCall(
        callerName, mode,
        () => { acceptCall(meetRoom, mode); },
        () => setIncomingCall_(null)
      );
    });

    setSocket(sock);
    return () => sock.disconnect();
  }, [myId]);

  // ── Load data ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, usersRes] = await Promise.all([
        api.get('/api/chat/rooms'),
        api.get('/api/users/chat-contacts')
      ]);
      if (roomsRes.data.success) setRooms(roomsRes.data.data||[]);
      if (usersRes.data.success) setUsers(usersRes.data.data||[]);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  // ── Load messages ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeRoom) return;
    setMsgLoading(true); setMessages([]);
    api.get(`/api/chat/rooms/${activeRoom._id}/messages`)
      .then(r => { if (r.data.success) setMessages(r.data.data||[]); })
      .finally(() => setMsgLoading(false));
    socket?.emit('join_room', activeRoom._id);
    return () => socket?.emit('leave_room', activeRoom._id);
  }, [activeRoom?._id, socket]);

  // ── Auto scroll ───────────────────────────────────────────────
  useEffect(() => { messagesEnd.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeRoom) return;
    const text = input.trim();
    setInput(''); setReplyTo(null);
    sound('sent');
    try {
      await api.post(`/api/chat/rooms/${activeRoom._id}/messages`, { text, replyTo:replyTo?._id });
    } catch {}
  };

  // ── Typing indicator ──────────────────────────────────────────
  const handleTyping = val => {
    setInput(val);
    if (!activeRoom||!socket) return;
    socket.emit('typing_start', { roomId:activeRoom._id, userId:myId, userName:myName });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId:activeRoom._id, userId:myId });
    }, 2000);
  };

  // ── Direct chat ───────────────────────────────────────────────
  const startDirectChat = async (userId) => {
    setNewChatOpen(false);
    try {
      const res = await api.post('/api/chat/direct', { userId });
      if (res.data.success) {
        const room = res.data.data;
        setRooms(prev => { const ex=prev.find(r=>r._id===room._id); return ex?prev:[room,...prev]; });
        setActiveRoom(room);
      }
    } catch {}
  };

  // ── Start call ────────────────────────────────────────────────
  const startCall = (mode = 'video') => {
    if (!activeRoom) return;
    const rName = `wassel-${activeRoom._id.slice(-8)}`;
    setMeetRoom(rName); setMeetMode(mode); setMeetOpen(true);
    sound('call_connected');
    socket?.emit('call_incoming', {
      roomId:activeRoom._id, mode, callerName:myName,
      meetRoom:rName, participants:activeRoom.participants
    });
  };

  // ── Accept incoming call ──────────────────────────────────────
  const acceptCall = (rName, mode) => {
    sound('call_connected');
    setIncomingCall_(null);
    setMeetRoom(rName); setMeetMode(mode); setMeetOpen(true);
  };

  // ── Start meeting ─────────────────────────────────────────────
  const startMeeting = () => {
    const rName = `wassel-meet-${Date.now()}`;
    setMeetRoom(rName); setMeetMode('video'); setMeetOpen(true);
    sound('meeting');
    const link = `${window.location.origin}/meet/${rName}`;
    navigator.clipboard.writeText(link).then(() => setSnack('✅ تم نسخ رابط الاجتماع: '+link)).catch(()=>{});
  };

  // ── Delete message ────────────────────────────────────────────
  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/api/chat/rooms/messages/${messageId}`);
    } catch {}
  };

  // ── Helpers ───────────────────────────────────────────────────
  const getRoomName = room => {
    if (room.type==='group') return room.name||'مجموعة';
    const other = room.participants?.find(p=>(p._id||p)!==myId);
    return other?.name||'محادثة';
  };
  const getRoomAvatar = room => {
    if (room.type==='group') return null;
    return room.participants?.find(p=>(p._id||p)!==myId)?.avatar||null;
  };
  const isRoomOnline = room => {
    if (room.type==='group') return false;
    const other = room.participants?.find(p=>(p._id||p)!==myId);
    return other ? onlineIds.has(other._id||other) : false;
  };
  const onlineCount = users.filter(u=>onlineIds.has(u._id)).length;
  const myCompany   = localStorage.getItem('userCompany')||'';

  const filteredRooms = rooms.filter(r => {
    if (!search) return true;
    return getRoomName(r).toLowerCase().includes(search.toLowerCase());
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q)||
           (typeof u.company==='object'?u.company?.name:u.company||'').toLowerCase().includes(q);
  }).filter(u => {
    const uCo = typeof u.company==='object'?u.company?.name:u.company||'';
    if (tab===0) return true;
    if (tab===1) return uCo===myCompany;
    return uCo!==myCompany;
  });

  return (
    <Layout>
      {/* Incoming call modal */}
      <IncomingCallModal
        call={incomingCall_}
        onAccept={() => acceptCall(incomingCall_.meetRoom, incomingCall_.mode)}
        onReject={() => { setIncomingCall_(null); sound('call_ended'); }}
      />

      <Box sx={{ display:'flex', height:'calc(100vh - 64px)', bgcolor:'#f5f7fa' }}>

        {/* ── SIDEBAR ── */}
        <Box sx={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', bgcolor:'white', borderRight:'1px solid', borderColor:'divider' }}>
          <Box sx={{ p:2, borderBottom:'1px solid', borderColor:'divider' }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize:'1rem' }}>Wassel Chat</Typography>
              <Box sx={{ display:'flex', gap:0.5 }}>
                <Tooltip title="إعدادات الصوت">
                  <IconButton size="small" onClick={()=>setSoundOpen(true)} sx={{ color:prefs.enabled?'#1a73e8':'text.disabled' }}>
                    <VolumeUp sx={{ fontSize:18 }}/>
                  </IconButton>
                </Tooltip>
                <Tooltip title="اجتماع جديد">
                  <IconButton size="small" onClick={startMeeting} sx={{ color:'#7b1fa2' }}>
                    <MeetingRoom sx={{ fontSize:18 }}/>
                  </IconButton>
                </Tooltip>
                <Tooltip title="محادثة جديدة">
                  <IconButton size="small" onClick={()=>setNewChatOpen(true)} sx={{ bgcolor:'#1a73e8',color:'white','&:hover':{bgcolor:'#1557b0'} }}>
                    <Add sx={{ fontSize:16 }}/>
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
              <Box sx={{ width:8,height:8,borderRadius:'50%',bgcolor:'#34a853' }}/>
              <Typography variant="caption" color="text.secondary">{onlineCount} متصل الآن</Typography>
            </Box>
            <TextField size="small" fullWidth placeholder="بحث..." value={search}
              onChange={e=>setSearch(e.target.value)}
              InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:16,color:'text.secondary' }}/></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3,fontSize:'0.85rem' } }}/>
          </Box>

          <Box sx={{ flex:1, overflow:'auto' }}>
            {loading ? (
              <Box sx={{ display:'flex',justifyContent:'center',pt:4 }}><CircularProgress size={24}/></Box>
            ) : filteredRooms.length===0 ? (
              <Box sx={{ p:3,textAlign:'center' }}>
                <Typography color="text.secondary" variant="body2">لا توجد محادثات</Typography>
                <Button size="small" startIcon={<Add/>} onClick={()=>setNewChatOpen(true)} sx={{ mt:1 }}>
                  بدء محادثة
                </Button>
              </Box>
            ) : (
              <List dense disablePadding>
                {filteredRooms.map(room => {
                  const isOnline = isRoomOnline(room);
                  const rName    = getRoomName(room);
                  const isActive = activeRoom?._id===room._id;
                  const lastMsg  = room.lastMessage;
                  return (
                    <React.Fragment key={room._id}>
                      <ListItemButton onClick={()=>setActiveRoom(room)} selected={isActive}
                        sx={{ px:2,py:1.2,'&.Mui-selected':{bgcolor:'#e8f0fe'} }}>
                        <ListItemAvatar>
                          <Box sx={{ position:'relative' }}>
                            <Avatar src={getRoomAvatar(room)} sx={{ width:40,height:40,bgcolor:'#1a73e8',fontSize:16 }}>
                              {room.type==='group'?<Groups sx={{ fontSize:20 }}/>:rName[0]}
                            </Avatar>
                            <OnlineDot online={isOnline}/>
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={isActive?700:500} noWrap>{rName}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary" noWrap>{lastMsg?.text||'—'}</Typography>}
                        />
                        {isOnline && !isActive && <Box sx={{ width:8,height:8,borderRadius:'50%',bgcolor:'#34a853',flexShrink:0 }}/>}
                      </ListItemButton>
                      <Divider component="li" sx={{ ml:7 }}/>
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>

        {/* ── CHAT AREA ── */}
        <Box sx={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {!activeRoom ? (
            <Box sx={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2 }}>
              <Box sx={{ width:80,height:80,borderRadius:'50%',bgcolor:'#e8f0fe',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Groups sx={{ fontSize:40,color:'#1a73e8' }}/>
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.secondary">Wassel Chat</Typography>
              <Typography variant="body2" color="text.disabled">اختر محادثة أو ابدأ واحدة جديدة</Typography>
              <Box sx={{ display:'flex',gap:1 }}>
                <Button variant="contained" startIcon={<PersonAdd/>} onClick={()=>setNewChatOpen(true)}>محادثة جديدة</Button>
                <Button variant="outlined" startIcon={<MeetingRoom/>} onClick={startMeeting}>اجتماع</Button>
              </Box>
            </Box>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ px:3,py:1.5,bgcolor:'white',borderBottom:'1px solid',borderColor:'divider',display:'flex',alignItems:'center',gap:2 }}>
                <Box sx={{ position:'relative' }}>
                  <Avatar src={getRoomAvatar(activeRoom)} sx={{ width:40,height:40,bgcolor:'#1a73e8',fontSize:16 }}>
                    {activeRoom.type==='group'?<Groups/>:getRoomName(activeRoom)[0]}
                  </Avatar>
                  <OnlineDot online={isRoomOnline(activeRoom)}/>
                </Box>
                <Box sx={{ flex:1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{getRoomName(activeRoom)}</Typography>
                  <Typography variant="caption" color={isRoomOnline(activeRoom)?'success.main':'text.secondary'}>
                    {typing ? `${typing} يكتب...` : isRoomOnline(activeRoom)?'متصل الآن':'غير متصل'}
                  </Typography>
                </Box>
                <Tooltip title="مكالمة صوتية">
                  <IconButton onClick={()=>startCall('audio')} sx={{ color:'#34a853' }}><Phone/></IconButton>
                </Tooltip>
                <Tooltip title="مكالمة فيديو">
                  <IconButton onClick={()=>startCall('video')} sx={{ color:'#1a73e8' }}><Videocam/></IconButton>
                </Tooltip>
                <Tooltip title="اجتماع">
                  <IconButton onClick={startMeeting} sx={{ color:'#7b1fa2' }}><MeetingRoom/></IconButton>
                </Tooltip>
              </Box>

              {/* Messages */}
              <Box sx={{ flex:1,overflow:'auto',p:2,display:'flex',flexDirection:'column',bgcolor:'#f5f7fa' }}>
                {msgLoading ? (
                  <Box sx={{ display:'flex',justifyContent:'center',pt:4 }}><CircularProgress size={24}/></Box>
                ) : messages.map((msg,i) => (
                  <MessageBubble key={msg._id||i} msg={msg} myId={myId}
                    onReply={setReplyTo} onDelete={deleteMessage}/>
                ))}
                {typing && (
                  <Box sx={{ display:'flex',alignItems:'center',gap:1 }}>
                    <Avatar sx={{ width:26,height:26,fontSize:11,bgcolor:'#e8f0fe',color:'#1a73e8' }}>{typing[0]}</Avatar>
                    <Box sx={{ px:2,py:0.8,borderRadius:'16px 16px 16px 4px',bgcolor:'white',boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }}>
                      <Box sx={{ display:'flex',gap:0.4 }}>
                        {[0,1,2].map(i=>(
                          <Box key={i} sx={{ width:5,height:5,borderRadius:'50%',bgcolor:'#aaa',
                            animation:'bounce 1.2s infinite',animationDelay:`${i*0.2}s`,
                            '@keyframes bounce':{'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-4px)'}} }}/>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEnd}/>
              </Box>

              {/* Reply bar */}
              {replyTo && (
                <Box sx={{ mx:2,mb:0.5,p:1,bgcolor:'#e8f0fe',borderRadius:2,display:'flex',alignItems:'center',gap:1,borderRight:'3px solid #1a73e8' }}>
                  <Box sx={{ flex:1 }}>
                    <Typography variant="caption" color="primary" fontWeight={700}>{replyTo.sender?.name}</Typography>
                    <Typography variant="caption" display="block" noWrap color="text.secondary">{replyTo.text}</Typography>
                  </Box>
                  <IconButton size="small" onClick={()=>setReplyTo(null)}><Close sx={{ fontSize:16 }}/></IconButton>
                </Box>
              )}

              {/* Input */}
              <Box sx={{ p:2,bgcolor:'white',borderTop:'1px solid',borderColor:'divider',display:'flex',gap:1,alignItems:'flex-end' }}>
                <TextField value={input} onChange={e=>handleTyping(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                  placeholder="اكتب رسالة..."
                  multiline maxRows={4} fullWidth size="small"
                  sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3,fontSize:'0.9rem',bgcolor:'#f5f7fa' } }}/>
                <IconButton onClick={sendMessage} disabled={!input.trim()}
                  sx={{ bgcolor:'#1a73e8',color:'white',width:42,height:42,'&:hover':{bgcolor:'#1557b0'},'&:disabled':{bgcolor:'action.disabledBackground'} }}>
                  <Send sx={{ fontSize:18 }}/>
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ── NEW CHAT DIALOG ── */}
      <Dialog open={newChatOpen} onClose={()=>setNewChatOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ pb:1,fontWeight:700 }}>
          <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            محادثة جديدة
            <IconButton size="small" onClick={()=>setNewChatOpen(false)}><Close sx={{ fontSize:18 }}/></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p:0 }}>
          <Box sx={{ px:2,pb:1.5 }}>
            <TextField size="small" fullWidth placeholder="ابحث بالاسم أو الشركة..." value={userSearch}
              onChange={e=>setUserSearch(e.target.value)}
              InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{ fontSize:16,color:'text.secondary' }}/></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3 } }}/>
          </Box>
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ px:2,borderBottom:'1px solid',borderColor:'divider' }}>
            <Tab label="الكل" sx={{ fontSize:'0.72rem',minWidth:0,px:1.5 }}/>
            <Tab label="شركتي" sx={{ fontSize:'0.72rem',minWidth:0,px:1.5 }}/>
            <Tab label="شركات أخرى" sx={{ fontSize:'0.72rem',minWidth:0,px:1.5 }}/>
          </Tabs>
          <List sx={{ maxHeight:340,overflow:'auto' }}>
            {filteredUsers.length===0 ? (
              <Box sx={{ p:3,textAlign:'center' }}>
                <Typography color="text.secondary" variant="body2">لا يوجد مستخدمون</Typography>
              </Box>
            ) : filteredUsers.map(user => {
              const isOnline = onlineIds.has(user._id);
              const uCo = typeof user.company==='object'?user.company?.name:user.company||'';
              return (
                <ListItemButton key={user._id} onClick={()=>startDirectChat(user._id)} sx={{ py:1.2 }}>
                  <ListItemAvatar>
                    <Box sx={{ position:'relative' }}>
                      <Avatar src={user.avatar} sx={{ width:40,height:40,bgcolor:'#1a73e8',fontSize:15 }}>
                        {user.name?.[0]}
                      </Avatar>
                      <OnlineDot online={isOnline}/>
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{user.name}</Typography>}
                    secondary={
                      <Box sx={{ display:'flex',alignItems:'center',gap:0.5 }}>
                        <Box sx={{ width:6,height:6,borderRadius:'50%',bgcolor:isOnline?'#34a853':'#bdbdbd' }}/>
                        <Typography variant="caption" color={isOnline?'success.main':'text.secondary'} sx={{ fontSize:'0.7rem' }}>
                          {isOnline?'متصل الآن':'غير متصل'}
                        </Typography>
                        {uCo && <Chip label={uCo} size="small" sx={{ fontSize:'0.6rem',height:16,ml:0.5 }}/>}
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>

      {/* ── SOUND SETTINGS DRAWER ── */}
      <Drawer anchor="right" open={soundOpen} onClose={()=>setSoundOpen(false)}
        PaperProps={{ sx:{ width:340,p:2,borderRadius:'16px 0 0 16px' } }}>
        <Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'center',mb:2 }}>
          <Typography variant="h6" fontWeight={700}>⚙️ إعدادات الصوت</Typography>
          <IconButton onClick={()=>setSoundOpen(false)}><Close/></IconButton>
        </Box>
        <SoundSettings onClose={()=>setSoundOpen(false)}/>
      </Drawer>

      {/* ── MEET ROOM ── */}
      <MeetRoom open={meetOpen} onClose={()=>{ setMeetOpen(false); sound('call_ended'); }} roomName={meetRoom} mode={meetMode}/>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={()=>setSnack('')}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert onClose={()=>setSnack('')} severity="info" sx={{ borderRadius:2 }}>{snack}</Alert>
      </Snackbar>
    </Layout>
  );
}
