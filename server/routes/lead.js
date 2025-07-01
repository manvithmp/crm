const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const leadCtrl = require('../controllers/leadController');


router.get('/', auth(null, true), leadCtrl.getLeads);

router.put('/:id', leadCtrl.updateLead);

router.get('/sample-csv', leadCtrl.downloadSampleCsv);
router.post('/', auth('admin'), leadCtrl.addLead);
router.get('/:id', auth(), leadCtrl.getLead);
router.post('/assign', auth('admin'), leadCtrl.assignLeads);
router.post('/upload', auth('admin'), upload.single('csv'), leadCtrl.uploadCsv);
router.delete('/batch/:batchName', auth('admin'), leadCtrl.deleteLeadsByBatch);

module.exports = router;