const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/attendanceController');

router.post('/checkin', auth(), ctrl.checkIn);
router.post('/checkout', auth(), ctrl.checkOut);
router.post('/break/start', ctrl.startBreak);
router.post('/break/end', ctrl.endBreak);

router.get('/employee/summary', ctrl.employeeSummary);

module.exports = router;