const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdminAndEmployees() {
  const adminEmail = 'admin@canovacrm.com';
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hash = await bcrypt.hash('adminpass', 10);
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: hash,
      role: 'admin'
    });
    console.log('Admin seeded');
  }

  const employees = await User.find({ role: 'employee' });
  const hash = await bcrypt.hash('emp123', 10);
  for (let emp of employees) {
    emp.password = hash;
    await emp.save();
  }
  if (employees.length > 0) {
    console.log('Employee passwords reset to emp123');
  }
}

module.exports = seedAdminAndEmployees;