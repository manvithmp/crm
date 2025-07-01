const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');


exports.getEmployees = async (req, res) => {

  const employees = await User.find({ role: 'employee' }).select(
    'name email empId avatar status lastLogin location language'
  );
  res.json(employees);
};

exports.addEmployee = async (req, res) => {
  const { name, email, password, location, language } = req.body;

  const lastEmployee = await User.findOne({ role: 'employee', empId: { $regex: /^E\d{3}$/ } })
    .sort({ empId: -1 })
    .collation({ locale: 'en_US', numericOrdering: true });

  let nextNumber = 1;
  if (lastEmployee && lastEmployee.empId) {
    nextNumber = parseInt(lastEmployee.empId.substring(1), 10) + 1;
  }
  const empId = `E${String(nextNumber).padStart(3, '0')}`;

  const hashed = await bcrypt.hash(password || 'password123', 10);
  const employee = new User({
    name, email, password: hashed, role: 'employee', location, language, empId
  });
  await employee.save();
  await new Activity({ message: `Employee ${name} added`, user: req.user._id }).save();
  res.json({ message: 'Employee added', employee });
};

exports.updateEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') return res.status(404).json({ error: 'Employee not found' });
  Object.assign(employee, req.body);
  await employee.save();
  await new Activity({ message: `Employee ${employee.name} updated`, user: req.user._id }).save();
  res.json({ message: 'Employee updated', employee });
};

exports.deleteEmployee = async (req, res) => {
  const employee = await User.findById(req.params.id);
  if (!employee || employee.role !== 'employee') return res.status(404).json({ error: 'Employee not found' });
  await Lead.updateMany({ assignedTo: employee._id }, { assignedTo: null, status: 'unassigned' });
  await employee.deleteOne();
  await new Activity({ message: `Employee ${employee.name} deleted`, user: req.user._id }).save();
  res.json({ message: 'Employee deleted and leads unassigned' });
};