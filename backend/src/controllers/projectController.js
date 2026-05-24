const { validationResult } = require('express-validator');
const pool = require('../models/db');

// Helper: fetch full project with members
const getProjectById = async (projectId, userId, role) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.name as owner_name,
       COALESCE(
         json_agg(DISTINCT jsonb_build_object(
           'id', pm_u.id, 'name', pm_u.name,
           'email', pm_u.email, 'role', pm_u.role, 'avatar', pm_u.avatar
         )) FILTER (WHERE pm_u.id IS NOT NULL), '[]'
       ) as members
     FROM projects p
     LEFT JOIN users u ON p.owner_id = u.id
     LEFT JOIN project_members pm ON pm.project_id = p.id
     LEFT JOIN users pm_u ON pm.user_id = pm_u.id
     WHERE p.id = $1
     GROUP BY p.id, u.name`,
    [projectId]
  );
  return rows[0] || null;
};

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.name as owner_name,
         COALESCE(
           json_agg(DISTINCT jsonb_build_object(
             'id', pm_u.id, 'name', pm_u.name,
             'email', pm_u.email, 'role', pm_u.role, 'avatar', pm_u.avatar
           )) FILTER (WHERE pm_u.id IS NOT NULL), '[]'
         ) as members,
         COUNT(DISTINCT t.id)::int as task_count
       FROM projects p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN users pm_u ON pm.user_id = pm_u.id
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.id IN (
         SELECT project_id FROM project_members WHERE user_id = $1
       )
       GROUP BY p.id, u.name
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id, req.user.id, req.user.role);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { name, description, color = '#6366f1', memberIds = [] } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO projects (name, description, color, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name.trim(), description?.trim(), color, req.user.id]
      );
      const project = rows[0];

      // Always add the creator
      const allMembers = [...new Set([req.user.id, ...memberIds])];
      for (const uid of allMembers) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [project.id, uid]
        );
      }

      await client.query('COMMIT');
      const full = await getProjectById(project.id, req.user.id, req.user.role);
      res.status(201).json({ project: full });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { name, description, color, memberIds } = req.body;
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Project not found' });
    if (existing.rows[0].owner_id !== req.user.id && req.user.role !== 'Admin')
      return res.status(403).json({ error: 'Not authorized' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE projects SET name=$1, description=$2, color=$3, updated_at=NOW() WHERE id=$4`,
        [name || existing.rows[0].name, description ?? existing.rows[0].description, color || existing.rows[0].color, id]
      );

      if (memberIds) {
        await client.query('DELETE FROM project_members WHERE project_id = $1', [id]);
        const allMembers = [...new Set([existing.rows[0].owner_id, ...memberIds])];
        for (const uid of allMembers) {
          await client.query(
            'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, uid]
          );
        }
      }

      await client.query('COMMIT');
      const full = await getProjectById(id, req.user.id, req.user.role);
      res.json({ project: full });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    if (rows[0].owner_id !== req.user.id && req.user.role !== 'Admin')
      return res.status(403).json({ error: 'Not authorized' });

    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
