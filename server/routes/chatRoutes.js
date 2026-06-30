const express = require('express');
const router = express.Router();
const { protect, getCompany } = require('../middleware/auth');
const {  } = require('../middleware/tenant');
const { getRooms, getOrCreateDirectRoom, createGroupRoom, getMessages, sendMessage, deleteMessage, getOnlineUsers } = require('../controllers/chatController');

router.get('/rooms',               protect, getRooms);
router.post('/rooms/direct',       protect, getOrCreateDirectRoom);
router.post('/rooms/group',        protect, createGroupRoom);
router.get('/rooms/:roomId/messages',  protect, getMessages);
router.post('/rooms/:roomId/messages', protect, sendMessage);
router.delete('/messages/:messageId',  protect, deleteMessage);
router.get('/users/online',        protect, getOnlineUsers);

module.exports = router;
// ── Get or create direct room (cross-company) ──────────────────────────────
router.post('/direct', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const myId       = req.user.id;
    const ChatRoom   = require('../models/ChatRoom');
    const User       = require('../models/User');

    if (!userId || userId === myId) {
      return res.status(400).json({ success:false, message:'معرّف المستخدم غير صحيح' });
    }

    const targetUser = await User.findById(userId).select('name avatar company isOnline');
    if (!targetUser) return res.status(404).json({ success:false, message:'المستخدم غير موجود' });

    // Find existing direct room
    let room = await ChatRoom.findOne({
      type: { $in: ['direct','cross_company'] },
      participants: { $all:[myId, userId], $size:2 }
    }).populate('participants','name avatar isOnline company');

    if (!room) {
      const myUser = await User.findById(myId).select('company');
      const isCross = myUser.company?.toString() !== targetUser.company?.toString();
      room = await ChatRoom.create({
        type: isCross ? 'cross_company' : 'direct',
        participants: [myId, userId],
        company: isCross ? null : getCompany(req),
        lastActivity: new Date()
      });
      room = await ChatRoom.findById(room._id)
        .populate('participants','name avatar isOnline company lastSeen');
    }

    res.json({ success:true, data:room });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});
