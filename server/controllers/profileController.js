const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  const updates = req.body;
  if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
  Object.assign(req.user, updates);
  await req.user.save();
  res.json({ message: 'Profile updated', user: req.user });
};