const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  checkIn: Date,
  checkOut: Date,
  breaks: [{
    start: Date,
    end: Date
  }]
});

module.exports = mongoose.model('Attendance', attendanceSchema);