import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Avatar, IconButton, Slide, Paper, Chip
} from '@mui/material';
import { Phone, PhoneDisabled, Videocam } from '@mui/icons-material';

const IncomingCallModal = ({ call, onAccept, onReject }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!call) return;
    const iv = setInterval(() => setSeconds(s => {
      if (s >= 29) { onReject(); return 0; }
      return s + 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [call]);

  if (!call) return null;

  const isVideo = call.mode === 'video';

  return (
    <Slide direction="down" in={!!call} mountOnEnter unmountOnExit>
      <Box sx={{
        position: 'fixed', top: 16, right: 16, zIndex: 9999,
        maxWidth: 340, width: '100%'
      }}>
        <Paper elevation={12} sx={{
          borderRadius: 4, overflow: 'hidden',
          background: 'linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          {/* Animated ring background */}
          <Box sx={{ position: 'relative', p: 3 }}>
            {[0,1,2].map(i => (
              <Box key={i} sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 80 + i * 30, height: 80 + i * 30,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                animation: `ripple 2s ease-out ${i * 0.5}s infinite`,
                '@keyframes ripple': {
                  '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 1 },
                  '100%': { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 0 }
                }
              }} />
            ))}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
              <Avatar src={call.callerAvatar} sx={{
                width: 56, height: 56, fontSize: 22,
                bgcolor: '#1a73e8',
                border: '3px solid rgba(255,255,255,0.3)',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%,100%': { boxShadow: '0 0 0 0 rgba(26,115,232,0.4)' },
                  '50%': { boxShadow: '0 0 0 8px rgba(26,115,232,0)' }
                }
              }}>
                {call.callerName?.[0]}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Chip
                  size="small"
                  icon={isVideo ? <Videocam sx={{ fontSize: '14px !important', color: 'white !important' }} /> : <Phone sx={{ fontSize: '14px !important', color: 'white !important' }} />}
                  label={isVideo ? 'مكالمة فيديو' : 'مكالمة صوتية'}
                  sx={{ bgcolor: isVideo ? '#1a73e8' : '#34a853', color: 'white', fontSize: '0.65rem', height: 20, mb: 0.5 }}
                />
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white', lineHeight: 1.2 }}>
                  {call.callerName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {call.callerCompany || 'جارٍ الاتصال...'}
                </Typography>
              </Box>

              {/* Countdown */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: 'white', lineHeight: 1 }}>
                  {30 - seconds}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>ث</Typography>
              </Box>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{
            display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <Box onClick={onReject} sx={{
              flex: 1, py: 2, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 0.5, cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(229,57,53,0.3)' }
            }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '50%', bgcolor: '#e53935',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(229,57,53,0.4)'
              }}>
                <PhoneDisabled sx={{ color: 'white', fontSize: 22 }} />
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>رفض</Typography>
            </Box>

            <Box sx={{ width: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />

            <Box onClick={onAccept} sx={{
              flex: 1, py: 2, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 0.5, cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(52,168,83,0.3)' }
            }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '50%',
                bgcolor: isVideo ? '#1a73e8' : '#34a853',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 12px rgba(${isVideo ? '26,115,232' : '52,168,83'},0.4)`,
                animation: 'bounce 1s ease-in-out infinite',
                '@keyframes bounce': {
                  '0%,100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-4px)' }
                }
              }}>
                {isVideo ? <Videocam sx={{ color: 'white', fontSize: 22 }} /> : <Phone sx={{ color: 'white', fontSize: 22 }} />}
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>قبول</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Slide>
  );
};

export default IncomingCallModal;
