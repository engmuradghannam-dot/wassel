import React, { useState, useEffect, useCallback } from 'react';
import {
  LivekitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useRoomContext
} from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography,
  IconButton, Button, CircularProgress, Alert, Snackbar,
  Avatar, Chip, Fade, Paper
} from '@mui/material';
import {
  Close, Mic, MicOff, Videocam, VideocamOff,
  CallEnd, ScreenShare, StopScreenShare, VolumeUp, VolumeOff,
  Chat, People, Settings, Fullscreen, FullscreenExit
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const VideoCall = ({ open, onClose, roomName, participantName, callType = 'video' }) => {
  const { t } = useTranslation();
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get token from server
  useEffect(() => {
    if (open && roomName && participantName) {
      fetchToken();
    }
  }, [open, roomName, participantName]);

  const fetchToken = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/calls/token', {
        roomName,
        participantName
      });

      if (res.data.success) {
        setToken(res.data.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('call.tokenError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle room connection
  const handleConnected = useCallback((room) => {
    setRoom(room);
    setIsConnected(true);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setRoom(null);
    onClose();
  }, [onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Server connection options
  const serverUrl = process.env.REACT_APP_LIVEKIT_URL || 'wss://wassel-y6htlkxc.livekit.cloud';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: '#1a1a2e',
          color: 'white',
          m: 0,
          maxHeight: '100vh',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            {callType === 'video' ? t('call.videoCall') : t('call.voiceCall')}
          </Typography>
          <Chip
            size="small"
            label={isConnected ? t('call.connected') : t('call.connecting')}
            color={isConnected ? 'success' : 'warning'}
          />
          <Typography variant="caption" color="grey.400">
            {roomName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
          <IconButton onClick={() => setShowParticipants(!showParticipants)} sx={{ color: 'white' }}>
            <People />
          </IconButton>
          <IconButton onClick={() => setShowChat(!showChat)} sx={{ color: 'white' }}>
            <Chat />
          </IconButton>
          <IconButton onClick={onClose} sx={{ color: 'error.main', bgcolor: 'error.dark' }}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <DialogContent sx={{ p: 0, display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

        {/* Loading */}
        {loading && (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
            <CircularProgress size={60} color="primary" />
            <Typography variant="h6">{t('call.connecting')}</Typography>
            <Typography variant="body2" color="grey.400">
              {t('call.pleaseWait')}
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 4
          }}>
            <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={fetchToken}>
              {t('call.retry')}
            </Button>
          </Box>
        )}

        {/* LiveKit Room */}
        {token && !loading && !error && (
          <Box sx={{ flex: 1, display: 'flex' }}>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <LivekitRoom
                serverUrl={serverUrl}
                token={token}
                connect={true}
                onConnected={handleConnected}
                onDisconnected={handleDisconnected}
                audio={callType === 'video' || callType === 'audio'}
                video={callType === 'video'}
                data-lk-theme="default"
                style={{ height: '100%', width: '100%' }}
              >
                <VideoConference />
                <RoomAudioRenderer />
                <CustomControlBar />
              </LivekitRoom>
            </Box>

            {/* Side Panel */}
            {(showChat || showParticipants) && (
              <Paper sx={{
                width: 300,
                bgcolor: '#16213e',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {showParticipants && (
                  <Box sx={{ p: 2, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {t('call.participants')}
                    </Typography>
                    <ParticipantsList />
                  </Box>
                )}

                {showChat && (
                  <Box sx={{ p: 2, flex: 1, borderTop: showParticipants ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {t('call.chat')}
                    </Typography>
                    <CallChat />
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Custom Control Bar
const CustomControlBar = () => {
  const { t } = useTranslation();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleMute = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleScreenShare = async () => {
    if (localParticipant) {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const endCall = () => {
    if (room) {
      room.disconnect();
    }
  };

  return (
    <Box sx={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 2,
      p: 2,
      borderRadius: 4,
      bgcolor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(10px)'
    }}>
      <IconButton
        onClick={toggleMute}
        sx={{
          bgcolor: isMuted ? 'error.main' : 'rgba(255,255,255,0.2)',
          color: 'white',
          '&:hover': { bgcolor: isMuted ? 'error.dark' : 'rgba(255,255,255,0.3)' }
        }}
      >
        {isMuted ? <MicOff /> : <Mic />}
      </IconButton>

      <IconButton
        onClick={toggleCamera}
        sx={{
          bgcolor: isCameraOff ? 'error.main' : 'rgba(255,255,255,0.2)',
          color: 'white',
          '&:hover': { bgcolor: isCameraOff ? 'error.dark' : 'rgba(255,255,255,0.3)' }
        }}
      >
        {isCameraOff ? <VideocamOff /> : <Videocam />}
      </IconButton>

      <IconButton
        onClick={toggleScreenShare}
        sx={{
          bgcolor: isScreenSharing ? 'primary.main' : 'rgba(255,255,255,0.2)',
          color: 'white',
          '&:hover': { bgcolor: isScreenSharing ? 'primary.dark' : 'rgba(255,255,255,0.3)' }
        }}
      >
        {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
      </IconButton>

      <IconButton
        onClick={endCall}
        sx={{
          bgcolor: 'error.main',
          color: 'white',
          '&:hover': { bgcolor: 'error.dark' }
        }}
      >
        <CallEnd />
      </IconButton>
    </Box>
  );
};

// Participants List
const ParticipantsList = () => {
  const { t } = useTranslation();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  return (
    <Box>
      {tracks.map((track) => (
        <Box key={track.participant.identity} sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
        }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {track.participant.identity[0]}
          </Avatar>
          <Typography variant="body2">
            {track.participant.identity}
          </Typography>
          {track.participant.isSpeaking && (
            <Chip size="small" label={t('call.speaking')} color="success" />
          )}
        </Box>
      ))}
    </Box>
  );
};

// Call Chat
const CallChat = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: newMessage,
        sender: 'me',
        time: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        {messages.map(msg => (
          <Box key={msg.id} sx={{
            p: 1,
            mb: 1,
            borderRadius: 1,
            bgcolor: msg.sender === 'me' ? 'primary.main' : 'rgba(255,255,255,0.1)',
            alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
            maxWidth: '80%'
          }}>
            <Typography variant="body2">{msg.text}</Typography>
            <Typography variant="caption" color="grey.400">{msg.time}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('call.typeMessage')}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'white'
            }
          }}
        />
        <Button variant="contained" onClick={sendMessage}>
          {t('call.send')}
        </Button>
      </Box>
    </Box>
  );
};

export default VideoCall;
