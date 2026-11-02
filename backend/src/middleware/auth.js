const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.findOne('profiles', p => p.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been temporarily suspended by an Administrator.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please sign in again.' });
    }
    return res.status(403).json({ error: 'Invalid or forged token.' });
  }
}

module.exports = authenticateToken;
