const express = require('express');
const router = express.Router();
const { protect, getCompany } = require('../middleware/auth');
const { getRooms, getOrCreateDirectRoom, createGroupRoom, getMessages, sendMessage, deleteMessage, getOnlineUsers } = require('../controllers/chatController');

router.get('/rooms',               protect, getRooms);
router.post('/rooms/direct',       protect, getOrCreateDirectRoom);
router.post('/rooms/group',        protect, createGroupRoom);
router.get('/rooms/:roomId/messages',  protect, getMessages);
router.post('/rooms/:roomId/messages', protect, sendMessage);
router.delete('/messages/:messageId',  protect, deleteMessage);
router.get('/users/online',        protect, getOnlineUsers);

module.exports = router;
