const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

module.exports = function(role, soft = false) {
  return async function (req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (soft) return next(); 
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        if (soft) return next();
        return res.status(401).json({ error: 'Invalid user' });
      }
      req.user = user;
      if (role && user.role !== role) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (err) {
      if (soft) return next();
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
};