const { AccessToken } = require('livekit-server-sdk');

// LiveKit Configuration
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIfHZv2JFnPGC4';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://wassel-y6htlkxc.livekit.cloud';

// @desc    Generate LiveKit token for video/voice call
// @route   POST /api/calls/token
// @access  Private
exports.getCallToken = async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room name and participant name are required' 
      });
    }

    // Create access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: participantName,
    });

    // Grant permissions
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
      data: {
        token,
        url: LIVEKIT_URL,
        roomName,
        participantName
      }
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new call room
// @route   POST /api/calls/room
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { roomName, callType = 'video' } = req.body;
    const user = req.user;

    const room = `wassel-${callType}-${roomName || Date.now()}`;

    res.json({
      success: true,
      data: {
        roomName: room,
        url: LIVEKIT_URL,
        callType,
        createdBy: user.id,
        createdAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get LiveKit configuration
// @route   GET /api/calls/config
// @access  Private
exports.getConfig = async (req, res) => {
  res.json({
    success: true,
    data: {
      url: LIVEKIT_URL,
      apiKey: LIVEKIT_API_KEY
    }
  });
};
