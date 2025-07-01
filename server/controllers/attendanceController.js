const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const User = require('../models/User');


exports.checkIn = async (req, res) => {
  const userId = req.user._id;
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let attendance = await Attendance.findOne({ user: userId, date: today });
  if (!attendance) {
    attendance = new Attendance({ user: userId, date: today, checkIn: new Date() });
    await attendance.save();
    await new Activity({ user: userId, message: 'Checked in' }).save();
  
    await User.findByIdAndUpdate(userId, { status: 'active' });
    return res.json({ message: 'Checked in', attendance });
  } else {
    return res.status(400).json({ error: 'Already checked in today' });
  }
};


exports.checkOut = async (req, res) => {
  const userId = req.user._id;
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let attendance = await Attendance.findOne({ user: userId, date: today });
  if (!attendance) return res.status(400).json({ error: 'Not checked in today' });
  attendance.checkOut = new Date();
  await attendance.save();
  await new Activity({ user: userId, message: 'Checked out' }).save();
 
  await User.findByIdAndUpdate(userId, { status: 'inactive' });
  res.json({ message: 'Checked out', attendance });
};


exports.startBreak = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let attendance = await Attendance.findOne({ user: user._id, date: today });
  if (!attendance) return res.status(400).json({ error: 'Not checked in today' });

  attendance.breaks.push({ start: new Date() });
  await attendance.save();
  res.json({ message: 'Break started', attendance });
};


exports.endBreak = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let today = new Date();
  today.setHours(0, 0, 0, 0);
  let attendance = await Attendance.findOne({ user: user._id, date: today });
  if (!attendance || !attendance.breaks.length) return res.status(400).json({ error: 'No break started' });
  if (attendance.breaks[attendance.breaks.length - 1].end)
    return res.status(400).json({ error: 'Break already ended' });

  attendance.breaks[attendance.breaks.length - 1].end = new Date();
  await attendance.save();
  res.json({ message: 'Break ended', attendance });
};


function last7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(new Date(d));
  }
  return days;
}


exports.employeeSummary = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email, role: "employee" });
    if (!user) return res.status(404).json({ error: "Employee not found" });

  
    const today = new Date();
    today.setHours(0,0,0,0);
    const attendance = await Attendance.findOne({ user: user._id, date: today });

    
    const breakHistory = [];
    const days = last7Days();
    for (const d of days) {
      const attend = await Attendance.findOne({ user: user._id, date: d });
      if (attend && attend.breaks.length) {
        const br = attend.breaks[attend.breaks.length - 1];
        breakHistory.push({
          breakStart: br.start,
          breakEnd: br.end,
          date: d,
        });
      } else {
        breakHistory.push({
          breakStart: null,
          breakEnd: null,
          date: d,
        });
      }
    }

    res.json({
      attendance,
      breakHistory,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee summary' });
  }
};