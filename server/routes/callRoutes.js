const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect } = require('../middleware/auth');

// @route   POST /api/calls/token
// @desc    Generate LiveKit token
// @access  Private
router.post('/token', protect, callController.getCallToken);

// @route   POST /api/calls/room
// @desc    Create call room
// @access  Private
router.post('/room', protect, callController.createRoom);

// @route   GET /api/calls/config
// @desc    Get LiveKit config
// @access  Private
router.get('/config', protect, callController.getConfig);

module.exports = router;
