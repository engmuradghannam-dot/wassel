const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAttendance, checkIn, checkOut, getMonthlyReport, upsertManual, deleteAttendance
} = require('../controllers/attendanceController');

router.get('/',         protect, getAttendance);
router.get('/report',   protect, getMonthlyReport);
router.post('/check-in',  protect, checkIn);
router.post('/check-out', protect, checkOut);
router.post('/manual',  protect, authorize('owner','admin','manager'), upsertManual);
router.delete('/:id',   protect, authorize('owner','admin'), deleteAttendance);

module.exports = router;
