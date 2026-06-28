import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Grid, Typography, TextField, IconButton, Avatar, Badge,
  List, ListItem, ListItemAvatar, ListItemText, ListItemButton,
  AppBar, Toolbar, InputAdornment, Divider, Paper, Chip, Tooltip,
  Fade, Menu, MenuItem, ListItemIcon, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Snackbar
} from '@mui/material';
import {
  Send, AttachFile, Search, Videocam, Phone, MoreVert,
  ArrowBack, Add, Delete, Close, DoneAll, AccessTime,
  Reply, Forward, ContentCopy, People, PersonAdd, GroupAdd,
  PushPin, NotificationsOff, Block, Info, KeyboardVoice,
  EmojiEmotions, InsertDriveFile, Chat as ChatIcon, Mic,
  CheckCircle, RadioButtonUnchecked
} from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';
import VideoCall from '../../components/VideoCall';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ─── Helpers ─────────────────────────────────────────────────────────────
const getOtherParticipant = (room, myId) => {
  if (!room || room.type !== 'direct') return null;
  return room.participants?.find(p => p._id !== myId);
};

const getRoomName = (room, myId) => {
  if (!room) return '';
  if (room.type === 'group') return room.name || 'مجموعة';
  const other = getOtherParticipant(room, myId);
  return other?.name || 'محادثة';
};

const getRoomAvatar = (room, myId) => {
  if (!room || room.type === 'group') return null;
  return getOtherParticipant(room, myId)?.avatar || null;
};

const getRoomOnline = (room, myId) => {
  if (!room || room.type === 'group') return false;
  return getOtherParticipant(room, myId)?.isOnline || false;
};

// ─── Main Chat Page ───────────────────────────────────────────────────────
const ChatPage = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [msgMenu, setMsgMenu] = useState({ anchor: null, msg: null });
  const [optionsMenu, setOptionsMenu] = useState(null);
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [callRoomName, setCallRoomName] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { // eslint-disable-next-line react-hooks/exhaustive-deps scrollToBottom(); }, [messages]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Socket.io
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      const userId = localStorage.getItem('userId');
      if (userId) {
        setMyId(userId);
        socketRef.current.emit('user_online', userId);
      }
    });

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      // Update room last message
      setRooms(prev => prev.map(r =>
        r._id === message.room ? { ...r, lastMessage: message, lastActivity: new Date() } : r
      ));
    });

    socketRef.current.on('user_typing', ({ userId, userName, isTyping }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: isTyping ? userName : null }));
    });

    socketRef.current.on('user_status', ({ userId, isOnline }) => {
      setRooms(prev => prev.map(r => ({
        ...r,
        participants: r.participants?.map(p =>
          p._id === userId ? { ...p, isOnline } : p
        )
      })));
    });

    socketRef.current.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, text: 'تم حذف هذه الرسالة' } : m
      ));
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [roomsRes, usersRes, meRes] = await Promise.all([
        axios.get('/api/chat/rooms', { headers }),
        axios.get('/api/users', { headers }),
        axios.get('/api/auth/me', { headers })
      ]);

      if (roomsRes.data.success) setRooms(roomsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (meRes.data.success) {
        setMyId(meRes.data.data._id);
        localStorage.setItem('userId', meRes.data.data._id);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectRoom = async (room) => {
    setSelectedRoom(room);
    if (selectedRoom?._id) {
      socketRef.current?.emit('leave_room', selectedRoom._id);
    }
    socketRef.current?.emit('join_room', room._id);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/chat/rooms/${room._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setMessages(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`/api/chat/rooms/${selectedRoom._id}/messages`, {
        text: newMessage,
        replyTo: replyTo?._id
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setMessages(prev => [...prev, res.data.data]);
        setNewMessage('');
        setReplyTo(null);
        socketRef.current?.emit('typing_stop', { roomId: selectedRoom._id, userId: myId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!selectedRoom) return;
    socketRef.current?.emit('typing_start', {
      roomId: selectedRoom._id,
      userId: myId,
      userName: 'أنا'
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing_stop', { roomId: selectedRoom._id, userId: myId });
    }, 2000);
  };

  const startDirectChat = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/chat/rooms/direct', { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const room = res.data.data;
        setRooms(prev => {
          const exists = prev.find(r => r._id === room._id);
          return exists ? prev : [room, ...prev];
        });
        selectRoom(room);
        setNewChatOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/chat/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsgMenu({ anchor: null, msg: null });
    } catch (err) {
      console.error(err);
    }
  };

  const startCall = (type) => {
    if (!selectedRoom) return;
    const roomName = `${type}-${selectedRoom._id}-${Date.now()}`;
    setCallRoomName(roomName);
    if (type === 'video') setVideoCallOpen(true);
    else setVoiceCallOpen(true);
  };

  const filteredRooms = rooms.filter(r =>
    getRoomName(r, myId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typingText = Object.values(typingUsers).filter(Boolean).join(', ');

  // ── Sidebar ──
  const Sidebar = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#1a73e8' }}>
            وصّل Chat
          </Typography>
          <Tooltip title="محادثة جديدة">
            <IconButton size="small" onClick={() => setNewChatOpen(true)}
              sx={{ bgcolor: '#1a73e8', color: 'white', '&:hover': { bgcolor: '#1557b0' } }}>
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          fullWidth size="small" placeholder="بحث في المحادثات..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#9aa0a6', fontSize: 20 }} />,
            endAdornment: searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery('')}><Close fontSize="small" /></IconButton>
            ),
            sx: { borderRadius: 3, bgcolor: '#fff', fontSize: 14 }
          }}
        />
      </Box>

      {/* Room List */}
      {loading ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {filteredRooms.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <ChatIcon sx={{ fontSize: 40, color: '#dadce0', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">لا توجد محادثات</Typography>
            </Box>
          )}
          {filteredRooms.map(room => {
            const name = getRoomName(room, myId);
            const avatar = getRoomAvatar(room, myId);
            const online = getRoomOnline(room, myId);
            const isSelected = selectedRoom?._id === room._id;

            return (
              <ListItemButton
                key={room._id}
                selected={isSelected}
                onClick={() => selectRoom(room)}
                sx={{
                  py: 1.5, px: 2,
                  bgcolor: isSelected ? '#e8f0fe' : 'transparent',
                  borderLeft: isSelected ? '3px solid #1a73e8' : '3px solid transparent',
                  '&:hover': { bgcolor: isSelected ? '#e8f0fe' : '#f8f9fa' }
                }}
              >
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    sx={{ '& .MuiBadge-dot': { bgcolor: online ? '#34a853' : '#dadce0', width: 10, height: 10, border: '2px solid white' } }}
                  >
                    <Avatar src={avatar} sx={{ width: 44, height: 44, bgcolor: '#1a73e8', fontSize: 18 }}>
                      {name?.[0]}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                        {name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        {room.lastActivity ? new Date(room.lastActivity).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: 12, maxWidth: 160 }}>
                      {room.lastMessage?.text || 'لا توجد رسائل'}
                    </Typography>
                  }
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Box>
  );

  // ── Chat Area ──
  const ChatArea = selectedRoom ? (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar variant="dense" sx={{ minHeight: 64 }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setSelectedRoom(null)} sx={{ mr: 1, color: 'text.primary' }}>
              <ArrowBack />
            </IconButton>
          )}
          <Badge
            overlap="circular" variant="dot"
            sx={{ '& .MuiBadge-dot': { bgcolor: getRoomOnline(selectedRoom, myId) ? '#34a853' : '#dadce0', width: 10, height: 10, border: '2px solid white', bottom: 2, right: 2 } }}
          >
            <Avatar src={getRoomAvatar(selectedRoom, myId)} sx={{ width: 40, height: 40, bgcolor: '#1a73e8' }}>
              {getRoomName(selectedRoom, myId)?.[0]}
            </Avatar>
          </Badge>

          <Box sx={{ ml: 1.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
              {getRoomName(selectedRoom, myId)}
            </Typography>
            <Typography variant="caption" sx={{ color: getRoomOnline(selectedRoom, myId) ? '#34a853' : 'text.secondary' }}>
              {typingText
                ? `${typingText} يكتب...`
                : getRoomOnline(selectedRoom, myId) ? 'متصل الآن' : 'غير متصل'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="مكالمة صوتية">
              <IconButton onClick={() => startCall('voice')} sx={{ color: '#34a853' }}>
                <Phone />
              </IconButton>
            </Tooltip>
            <Tooltip title="مكالمة فيديو">
              <IconButton onClick={() => startCall('video')} sx={{ color: '#1a73e8' }}>
                <Videocam />
              </IconButton>
            </Tooltip>
            <IconButton onClick={e => setOptionsMenu(e.currentTarget)} sx={{ color: 'text.secondary' }}>
              <MoreVert />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{
        flex: 1, overflow: 'auto', p: 2,
        bgcolor: '#f8f9fa',
        backgroundImage: 'radial-gradient(circle at 1px 1px, #e8eaed 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}>
        {messages.map((msg, idx) => {
          const isMe = msg.sender?._id === myId || msg.sender === myId;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id);

          return (
            <Fade key={msg._id || idx} in>
              <Box sx={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                mb: 0.5,
                alignItems: 'flex-end',
                gap: 1
              }}>
                {/* Avatar for others */}
                {!isMe && (
                  <Box sx={{ width: 32 }}>
                    {showAvatar && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a73e8', fontSize: 13 }}>
                        {msg.sender?.name?.[0] || '?'}
                      </Avatar>
                    )}
                  </Box>
                )}

                <Box sx={{ maxWidth: '70%' }}>
                  {/* Sender name */}
                  {!isMe && showAvatar && (
                    <Typography variant="caption" sx={{ color: '#1a73e8', fontWeight: 600, ml: 1.5, mb: 0.3, display: 'block' }}>
                      {msg.sender?.name}
                    </Typography>
                  )}

                  {/* Reply preview */}
                  {msg.replyTo && (
                    <Box sx={{
                      ml: isMe ? 0 : 1.5, mr: isMe ? 1.5 : 0,
                      mb: 0.3, px: 1.5, py: 0.5,
                      bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2,
                      borderLeft: '3px solid #1a73e8'
                    }}>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {msg.replyTo?.text}
                      </Typography>
                    </Box>
                  )}

                  {/* Message bubble */}
                  <Paper
                    elevation={0}
                    onClick={e => !msg.isDeleted && setMsgMenu({ anchor: e.currentTarget, msg })}
                    sx={{
                      px: 2, py: 1, borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      bgcolor: isMe ? '#1a73e8' : '#fff',
                      color: isMe ? 'white' : 'text.primary',
                      cursor: msg.isDeleted ? 'default' : 'pointer',
                      opacity: msg.isDeleted ? 0.6 : 1,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      '&:hover': { filter: msg.isDeleted ? 'none' : 'brightness(0.95)' }
                    }}
                  >
                    <Typography variant="body2" sx={{
                      fontStyle: msg.isDeleted ? 'italic' : 'normal',
                      fontSize: 14, lineHeight: 1.4
                    }}>
                      {msg.text}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.3 }}>
                      <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 11 }}>
                        {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      {isMe && (
                        msg.readBy?.length > 1
                          ? <DoneAll sx={{ fontSize: 13, color: '#a8d5a2' }} />
                          : <DoneAll sx={{ fontSize: 13, opacity: 0.6 }} />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </Fade>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Preview */}
      {replyTo && (
        <Box sx={{ px: 2, py: 1, bgcolor: '#e8f0fe', display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid #c2d3f0' }}>
          <Reply sx={{ color: '#1a73e8', fontSize: 18 }} />
          <Typography variant="body2" noWrap sx={{ flex: 1, color: '#1a73e8', fontSize: 13 }}>
            رد على: {replyTo.text}
          </Typography>
          <IconButton size="small" onClick={() => setReplyTo(null)}><Close fontSize="small" /></IconButton>
        </Box>
      )}

      {/* Input */}
      <Box sx={{
        p: 1.5, bgcolor: '#fff', borderTop: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'flex-end', gap: 1
      }}>
        <Tooltip title="إرفاق ملف">
          <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ color: '#9aa0a6', mb: 0.5 }}>
            <AttachFile />
          </IconButton>
        </Tooltip>
        <input type="file" ref={fileInputRef} hidden multiple />

        <TextField
          fullWidth multiline maxRows={4}
          placeholder="اكتب رسالة..."
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 4, bgcolor: '#f8f9fa', fontSize: 14,
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: '#1a73e8' },
              '&.Mui-focused fieldset': { borderColor: '#1a73e8' }
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" sx={{ color: '#9aa0a6' }}>
                  <EmojiEmotions fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <IconButton
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          sx={{
            bgcolor: newMessage.trim() ? '#1a73e8' : '#dadce0',
            color: newMessage.trim() ? 'white' : '#9aa0a6',
            mb: 0.5, width: 40, height: 40,
            '&:hover': { bgcolor: newMessage.trim() ? '#1557b0' : '#dadce0' },
            '&:disabled': { bgcolor: '#dadce0', color: '#9aa0a6' }
          }}
        >
          <Send fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  ) : (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa' }}>
      <Box sx={{ textAlign: 'center', maxWidth: 320 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: '50%', bgcolor: '#e8f0fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2
        }}>
          <ChatIcon sx={{ fontSize: 40, color: '#1a73e8' }} />
        </Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>ابدأ محادثة</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          اختر محادثة من القائمة أو ابدأ محادثة جديدة
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setNewChatOpen(true)}
          sx={{ borderRadius: 3, textTransform: 'none', bgcolor: '#1a73e8', '&:hover': { bgcolor: '#1557b0' } }}
        >
          محادثة جديدة
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      {(!isMobile || !selectedRoom) && (
        <Box sx={{ width: isMobile ? '100%' : 320, flexShrink: 0, borderRight: '1px solid #e0e0e0', height: '100%' }}>
          {Sidebar}
        </Box>
      )}

      {/* Chat */}
      {(!isMobile || selectedRoom) && (
        <Box sx={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          {ChatArea}
        </Box>
      )}

      {/* ── Dialogs & Menus ── */}

      {/* New Chat Dialog */}
      <Dialog open={newChatOpen} onClose={() => setNewChatOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>محادثة جديدة</DialogTitle>
        <DialogContent>
          <List>
            {users.filter(u => u._id !== myId).map(user => (
              <ListItemButton key={user._id} onClick={() => startDirectChat(user._id)} sx={{ borderRadius: 2 }}>
                <ListItemAvatar>
                  <Badge variant="dot" overlap="circular"
                    sx={{ '& .MuiBadge-dot': { bgcolor: user.isOnline ? '#34a853' : '#dadce0', width: 10, height: 10 } }}>
                    <Avatar src={user.avatar} sx={{ bgcolor: '#1a73e8' }}>{user.name?.[0]}</Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.isOnline ? 'متصل' : 'غير متصل'}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* Message Context Menu */}
      <Menu anchorEl={msgMenu.anchor} open={Boolean(msgMenu.anchor)} onClose={() => setMsgMenu({ anchor: null, msg: null })}>
        <MenuItem onClick={() => { setReplyTo(msgMenu.msg); setMsgMenu({ anchor: null, msg: null }); }}>
          <ListItemIcon><Reply fontSize="small" /></ListItemIcon>رد
        </MenuItem>
        <MenuItem onClick={() => { navigator.clipboard.writeText(msgMenu.msg?.text || ''); setMsgMenu({ anchor: null, msg: null }); setSnackbar({ open: true, message: 'تم النسخ' }); }}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>نسخ
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => deleteMessage(msgMenu.msg?._id)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>حذف
        </MenuItem>
      </Menu>

      {/* Room Options Menu */}
      <Menu anchorEl={optionsMenu} open={Boolean(optionsMenu)} onClose={() => setOptionsMenu(null)}>
        <MenuItem onClick={() => setOptionsMenu(null)}><ListItemIcon><PushPin fontSize="small" /></ListItemIcon>تثبيت</MenuItem>
        <MenuItem onClick={() => setOptionsMenu(null)}><ListItemIcon><NotificationsOff fontSize="small" /></ListItemIcon>كتم الإشعارات</MenuItem>
        <Divider />
        <MenuItem onClick={() => setOptionsMenu(null)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>حذف المحادثة
        </MenuItem>
      </Menu>

      {/* Video Call */}
      <VideoCall
        open={videoCallOpen}
        onClose={() => setVideoCallOpen(false)}
        roomName={callRoomName}
        participantName={localStorage.getItem('userName') || 'مستخدم'}
        callType="video"
      />

      {/* Voice Call */}
      <VideoCall
        open={voiceCallOpen}
        onClose={() => setVoiceCallOpen(false)}
        roomName={callRoomName}
        participantName={localStorage.getItem('userName') || 'مستخدم'}
        callType="audio"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ChatPage;
