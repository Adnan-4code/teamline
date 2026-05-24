const pool = require('../models/db');

// GET /api/users  (admin only — all users)
const getUsers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at'
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/project/:projectId
const getProjectUsers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar
       FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.projectId]
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getProjectUsers };
