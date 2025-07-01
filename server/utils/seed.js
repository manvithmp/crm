const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seedAdminAndEmployees() {
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created');
  }
  
  const employees = [
    { name: 'manvith', email: 'manvith@example.com', empId: 'E001' },
    { name: 'sagar', email: 'sagar@example.com', empId: 'E002' },
    { name: 'mranal', email: 'mranal@example.com', empId: 'E003' },
    { name: 'aditya', email: 'aditya@example.com', empId: 'E004' },
    { name: 'sujith', email: 'sujith@example.com', empId: 'E005' }
  ];
  for (const emp of employees) {
    const exists = await User.findOne({ email: emp.email });
    if (!exists) {
      const employee = new User({
        name: emp.name,
        email: emp.email,
        password: await bcrypt.hash('password123', 10),
        role: 'employee',
        empId: emp.empId
      });
      await employee.save();
      console.log(`Employee ${emp.name} created`);
    }
  }
}
module.exports = seedAdminAndEmployees;