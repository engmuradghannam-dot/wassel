import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
  VideoConference,
  FocusLayout,
  CarouselLayout,
  useConnectionState,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState } from 'livekit-client';
import {
  Box, Typography, IconButton, Avatar, Chip, Tooltip,
  Badge, Fade, CircularProgress, Alert, Button, Dialog,
  Drawer, List, ListItem, ListItemAvatar, ListItemText,
  TextField, Divider, Paper, Snackbar
} from '@mui/material';
import {
  Mic, MicOff, Videocam, VideocamOff, CallEnd,
  ScreenShare, StopScreenShare, People, Chat as ChatIcon,
  ContentCopy, Fullscreen, FullscreenExit, Settings,
  Close, Send, FiberManualRecord, GridView, ViewSidebar,
  PresentToAll, ClosedCaption, EmojiEmotions, PanTool,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';

const LIVEKIT_URL = process.env.REACT_APP_LIVEKIT_URL || 'wss://wassel-y6htlkxc.livekit.cloud';

// ─── Main VideoCall Component ───────────────────────────────────────────
const VideoCall = ({ open, onClose, roomName, participantName, callType = 'video' }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && roomName && participantName) {
      fetchToken();
    } else {
      setToken(null);
      setError(null);
    }
  }, [open, roomName, participantName]);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/calls/token', { roomName, participantName });
      if (res.data.success) setToken(res.data.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      bgcolor: '#202124', zIndex: 9999, display: 'flex', flexDirection: 'column'
    }}>
      {loading && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <Box sx={{
            width: 120, height: 120, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } }
          }}>
            <Videocam sx={{ fontSize: 48, color: '#8ab4f8' }} />
          </Box>
          <Typography variant="h6" color="white">جاري الاتصال...</Typography>
          <CircularProgress sx={{ color: '#8ab4f8' }} />
        </Box>
      )}

      {error && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Alert severity="error" sx={{ maxWidth: 400 }}>{error}</Alert>
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchToken}>إعادة المحاولة</Button>
          <Button variant="text" sx={{ color: 'grey.400' }} onClick={onClose}>إغلاق</Button>
        </Box>
      )}

      {token && !loading && (
        <LiveKitRoom
          serverUrl={LIVEKIT_URL}
          token={token}
          connect={true}
          audio={true}
          video={callType === 'video'}
          data-lk-theme="default"
          style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
          onDisconnected={onClose}
        >
          <MeetRoom
            onClose={onClose}
            roomName={roomName}
            callType={callType}
          />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}
    </Box>
  );
};

// ─── Google Meet Style Room ──────────────────────────────────────────────
const MeetRoom = ({ onClose, roomName, callType }) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState('grid'); // 'grid' | 'spotlight'
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, msg: '' });
  const [time, setTime] = useState(0);

  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const participants = useParticipants();
  const connectionState = useConnectionState();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Meeting timer
  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`وصّل - غرفة: ${roomName}`);
    setSnackbar({ open: true, msg: 'تم نسخ معرّف الغرفة' });
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: localParticipant?.identity || 'أنا',
      text: chatInput,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isConnected = connectionState === ConnectionState.Connected;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#202124' }}>

      {/* ── Top Bar ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 1.5, bgcolor: '#202124', borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Left: title + time */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiberManualRecord sx={{ fontSize: 10, color: '#ea4335', animation: 'blink 1s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
            <Typography variant="body2" sx={{ color: '#e8eaed', fontWeight: 500 }}>
              {formatTime(time)}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={isConnected ? 'متصل' : 'جاري الاتصال...'}
            sx={{
              bgcolor: isConnected ? 'rgba(52,168,83,0.2)' : 'rgba(251,188,4,0.2)',
              color: isConnected ? '#34a853' : '#fbbc04',
              border: `1px solid ${isConnected ? '#34a853' : '#fbbc04'}`
            }}
          />
        </Box>

        {/* Center: room name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={copyRoomLink}>
          <Typography variant="body1" sx={{ color: '#e8eaed', fontWeight: 600 }}>
            {roomName}
          </Typography>
          <Tooltip title="نسخ معرّف الغرفة">
            <ContentCopy sx={{ fontSize: 16, color: '#9aa0a6' }} />
          </Tooltip>
        </Box>

        {/* Right: layout + fullscreen */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="تغيير التخطيط">
            <IconButton
              onClick={() => setLayout(l => l === 'grid' ? 'spotlight' : 'grid')}
              sx={{ color: '#e8eaed' }}
            >
              {layout === 'grid' ? <ViewSidebar /> : <GridView />}
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'خروج من الشاشة الكاملة' : 'شاشة كاملة'}>
            <IconButton onClick={toggleFullscreen} sx={{ color: '#e8eaed' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Video Area ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Grid */}
        <Box sx={{ flex: 1, position: 'relative', p: 1 }}>
          {layout === 'grid' ? (
            <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
              <ParticipantTile />
            </GridLayout>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CarouselLayout tracks={tracks}>
                <ParticipantTile />
              </CarouselLayout>
              <FocusLayout track={tracks[0]} />
            </div>
          )}
        </Box>

        {/* ── Side Panel (Chat / Participants) ── */}
        {(showChat || showParticipants) && (
          <Box sx={{
            width: 320, bgcolor: '#292a2d', borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Panel header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle1" sx={{ color: '#e8eaed', fontWeight: 600 }}>
                {showChat ? 'دردشة المكالمة' : `المشاركون (${participants.length})`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => { setShowChat(true); setShowParticipants(false); }}
                  sx={{ color: showChat ? '#8ab4f8' : '#9aa0a6' }}>
                  <ChatIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { setShowParticipants(true); setShowChat(false); }}
                  sx={{ color: showParticipants ? '#8ab4f8' : '#9aa0a6' }}>
                  <People fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => { setShowChat(false); setShowParticipants(false); }}
                  sx={{ color: '#9aa0a6' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Participants */}
            {showParticipants && (
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {participants.map(p => (
                  <ListItem key={p.identity}>
                    <ListItemAvatar>
                      <Badge
                        variant="dot"
                        color="success"
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar sx={{ bgcolor: '#1a73e8', width: 36, height: 36 }}>
                          {p.identity?.[0]?.toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography sx={{ color: '#e8eaed', fontSize: 14 }}>{p.identity}</Typography>}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {p.isSpeaking && <Chip size="small" label="يتكلم" sx={{ bgcolor: 'rgba(52,168,83,0.2)', color: '#34a853', height: 16, fontSize: 10 }} />}
                          {p.isCameraEnabled === false && <Chip size="small" label="كاميرا مغلقة" sx={{ bgcolor: 'rgba(234,67,53,0.2)', color: '#ea4335', height: 16, fontSize: 10 }} />}
                          {p.isMicrophoneEnabled === false && <Chip size="small" label="مكتوم" sx={{ bgcolor: 'rgba(234,67,53,0.2)', color: '#ea4335', height: 16, fontSize: 10 }} />}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {/* Chat */}
            {showChat && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {chatMessages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                      <ChatIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.2)', mb: 1 }} />
                      <Typography sx={{ color: '#9aa0a6', fontSize: 13 }}>
                        لا توجد رسائل بعد
                      </Typography>
                    </Box>
                  )}
                  {chatMessages.map(msg => (
                    <Box key={msg.id}>
                      <Typography sx={{ color: '#8ab4f8', fontSize: 12, fontWeight: 600 }}>
                        {msg.sender} · {msg.time}
                      </Typography>
                      <Typography sx={{ color: '#e8eaed', fontSize: 13, mt: 0.3 }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth size="small"
                    placeholder="أرسل رسالة..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.08)', color: '#e8eaed', borderRadius: 3,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      },
                      '& input::placeholder': { color: '#9aa0a6' }
                    }}
                  />
                  <IconButton onClick={sendChatMessage} sx={{ color: chatInput ? '#8ab4f8' : '#5f6368' }}>
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── Bottom Control Bar (Google Meet style) ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, bgcolor: '#202124', borderTop: '1px solid rgba(255,255,255,0.1)',
        minHeight: 80
      }}>
        {/* Left: time */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ color: '#9aa0a6', fontSize: 13 }}>
            {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>

        {/* Center: main controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MeetControlButton
            icon={localParticipant?.isMicrophoneEnabled !== false ? <Mic /> : <MicOff />}
            activeColor={localParticipant?.isMicrophoneEnabled !== false ? undefined : '#ea4335'}
            tooltip={localParticipant?.isMicrophoneEnabled !== false ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}
            onClick={() => localParticipant?.setMicrophoneEnabled(localParticipant?.isMicrophoneEnabled === false)}
          />
          <MeetControlButton
            icon={localParticipant?.isCameraEnabled !== false ? <Videocam /> : <VideocamOff />}
            activeColor={localParticipant?.isCameraEnabled !== false ? undefined : '#ea4335'}
            tooltip={localParticipant?.isCameraEnabled !== false ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
            onClick={() => localParticipant?.setCameraEnabled(localParticipant?.isCameraEnabled === false)}
          />
          <MeetControlButton
            icon={<ScreenShare />}
            tooltip="مشاركة الشاشة"
            onClick={() => localParticipant?.setScreenShareEnabled(!localParticipant?.isScreenShareEnabled)}
          />

          {/* End Call */}
          <Tooltip title="إنهاء المكالمة">
            <IconButton
              onClick={() => { room?.disconnect(); onClose(); }}
              sx={{
                bgcolor: '#ea4335', color: 'white', width: 56, height: 56, borderRadius: 4,
                mx: 1,
                '&:hover': { bgcolor: '#c5221f' }
              }}
            >
              <CallEnd />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right: chat + participants */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <MeetControlButton
            icon={
              <Badge badgeContent={chatMessages.length || 0} color="error" max={9}>
                <ChatIcon />
              </Badge>
            }
            tooltip="الدردشة"
            active={showChat}
            onClick={() => { setShowChat(v => !v); setShowParticipants(false); }}
          />
          <MeetControlButton
            icon={
              <Badge badgeContent={participants.length} color="primary" max={99}>
                <People />
              </Badge>
            }
            tooltip="المشاركون"
            active={showParticipants}
            onClick={() => { setShowParticipants(v => !v); setShowChat(false); }}
          />
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ open: false, msg: '' })}
        message={snackbar.msg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

// ─── Reusable Control Button ─────────────────────────────────────────────
const MeetControlButton = ({ icon, tooltip, onClick, active, activeColor }) => (
  <Tooltip title={tooltip}>
    <IconButton
      onClick={onClick}
      sx={{
        width: 48, height: 48, borderRadius: 3,
        bgcolor: active ? 'rgba(138,180,248,0.15)' : activeColor ? `${activeColor}22` : 'rgba(255,255,255,0.1)',
        color: active ? '#8ab4f8' : activeColor || '#e8eaed',
        border: active ? '1px solid rgba(138,180,248,0.4)' : '1px solid transparent',
        transition: 'all 0.2s',
        '&:hover': { bgcolor: active ? 'rgba(138,180,248,0.25)' : 'rgba(255,255,255,0.2)' }
      }}
    >
      {icon}
    </IconButton>
  </Tooltip>
);

export default VideoCall;
