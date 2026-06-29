import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, IconButton, Avatar, Chip, Fab,
  List, ListItemButton, ListItemAvatar, ListItemText, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Divider, CircularProgress, Paper, Tooltip,
  Menu, MenuItem, AvatarGroup, Snackbar, Alert, InputAdornment,
  Tabs, Tab
} from '@mui/material';
import {
  Send, Close, Search, Videocam, Phone, MoreVert, Add,
  AttachFile, EmojiEmotions, Reply, Delete, Done, DoneAll,
  Groups, PersonAdd, VideoCall, Mic, MeetingRoom
} from '@mui/icons-material';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Layout from '../../components/Layout';
import MeetRoom from '../../components/MeetRoom';

const API_URL = process.env.REACT_APP_API_URL || 'https://wassel-cyj5.onrender.com';

const OnlineDot = ({ online }) => (
  <Box sx={{
    position:'absolute', bottom:2, right:2,
    width:10, height:10, borderRadius:'50%',
    bgcolor: online ? '#34a853' : '#bdbdbd',
    border: '2px solid white'
  }}/>
);

const MessageBubble = ({ msg, myId, onReply }) => {
  const isMe = msg.sender?._id === myId || msg.sender === myId;
  const time = new Date(msg.createdAt).toLocaleTimeString('ar-SA', {hour:'2-digit',minute:'2-digit'});
  return (
    <Box sx={{ display:'flex', justifyContent: isMe?'flex-end':'flex-start', mb:1, gap:1 }}>
      {!isMe && (
        <Avatar src={msg.sender?.avatar} sx={{ width:28, height:28, mt:0.5, fontSize:12 }}>
          {msg.sender?.name?.[0]}
        </Avatar>
      )}
      <Box sx={{ maxWidth:'70%' }}>
        {!isMe && <Typography variant="caption" color="text.secondary" sx={{ px:0.5 }}>{msg.sender?.name}</Typography>}
        <Box
          onClick={() => onReply && onReply(msg)}
          sx={{
            px:2, py:1, borderRadius: isMe?'16px 16px 4px 16px':'16px 16px 16px 4px',
            bgcolor: isMe?'#1a73e8':'white',
            color: isMe?'white':'text.primary',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            cursor:'pointer',
            '&:hover':{ opacity:0.9 }
          }}>
          {msg.isDeleted ? (
            <Typography variant="body2" sx={{ fontStyle:'italic', opacity:0.6 }}>تم حذف الرسالة</Typography>
          ) : (
            <Typography variant="body2" sx={{ lineHeight:1.5 }}>{msg.text}</Typography>
          )}
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5, px:0.5, mt:0.3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>{time}</Typography>
          {isMe && <DoneAll sx={{ fontSize:12, color: msg.readBy?.length>1?'#1a73e8':'text.disabled' }}/>}
        </Box>
      </Box>
    </Box>
  );
};

export default function ChatPage() {
  const { t, i18n } = useTranslation();
  const isRTL = ['ar','ur'].includes(i18n.language);

  const [rooms, setRooms]         = useState([]);
  const [users, setUsers]         = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [search, setSearch]       = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [myId]                    = useState(localStorage.getItem('userId'));
  const [socket, setSocket]       = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typing, setTyping]       = useState('');
  const [replyTo, setReplyTo]     = useState(null);
  const [meetOpen, setMeetOpen]   = useState(false);
  const [meetRoom, setMeetRoom]   = useState('');
  const [meetMode, setMeetMode]   = useState('video');
  const [tab, setTab]             = useState(0);
  const [snack, setSnack]         = useState('');
  const messagesEnd = useRef(null);
  const typingTimer = useRef(null);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const sock  = io(API_URL, {
      auth: { token },
      transports: ['websocket','polling'],
      reconnection: true,
      reconnectionAttempts: 10
    });

    sock.on('connect', () => {
      sock.emit('user_online', myId);
    });

    sock.on('user_status_change', ({ userId, isOnline }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        isOnline ? next.add(userId) : next.delete(userId);
        return next;
      });
    });

    sock.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Update room's last message
      setRooms(prev => prev.map(r =>
        r._id === msg.room ? { ...r, lastMessage: msg, lastActivity: msg.createdAt } : r
      ).sort((a,b) => new Date(b.lastActivity)-new Date(a.lastActivity)));
    });

    sock.on('user_typing', ({ userId, userName, isTyping }) => {
      if (userId !== myId) setTyping(isTyping ? userName : '');
    });

    sock.on('online_users', (ids) => {
      setOnlineUserIds(new Set(ids));
    });

    sock.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted:true, text:'تم حذف الرسالة' } : m));
    });

    setSocket(sock);
    return () => sock.disconnect();
  }, [myId]);

  // ── Load rooms and contacts ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, usersRes] = await Promise.all([
        api.get('/api/chat/rooms'),
        api.get('/api/users/chat-contacts')
      ]);
      if (roomsRes.data.success) setRooms(roomsRes.data.data || []);
      if (usersRes.data.success) setUsers(usersRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Load messages when room changes ──────────────────────────────────────
  useEffect(() => {
    if (!activeRoom) return;
    setMsgLoading(true);
    setMessages([]);
    api.get(`/api/chat/rooms/${activeRoom._id}/messages`)
      .then(res => { if (res.data.success) setMessages(res.data.data || []); })
      .finally(() => setMsgLoading(false));
    socket?.emit('join_room', activeRoom._id);
    return () => socket?.emit('leave_room', activeRoom._id);
  }, [activeRoom?._id, socket]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !activeRoom) return;
    const text = input.trim();
    setInput('');
    setReplyTo(null);
    try {
      await api.post(`/api/chat/rooms/${activeRoom._id}/messages`, {
        text, type:'text', replyTo: replyTo?._id
      });
    } catch {}
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setInput(val);
    if (!activeRoom || !socket) return;
    socket.emit('typing_start', { roomId: activeRoom._id, userId: myId, userName: localStorage.getItem('userName') });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId: activeRoom._id, userId: myId });
      setTyping('');
    }, 2000);
  };

  // ── Start direct chat ─────────────────────────────────────────────────────
  const startDirectChat = async (userId) => {
    setNewChatOpen(false);
    try {
      const res = await api.post('/api/chat/direct', { userId });
      if (res.data.success) {
        const room = res.data.data;
        setRooms(prev => {
          const exists = prev.find(r => r._id === room._id);
          return exists ? prev : [room, ...prev];
        });
        setActiveRoom(room);
      }
    } catch {}
  };

  // ── Start video/voice call ────────────────────────────────────────────────
  const startCall = (mode = 'video') => {
    if (!activeRoom) return;
    const roomName = `wassel-${activeRoom._id.slice(-8)}`;
    setMeetRoom(roomName);
    setMeetMode(mode);
    setMeetOpen(true);
    // Notify other participants
    socket?.emit('call_started', { roomId: activeRoom._id, mode, callerName: localStorage.getItem('userName'), meetRoom: roomName });
  };

  // ── Start meeting ─────────────────────────────────────────────────────────
  const startMeeting = () => {
    const roomName = `wassel-meet-${Date.now()}`;
    setMeetRoom(roomName);
    setMeetMode('video');
    setMeetOpen(true);
    const link = `${window.location.origin}/meet/${roomName}`;
    navigator.clipboard.writeText(link).catch(()=>{});
    setSnack('تم نسخ رابط الاجتماع');
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
  const filteredRooms = rooms.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = getRoomName(r).toLowerCase();
    return name.includes(q);
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) ||
           u.email?.toLowerCase().includes(q) ||
           (typeof u.company === 'object' ? u.company?.name : u.company)?.toLowerCase().includes(q);
  });

  const otherUsers = filteredUsers.filter(u => {
    const myCompany = localStorage.getItem('userCompany');
    const uCompany  = typeof u.company === 'object' ? u.company?.name : u.company;
    return tab === 0 ? true : tab === 1 ? uCompany === myCompany : uCompany !== myCompany;
  });

  function getRoomName(room) {
    if (room.type === 'group') return room.name || 'مجموعة';
    const other = room.participants?.find(p => (p._id||p) !== myId);
    return other?.name || 'محادثة';
  }

  function getRoomAvatar(room) {
    if (room.type === 'group') return null;
    const other = room.participants?.find(p => (p._id||p) !== myId);
    return other?.avatar || null;
  }

  function isRoomOnline(room) {
    if (room.type === 'group') return false;
    const other = room.participants?.find(p => (p._id||p) !== myId);
    return other ? onlineUserIds.has(other._id || other) : false;
  }

  const onlineCount = users.filter(u => onlineUserIds.has(u._id)).length;

  return (
    <Layout>
      <Box sx={{ display:'flex', height:'calc(100vh - 64px)', bgcolor:'#f5f7fa' }}>

        {/* ── SIDEBAR ── */}
        <Box sx={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', bgcolor:'white', borderRight:'1px solid', borderColor:'divider' }}>

          {/* Sidebar header */}
          <Box sx={{ p:2, borderBottom:'1px solid', borderColor:'divider' }}>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
              <Typography variant="h6" fontWeight={700}>Wassel Chat</Typography>
              <Box sx={{ display:'flex', gap:0.5 }}>
                <Tooltip title={t('meet.participants')}>
                  <IconButton size="small" onClick={startMeeting} sx={{ color:'#1a73e8' }}>
                    <MeetingRoom sx={{ fontSize:20 }}/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('chat.newChat')}>
                  <IconButton size="small" onClick={()=>setNewChatOpen(true)} sx={{ bgcolor:'#1a73e8', color:'white', '&:hover':{ bgcolor:'#1557b0' } }}>
                    <Add sx={{ fontSize:18 }}/>
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
              <Box sx={{ width:8,height:8,borderRadius:'50%',bgcolor:'#34a853'}}/>
              <Typography variant="caption" color="text.secondary">{onlineCount} {t('chat.online')}</Typography>
            </Box>
            <TextField size="small" fullWidth placeholder={t('common.search')+'...'} value={search}
              onChange={e=>setSearch(e.target.value)}
              InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{fontSize:16,color:'text.secondary'}}/></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3,fontSize:'0.85rem' } }}/>
          </Box>

          {/* Room list */}
          <Box sx={{ flex:1, overflow:'auto' }}>
            {loading ? (
              <Box sx={{ display:'flex', justifyContent:'center', pt:4 }}><CircularProgress size={28}/></Box>
            ) : filteredRooms.length === 0 ? (
              <Box sx={{ p:3, textAlign:'center' }}>
                <Typography color="text.secondary" variant="body2">{t('chat.noChats')}</Typography>
                <Button size="small" startIcon={<Add/>} onClick={()=>setNewChatOpen(true)} sx={{ mt:1 }}>
                  {t('chat.newChat')}
                </Button>
              </Box>
            ) : (
              <List dense disablePadding>
                {filteredRooms.map(room => {
                  const isOnline   = isRoomOnline(room);
                  const roomName   = getRoomName(room);
                  const lastMsg    = room.lastMessage;
                  const isActive   = activeRoom?._id === room._id;
                  return (
                    <React.Fragment key={room._id}>
                      <ListItemButton
                        onClick={() => setActiveRoom(room)}
                        selected={isActive}
                        sx={{ px:2, py:1.2, '&.Mui-selected':{ bgcolor:'#e8f0fe','&:hover':{ bgcolor:'#d2e3fc' } } }}>
                        <ListItemAvatar>
                          <Box sx={{ position:'relative' }}>
                            <Avatar src={getRoomAvatar(room)} sx={{ width:40,height:40,bgcolor:'#1a73e8',fontSize:16 }}>
                              {room.type==='group'?<Groups sx={{fontSize:20}}/>:roomName[0]}
                            </Avatar>
                            <OnlineDot online={isOnline}/>
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={isActive?700:500} noWrap>{roomName}</Typography>}
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {lastMsg?.text || (isOnline ? t('chat.online') : t('chat.offline'))}
                            </Typography>
                          }
                        />
                        {isOnline && !isActive && <Box sx={{width:8,height:8,borderRadius:'50%',bgcolor:'#34a853',flexShrink:0}}/>}
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
            <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
              <Box sx={{ width:80,height:80,borderRadius:'50%',bgcolor:'#e8f0fe',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Groups sx={{ fontSize:40, color:'#1a73e8' }}/>
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.secondary">Wassel Chat</Typography>
              <Typography variant="body2" color="text.disabled">{t('chat.noChats')}</Typography>
              <Box sx={{ display:'flex', gap:1, mt:1 }}>
                <Button variant="contained" startIcon={<PersonAdd/>} onClick={()=>setNewChatOpen(true)}>
                  {t('chat.newChat')}
                </Button>
                <Button variant="outlined" startIcon={<MeetingRoom/>} onClick={startMeeting}>
                  {t('meet.join')}
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              {/* Chat header */}
              <Box sx={{ px:3, py:1.5, bgcolor:'white', borderBottom:'1px solid', borderColor:'divider', display:'flex', alignItems:'center', gap:2 }}>
                <Box sx={{ position:'relative' }}>
                  <Avatar src={getRoomAvatar(activeRoom)} sx={{ width:40,height:40,bgcolor:'#1a73e8',fontSize:16 }}>
                    {activeRoom.type==='group'?<Groups/>:getRoomName(activeRoom)[0]}
                  </Avatar>
                  <OnlineDot online={isRoomOnline(activeRoom)}/>
                </Box>
                <Box sx={{ flex:1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{getRoomName(activeRoom)}</Typography>
                  <Typography variant="caption" color={isRoomOnline(activeRoom)?'success.main':'text.secondary'}>
                    {typing ? `${typing} يكتب...` : isRoomOnline(activeRoom) ? t('chat.online') : t('chat.offline')}
                  </Typography>
                </Box>
                {/* Call buttons */}
                <Tooltip title={t('meet.mic')+' '+t('chat.voiceCall')}>
                  <IconButton onClick={()=>startCall('audio')} sx={{ color:'#34a853' }}>
                    <Phone/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('chat.videoCall')}>
                  <IconButton onClick={()=>startCall('video')} sx={{ color:'#1a73e8' }}>
                    <Videocam/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('chat.meeting')}>
                  <IconButton onClick={startMeeting} sx={{ color:'#9c27b0' }}>
                    <MeetingRoom/>
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Messages */}
              <Box sx={{ flex:1, overflow:'auto', p:2, display:'flex', flexDirection:'column' }}>
                {msgLoading ? (
                  <Box sx={{ display:'flex', justifyContent:'center', pt:4 }}><CircularProgress size={28}/></Box>
                ) : messages.map((msg, i) => (
                  <MessageBubble key={msg._id||i} msg={msg} myId={myId} onReply={setReplyTo}/>
                ))}
                {typing && (
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, ml:1 }}>
                    <Avatar sx={{ width:28,height:28,fontSize:12,bgcolor:'#e8f0fe',color:'#1a73e8' }}>{typing[0]}</Avatar>
                    <Box sx={{ px:2,py:1,borderRadius:'16px 16px 16px 4px',bgcolor:'white',boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }}>
                      <Box sx={{ display:'flex',gap:0.4 }}>
                        {[0,1,2].map(i=>(
                          <Box key={i} sx={{width:6,height:6,borderRadius:'50%',bgcolor:'#aaa',animation:'bounce 1.2s infinite',animationDelay:`${i*0.2}s`,'@keyframes bounce':{'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-4px)'}}}}/>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEnd}/>
              </Box>

              {/* Reply preview */}
              {replyTo && (
                <Box sx={{ mx:2,mb:0.5,p:1,bgcolor:'#e8f0fe',borderRadius:2,display:'flex',alignItems:'center',gap:1,borderRight:'3px solid #1a73e8' }}>
                  <Box sx={{ flex:1 }}>
                    <Typography variant="caption" color="primary" fontWeight={700}>{replyTo.sender?.name}</Typography>
                    <Typography variant="caption" display="block" noWrap color="text.secondary">{replyTo.text}</Typography>
                  </Box>
                  <IconButton size="small" onClick={()=>setReplyTo(null)}><Close sx={{fontSize:16}}/></IconButton>
                </Box>
              )}

              {/* Input */}
              <Box sx={{ p:2, bgcolor:'white', borderTop:'1px solid', borderColor:'divider', display:'flex', gap:1, alignItems:'flex-end' }}>
                <TextField
                  value={input} onChange={e=>handleTyping(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                  placeholder={t('chat.typeMessage')}
                  multiline maxRows={4} fullWidth size="small"
                  sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3,fontSize:'0.9rem',bgcolor:'#f5f7fa' } }}
                />
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
        <DialogTitle sx={{ pb:1, fontWeight:700 }}>
          <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {t('chat.newChat')}
            <IconButton size="small" onClick={()=>setNewChatOpen(false)}><Close sx={{fontSize:18}}/></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p:0 }}>
          {/* Search */}
          <Box sx={{ px:2, pb:1.5 }}>
            <TextField size="small" fullWidth placeholder={t('chat.searching')} value={userSearch}
              onChange={e=>setUserSearch(e.target.value)}
              InputProps={{ startAdornment:<InputAdornment position="start"><Search sx={{fontSize:16,color:'text.secondary'}}/></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root':{ borderRadius:3 } }}/>
          </Box>

          {/* Tabs: All / My Company / Other */}
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ px:2, borderBottom:'1px solid', borderColor:'divider' }}>
            <Tab label={t('chat.allUsers')} sx={{ fontSize:'0.75rem', minWidth:0, px:1.5 }}/>
            <Tab label="شركتي" sx={{ fontSize:'0.75rem', minWidth:0, px:1.5 }}/>
            <Tab label={t('chat.otherCompanies')} sx={{ fontSize:'0.75rem', minWidth:0, px:1.5 }}/>
          </Tabs>

          {/* Users list */}
          <List sx={{ maxHeight:360, overflow:'auto' }}>
            {otherUsers.length === 0 ? (
              <Box sx={{ p:3, textAlign:'center' }}>
                <Typography color="text.secondary" variant="body2">
                  {userSearch ? 'لا نتائج' : 'لا يوجد مستخدمون'}
                </Typography>
              </Box>
            ) : otherUsers.map(user => {
              const isOnline   = onlineUserIds.has(user._id);
              const userCompany = typeof user.company==='object' ? user.company?.name : user.company;
              return (
                <ListItemButton key={user._id} onClick={()=>startDirectChat(user._id)} sx={{ py:1.2, gap:0 }}>
                  <ListItemAvatar>
                    <Box sx={{ position:'relative' }}>
                      <Avatar src={user.avatar} sx={{ width:42,height:42,bgcolor:'#1a73e8',fontSize:16 }}>
                        {user.name?.[0]}
                      </Avatar>
                      <OnlineDot online={isOnline}/>
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{user.name}</Typography>}
                    secondary={
                      <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                        <Box sx={{ width:6,height:6,borderRadius:'50%',bgcolor:isOnline?'#34a853':'#bdbdbd'}}/>
                        <Typography variant="caption" sx={{ color:isOnline?'success.main':'text.secondary' }}>
                          {isOnline ? t('chat.online') : t('chat.offline')}
                        </Typography>
                        {userCompany && (
                          <Chip label={userCompany} size="small"
                            sx={{ fontSize:'0.6rem', height:16, ml:0.5 }}/>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>

      {/* ── MEET ROOM (Google Meet style) ── */}
      <MeetRoom open={meetOpen} onClose={()=>setMeetOpen(false)} roomName={meetRoom} mode={meetMode}/>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack('')} message={snack}/>
    </Layout>
  );
}
