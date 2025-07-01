const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/profileController');

router.get('/', auth(), ctrl.getProfile);
router.put('/', auth(), ctrl.updateProfile);

module.exports = router;