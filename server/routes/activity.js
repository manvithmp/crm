const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityController');

router.get('/employee', ctrl.employeeActivity);

module.exports = router;