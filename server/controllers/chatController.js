const ChatRoom = require('../models/ChatRoom');
const { getCompany } = require('../middleware/auth');
const Message  = require('../models/Message');
const User     = require('../models/User');

// ─── Get all rooms for current user (across companies) ───────────────────
exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      participants: req.user.id,
      isActive: true
    })
    .populate('participants', 'name avatar isOnline lastSeen company')
    .populate({ path: 'participants', populate: { path: 'company', select: 'name' } })
    .populate('lastMessage')
    .sort({ lastActivity: -1 });
    res.json({ success: true, data: rooms });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Get or create direct room (cross-company) ───────────────────────────
exports.getOrCreateDirectRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.user.id;

    if (userId === myId) {
      return res.status(400).json({ success: false, message: 'لا يمكن محادثة نفسك' });
    }

    // Check target user exists
    const targetUser = await User.findById(userId).select('name avatar isOnline company');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    // Find existing direct room between these two users (regardless of company)
    let room = await ChatRoom.findOne({
      type: 'direct',
      participants: { $all: [myId, userId], $size: 2 }
    })
    .populate('participants', 'name avatar isOnline lastSeen')
    .populate({ path: 'participants', populate: { path: 'company', select: 'name' } });

    if (!room) {
      // Determine if cross-company
      const myUser = await User.findById(myId).select('company');
      const isCrossCompany = myUser.company?.toString() !== targetUser.company?.toString();

      room = await ChatRoom.create({
        type: isCrossCompany ? 'cross_company' : 'direct',
        participants: [myId, userId],
        company: isCrossCompany ? null : getCompany(req)
      });
      room = await ChatRoom.findById(room._id)
        .populate('participants', 'name avatar isOnline lastSeen')
        .populate({ path: 'participants', populate: { path: 'company', select: 'name' } });
    }

    res.json({ success: true, data: room });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Create group room ───────────────────────────────────────────────────
exports.createGroupRoom = async (req, res) => {
  try {
    const { name, participants } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'اسم المجموعة مطلوب' });

    const allParticipants = [...new Set([req.user.id, ...participants])];

    // Check if cross-company group
    const users = await User.find({ _id: { $in: allParticipants } }).select('company');
    const companies = [...new Set(users.map(u => u.company?.toString()).filter(Boolean))];
    const isCrossCompany = companies.length > 1;

    const room = await ChatRoom.create({
      name,
      type: 'group',
      participants: allParticipants,
      admin: req.user.id,
      company: isCrossCompany ? null : getCompany(req)
    });

    const populated = await ChatRoom.findById(room._id)
      .populate('participants', 'name avatar isOnline')
      .populate({ path: 'participants', populate: { path: 'company', select: 'name' } });

    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// ─── Get messages ─────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check user is participant (no company filter)
    const room = await ChatRoom.findOne({ _id: roomId, participants: req.user.id });
    if (!room) return res.status(403).json({ success: false, message: 'غير مسموح' });

    const messages = await Message.find({
      room: roomId,
      deletedFor: { $ne: req.user.id },
      isDeleted: false
    })
    .populate('sender', 'name avatar')
    .populate('replyTo', 'text sender')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Mark as read
    await Message.updateMany(
      { room: roomId, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );

    res.json({ success: true, data: messages.reverse() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Send message ─────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, type = 'text', replyTo } = req.body;

    const room = await ChatRoom.findOne({ _id: roomId, participants: req.user.id });
    if (!room) return res.status(403).json({ success: false, message: 'غير مسموح' });

    const message = await Message.create({
      room: roomId,
      sender: req.user.id,
      text,
      type,
      replyTo,
      readBy: [req.user.id]
    });

    room.lastMessage = message._id;
    room.lastActivity = new Date();
    await room.save();

    const populated = await message.populate('sender', 'name avatar');
    if (req.app.get('io')) req.app.get('io').to(roomId).emit('new_message', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// ─── Delete message ───────────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });

    if (message.sender.toString() === req.user.id) {
      message.isDeleted = true;
      message.text = 'تم حذف هذه الرسالة';
    } else {
      message.deletedFor.push(req.user.id);
    }
    await message.save();

    if (req.app.get('io')) {
      req.app.get('io').to(message.room.toString()).emit('message_deleted', { messageId: message._id });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ─── Get online users (all companies) ────────────────────────────────────
exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
      isActive: true
    })
    .select('name avatar isOnline lastSeen company')
    .populate('company', 'name')
    .sort({ isOnline: -1, name: 1 })
    .limit(200);
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
