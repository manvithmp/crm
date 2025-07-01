const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');
const User = require('../models/User');

router.get('/', auth(), async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }, { password: 0 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

router.post('/', auth(), employeeController.addEmployee);

router.delete('/:id', auth(), employeeController.deleteEmployee);

module.exports = router;