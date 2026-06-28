const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIfHZv2JFnPGC4';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://wassel-y6htlkxc.livekit.cloud';

exports.getCallToken = async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({
        success: false,
        message: 'roomName and participantName are required'
      });
    }

    if (!LIVEKIT_API_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'LiveKit API Secret not configured. Add LIVEKIT_API_SECRET to environment variables.'
      });
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
      ttl: '2h'
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await at.toJwt();

    res.json({
      success: true,
      data: { token, url: LIVEKIT_URL, roomName, participantName }
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { roomName, callType = 'video' } = req.body;
    const room = `wassel-${callType}-${roomName || Date.now()}`;
    res.json({
      success: true,
      data: { roomName: room, url: LIVEKIT_URL, callType, createdBy: req.user.id, createdAt: new Date() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConfig = async (req, res) => {
  res.json({
    success: true,
    data: {
      url: LIVEKIT_URL,
      apiKey: LIVEKIT_API_KEY,
      secretConfigured: !!LIVEKIT_API_SECRET
    }
  });
};
