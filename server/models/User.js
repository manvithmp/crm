const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  location: String,
  language: String,
  empId: String,
  lastLogin: { type: Date },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  avatar: String,
});

module.exports = mongoose.model('User', userSchema);