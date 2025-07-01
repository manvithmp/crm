const User = require('../models/User');
const bcrypt = require('bcrypt');


exports.updatePassword = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and new password are required." });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "User not found." });

    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error." });
  }
};