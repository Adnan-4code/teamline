const router = require('express').Router();
const { body } = require('express-validator');
const { auth, adminOnly, projectMember } = require('../middleware/auth');

const authCtrl = require('../controllers/authController');
const projectCtrl = require('../controllers/projectController');
const taskCtrl = require('../controllers/taskController');
const userCtrl = require('../controllers/userController');

// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').optional().isIn(['Admin', 'Member']),
  ],
  authCtrl.signup
);

router.post('/auth/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  authCtrl.login
);

router.get('/auth/me', auth, authCtrl.me);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', auth, taskCtrl.getDashboardStats);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', auth, adminOnly, userCtrl.getUsers);
router.get('/users/project/:projectId', auth, projectMember, userCtrl.getProjectUsers);

// ─── Projects ────────────────────────────────────────────────────────────────
router.get('/projects', auth, projectCtrl.getProjects);
router.get('/projects/:id', auth, projectMember, projectCtrl.getProject);

router.post('/projects',
  auth, adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Project name required'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color'),
  ],
  projectCtrl.createProject
);

router.put('/projects/:id',
  auth,
  [body('name').optional().trim().notEmpty()],
  projectCtrl.updateProject
);

router.delete('/projects/:id', auth, projectCtrl.deleteProject);

// ─── Tasks ───────────────────────────────────────────────────────────────────
router.get('/tasks', auth, taskCtrl.getMyTasks);   // My tasks across all projects

router.get('/projects/:projectId/tasks', auth, projectMember, taskCtrl.getProjectTasks);
router.get('/projects/:projectId/tasks/:id', auth, projectMember, taskCtrl.getTask);

router.post('/projects/:projectId/tasks',
  auth, projectMember,
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date'),
  ],
  taskCtrl.createTask
);

router.put('/projects/:projectId/tasks/:id',
  auth, projectMember,
  [
    body('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
  ],
  taskCtrl.updateTask
);

router.patch('/projects/:projectId/tasks/:id/status',
  auth, projectMember,
  taskCtrl.updateTaskStatus
);

router.delete('/projects/:projectId/tasks/:id', auth, projectMember, taskCtrl.deleteTask);

module.exports = router;
