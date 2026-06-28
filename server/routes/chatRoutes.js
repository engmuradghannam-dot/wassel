const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { tenantGuard } = require('../middleware/tenant');
const { getRooms, getOrCreateDirectRoom, createGroupRoom, getMessages, sendMessage, deleteMessage, getOnlineUsers } = require('../controllers/chatController');

router.get('/rooms',               protect, tenantGuard, getRooms);
router.post('/rooms/direct',       protect, tenantGuard, getOrCreateDirectRoom);
router.post('/rooms/group',        protect, tenantGuard, createGroupRoom);
router.get('/rooms/:roomId/messages',  protect, tenantGuard, getMessages);
router.post('/rooms/:roomId/messages', protect, tenantGuard, sendMessage);
router.delete('/messages/:messageId',  protect, tenantGuard, deleteMessage);
router.get('/users/online',        protect, tenantGuard, getOnlineUsers);

module.exports = router;