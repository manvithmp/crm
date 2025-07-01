const Activity = require('../models/Activity');
const User = require('../models/User');


function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} sec ago`;
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hour ago`;
  return `${Math.floor(diff/86400)} days ago`;
}

exports.employeeActivity = async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email, role: "employee" });
  if (!user) return res.json({ activity: [] });
  const acts = await Activity.find({ user: user._id }).sort({ timestamp: -1 }).limit(5);
  res.json({
    activity: acts.map(a => ({
      message: a.message,
      timeAgo: timeAgo(a.timestamp),
    }))
  });
};

exports.getActivities = async (req, res) => {
  const activities = await Activity.find({}).sort({ createdAt: -1 }).limit(5);
  res.json(activities);
};