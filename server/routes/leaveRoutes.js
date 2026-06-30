const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLeaves, getLeave, getBalance, createLeave, approveLeave, updateLeave, cancelLeave
} = require('../controllers/leaveController');

router.get('/balance', protect, getBalance);

router.route('/')
  .get( protect, getLeaves)
  .post(protect, createLeave); // أي موظف يقدّم طلب إجازة لنفسه

router.route('/:id')
  .get(protect, getLeave)
  .put(protect, updateLeave);

router.put('/:id/approve', protect, authorize('owner','admin','manager'), approveLeave);
router.put('/:id/cancel',  protect, cancelLeave);

module.exports = router;
