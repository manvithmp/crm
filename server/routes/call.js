const express = require('express');
const router = express.Router();
const callCtrl = require('../controllers/callController');

router.post('/', callCtrl.addCall);
router.get('/', callCtrl.getCalls);

module.exports = router;