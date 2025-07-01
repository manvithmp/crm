const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

   
    if (user.role === 'employee') {
      let today = new Date();
      today.setHours(0,0,0,0);
      let attendance = await Attendance.findOne({ user: user._id, date: today });
      if (!attendance) {
        attendance = new Attendance({ user: user._id, date: today, checkIn: new Date() });
        await attendance.save();
        await new Activity({ user: user._id, message: 'Checked in' }).save();
      }
    
      return res.json({
        user: { _id: user._id, email: user.email, name: user.name, role: user.role }
      });
    }

 
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      user: { _id: user._id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};