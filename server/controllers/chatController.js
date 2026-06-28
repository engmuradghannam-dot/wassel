const ChatRoom = require('../models/ChatRoom');
const Message  = require('../models/Message');
const User     = require('../models/User');
const { buildFilter } = require('../middleware/tenant');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find(buildFilter(req, { participants: req.user.id, isActive: true }))
      .populate('participants','name avatar isOnline lastSeen')
      .populate('lastMessage').sort({ lastActivity: -1 });
    res.json({ success: true, data: rooms });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOrCreateDirectRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const myId = req.user.id;
    if (userId === myId) return res.status(400).json({ success: false, message: 'لا يمكن محادثة نفسك' });
    let room = await ChatRoom.findOne(buildFilter(req, {
      type: 'direct', participants: { $all: [myId, userId], $size: 2 }
    })).populate('participants','name avatar isOnline lastSeen');
    if (!room) {
      room = await ChatRoom.create({ company: req.company, type: 'direct', participants: [myId, userId] });
      room = await room.populate('participants','name avatar isOnline lastSeen');
    }
    res.json({ success: true, data: room });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createGroupRoom = async (req, res) => {
  try {
    const { name, participants } = req.body;
    const room = await ChatRoom.create({
      company: req.company, name, type: 'group',
      participants: [...new Set([req.user.id, ...participants])],
      admin: req.user.id
    });
    const populated = await room.populate('participants','name avatar isOnline');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const room = await ChatRoom.findOne(buildFilter(req, { _id: roomId, participants: req.user.id }));
    if (!room) return res.status(403).json({ success: false, message: 'غير مسموح' });
    const messages = await Message.find({ room: roomId, deletedFor: { $ne: req.user.id }, isDeleted: false })
      .populate('sender','name avatar').populate('replyTo','text sender')
      .sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    await Message.updateMany({ room: roomId, readBy: { $ne: req.user.id } }, { $addToSet: { readBy: req.user.id } });
    res.json({ success: true, data: messages.reverse() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, type = 'text', replyTo } = req.body;
    const room = await ChatRoom.findOne(buildFilter(req, { _id: roomId, participants: req.user.id }));
    if (!room) return res.status(403).json({ success: false, message: 'غير مسموح' });
    const message = await Message.create({ room: roomId, sender: req.user.id, text, type, replyTo, readBy: [req.user.id] });
    room.lastMessage = message._id; room.lastActivity = new Date(); await room.save();
    const populated = await message.populate('sender','name avatar');
    if (req.app.get('io')) req.app.get('io').to(roomId).emit('new_message', populated);
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ success: false, message: 'الرسالة غير موجودة' });
    if (message.sender.toString() === req.user.id) {
      message.isDeleted = true; message.text = 'تم حذف هذه الرسالة';
    } else { message.deletedFor.push(req.user.id); }
    await message.save();
    if (req.app.get('io')) req.app.get('io').to(message.room.toString()).emit('message_deleted', { messageId: message._id });
    res.json({ success: true, message: 'تم حذف الرسالة' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find(buildFilter(req, { isOnline: true, _id: { $ne: req.user.id } }))
      .select('name avatar isOnline lastSeen');
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
