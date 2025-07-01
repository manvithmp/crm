const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityController');
const activityController = require('../controllers/activityController');

router.get('/employee', ctrl.employeeActivity);

router.get('/', activityController.getActivities);

module.exports = router;
module.exports = router;