import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveKitRoom, VideoConference, GridLayout, ParticipantTile,
  RoomAudioRenderer, useTracks, useLocalParticipant,
  useRoomContext, useParticipants, ControlBar
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState } from 'livekit-client';
import {
  Box, Typography, Button, Avatar, Chip, IconButton,
  CircularProgress, Tooltip, Paper, Badge, AvatarGroup,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import {
  Mic, MicOff, Videocam, VideocamOff, ScreenShare, StopScreenShare,
  CallEnd, Chat, PeopleAlt, FiberManualRecord,
  ContentCopy, OpenInNew, Refresh
} from '@mui/icons-material';
import api from '../services/api';

// ─── Pre-join Screen ──────────────────────────────────────────────────────
const PreJoin = ({ roomName, displayName, onJoin, onClose }) => {
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (camOn) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
        .catch(() => setCamOn(false));
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [camOn]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>{roomName}</Typography>

      {/* Camera preview */}
      <Box sx={{ position: 'relative', width: 360, height: 270, bgcolor: '#1a1a2e', borderRadius: 3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {camOn ? (
          <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        ) : (
          <Avatar sx={{ width: 80, height: 80, fontSize: 36, bgcolor: '#1a73e8' }}>{displayName?.[0]}</Avatar>
        )}
        <Box sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 1 }}>
          <IconButton onClick={() => setMicOn(v => !v)} sx={{ bgcolor: micOn ? 'rgba(255,255,255,0.2)' : '#e53935', color: 'white', '&:hover': { bgcolor: micOn ? 'rgba(255,255,255,0.3)' : '#c62828' } }}>
            {micOn ? <Mic /> : <MicOff />}
          </IconButton>
          <IconButton onClick={() => setCamOn(v => !v)} sx={{ bgcolor: camOn ? 'rgba(255,255,255,0.2)' : '#e53935', color: 'white', '&:hover': { bgcolor: camOn ? 'rgba(255,255,255,0.3)' : '#c62828' } }}>
            {camOn ? <Videocam /> : <VideocamOff />}
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary">
        ستنضم باسم: <strong>{displayName}</strong>
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={onClose} size="large">إلغاء</Button>
        <Button variant="contained" onClick={() => onJoin({ camOn, micOn })} size="large" sx={{ px: 4 }}>
          انضم الآن
        </Button>
      </Box>
    </Box>
  );
};

// ─── Main MeetRoom Component ──────────────────────────────────────────────
const MeetRoom = ({ roomName, open, onClose, mode = 'video' }) => {
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [joinOptions, setJoinOptions] = useState(null);
  const [recording, setRecording] = useState(false);

  const displayName = localStorage.getItem('userName') || 'مستخدم';

  const fetchToken = useCallback(async () => {
    if (!roomName) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/calls/token', {
        roomName,
        participantName: `${displayName}-${Date.now()}`
      });
      if (res.data.success) {
        setToken(res.data.data.token);
        setServerUrl(res.data.data.url);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [roomName, displayName]);

  useEffect(() => {
    if (open && roomName) fetchToken();
  }, [open, roomName, fetchToken]);

  const handleJoin = (opts) => {
    setJoinOptions(opts);
    setJoined(true);
  };

  const handleDisconnect = () => {
    setJoined(false);
    setToken('');
    onClose();
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${roomName}`);
  };

  if (!open) return null;

  return (
    <Box sx={{
      position: 'fixed', inset: 0, zIndex: 1400,
      bgcolor: '#0d1117', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 1.5, bgcolor: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 32, height: 32, bgcolor: '#1a73e8', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>و</Box>
          <Typography variant="subtitle1" color="white" fontWeight={600}>وصّل Meet</Typography>
          <Chip label={roomName} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'monospace', fontSize: 12 }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {recording && <Chip icon={<FiberManualRecord sx={{ color: '#f44336 !important', animation: 'pulse 1s infinite' }} />} label="تسجيل" size="small" sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: '#ef9a9a' }} />}
          <Tooltip title="نسخ رابط الاجتماع">
            <IconButton onClick={copyRoomLink} sx={{ color: 'rgba(255,255,255,0.7)' }} size="small"><ContentCopy fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="إعادة الاتصال">
            <IconButton onClick={fetchToken} sx={{ color: 'rgba(255,255,255,0.7)' }} size="small"><Refresh fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <CircularProgress sx={{ color: '#1a73e8' }} size={48} />
            <Typography color="rgba(255,255,255,0.7)">جارٍ الاتصال...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography color="#ef9a9a" variant="h6">{error}</Typography>
            <Button onClick={fetchToken} variant="contained" startIcon={<Refresh />}>إعادة المحاولة</Button>
            <Button onClick={onClose} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>خروج</Button>
          </Box>
        )}

        {!loading && !error && !joined && token && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden', maxWidth: 480, width: '100%', bgcolor: '#161b22' }}>
              <PreJoin roomName={roomName} displayName={displayName} onJoin={handleJoin} onClose={onClose} />
            </Paper>
          </Box>
        )}

        {joined && token && serverUrl && (
          <LiveKitRoom
            video={joinOptions?.camOn ?? true}
            audio={joinOptions?.micOn ?? true}
            token={token}
            serverUrl={serverUrl}
            data-lk-theme="default"
            style={{ height: '100%', background: '#0d1117' }}
            onDisconnected={handleDisconnect}
          >
            <RoomAudioRenderer />
            <VideoConference />
          </LiveKitRoom>
        )}
      </Box>

      {/* CSS for recording pulse */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </Box>
  );
};

export default MeetRoom;
