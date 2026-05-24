const { validationResult } = require('express-validator');
const pool = require('../models/db');

const taskWithDetails = `
  SELECT t.*,
    jsonb_build_object('id', a.id, 'name', a.name, 'avatar', a.avatar, 'email', a.email) as assignee,
    jsonb_build_object('id', cb.id, 'name', cb.name, 'avatar', cb.avatar) as creator,
    jsonb_build_object('id', p.id, 'name', p.name, 'color', p.color) as project
  FROM tasks t
  LEFT JOIN users a ON t.assignee_id = a.id
  LEFT JOIN users cb ON t.created_by = cb.id
  LEFT JOIN projects p ON t.project_id = p.id
`;

// GET /api/tasks  (my tasks — assigned to me across all my projects)
const getMyTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    let query = `${taskWithDetails}
      WHERE t.assignee_id = $1`;
    const params = [req.user.id];

    if (status) { query += ` AND t.status = $${params.length + 1}`; params.push(status); }
    if (priority) { query += ` AND t.priority = $${params.length + 1}`; params.push(priority); }
    query += ' ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ tasks: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks
const getProjectTasks = async (req, res, next) => {
  try {
    const { status, priority, assigneeId } = req.query;
    let query = `${taskWithDetails} WHERE t.project_id = $1`;
    const params = [req.params.projectId];

    if (status) { query += ` AND t.status = $${params.length + 1}`; params.push(status); }
    if (priority) { query += ` AND t.priority = $${params.length + 1}`; params.push(priority); }
    if (assigneeId) { query += ` AND t.assignee_id = $${params.length + 1}`; params.push(assigneeId); }
    query += ' ORDER BY t.created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ tasks: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${taskWithDetails} WHERE t.id = $1 AND t.project_id = $2`,
      [req.params.id, req.params.projectId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: rows[0] });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { title, description, assigneeId, status = 'Todo', priority = 'Medium', dueDate } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [req.params.projectId, title.trim(), description?.trim(), assigneeId || null,
       req.user.id, status, priority, dueDate || null]
    );

    const { rows: full } = await pool.query(
      `${taskWithDetails} WHERE t.id = $1`, [rows[0].id]
    );
    res.status(201).json({ task: full[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { rows: existing } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND project_id = $2',
      [req.params.id, req.params.projectId]
    );
    if (!existing.length) return res.status(404).json({ error: 'Task not found' });

    const t = existing[0];
    const { title, description, assigneeId, status, priority, dueDate } = req.body;

    await pool.query(
      `UPDATE tasks SET
        title = $1, description = $2, assignee_id = $3,
        status = $4, priority = $5, due_date = $6, updated_at = NOW()
       WHERE id = $7`,
      [
        title ?? t.title,
        description !== undefined ? description : t.description,
        assigneeId !== undefined ? assigneeId : t.assignee_id,
        status ?? t.status,
        priority ?? t.priority,
        dueDate !== undefined ? (dueDate || null) : t.due_date,
        req.params.id,
      ]
    );

    const { rows: full } = await pool.query(
      `${taskWithDetails} WHERE t.id = $1`, [req.params.id]
    );
    res.json({ task: full[0] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/projects/:projectId/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Todo', 'In Progress', 'Review', 'Done'];
    if (!validStatuses.includes(status))
      return res.status(422).json({ error: 'Invalid status' });

    const { rows } = await pool.query(
      'UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 AND project_id=$3 RETURNING id',
      [status, req.params.id, req.params.projectId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });

    const { rows: full } = await pool.query(
      `${taskWithDetails} WHERE t.id = $1`, [req.params.id]
    );
    res.json({ task: full[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND project_id = $2 RETURNING id',
      [req.params.id, req.params.projectId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard  (aggregate stats for current user)
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows: [stats] } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = $1) as total_projects,
        (SELECT COUNT(*)::int FROM tasks t
         JOIN project_members pm ON pm.project_id = t.project_id
         WHERE pm.user_id = $1) as total_tasks,
        (SELECT COUNT(*)::int FROM tasks WHERE assignee_id = $1) as my_tasks,
        (SELECT COUNT(*)::int FROM tasks t
         JOIN project_members pm ON pm.project_id = t.project_id
         WHERE pm.user_id = $1 AND t.status = 'In Progress') as in_progress,
        (SELECT COUNT(*)::int FROM tasks t
         JOIN project_members pm ON pm.project_id = t.project_id
         WHERE pm.user_id = $1 AND t.status = 'Done') as done,
        (SELECT COUNT(*)::int FROM tasks t
         JOIN project_members pm ON pm.project_id = t.project_id
         WHERE pm.user_id = $1 AND t.due_date < NOW() AND t.status != 'Done') as overdue
    `, [userId]);

    res.json({ stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyTasks, getProjectTasks, getTask,
  createTask, updateTask, updateTaskStatus, deleteTask,
  getDashboardStats,
};
