const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

router.post('/update-password', userCtrl.updatePassword);

module.exports = router;