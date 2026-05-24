const jwt = require('jsonwebtoken');
const pool = require('../models/db');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, name, email, role, avatar FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check user is a member of a project
const projectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.projectId || req.params.id;
  if (!projectId) return next();

  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );
    if (!rows.length && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { auth, adminOnly, projectMember };
