# Teamline — Team Task Manager

A full-stack team task management app with role-based access control, built with **Node.js + Express + PostgreSQL** (backend) and **React + Vite** (frontend).

---

## 🚀 Live Demo

- **Frontend:** `https://teamline-frontend.up.railway.app`
- **Backend API:** `https://teamline-backend.up.railway.app`

**Demo accounts:**
| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | Admin |
| member@demo.com | member123 | Member |
| jordan@demo.com | pass123 | Member |

---

## ✨ Features

- **Authentication** — JWT-based signup/login with bcrypt password hashing
- **Role-Based Access** — Admin can create/delete projects & manage members; Members can view and update tasks
- **Projects** — Create, edit, delete projects with color labels and team members
- **Tasks** — Full CRUD, assign to members, set priority (Low/Medium/High), due dates, status tracking
- **Dashboard** — Stats overview, my tasks, project progress, overdue alerts
- **Kanban Board** — Drag status per column with quick status switcher
- **List View** — Sortable table view per project
- **My Tasks** — Filter all tasks assigned to you across projects

---

## 🏗️ Tech Stack

### Backend
- **Node.js** + **Express.js** — REST API
- **PostgreSQL** — Relational database
- **JWT** — Stateless authentication
- **bcryptjs** — Password hashing
- **express-validator** — Input validation

### Frontend
- **React 18** + **Vite** — Fast SPA
- **React Router v6** — Client-side routing
- **Axios** — HTTP client with interceptors

---

## 📁 Project Structure

```
teamline/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT + role guards
│   │   ├── models/
│   │   │   ├── db.js        # PostgreSQL pool
│   │   │   ├── migrate.js   # Schema creation
│   │   │   └── seed.js      # Demo data
│   │   ├── routes/
│   │   │   └── index.js     # All REST routes
│   │   └── server.js        # Express entry point
│   ├── .env.example
│   ├── package.json
│   └── railway.toml
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios API client
    │   ├── components/      # Reusable UI components
    │   │   ├── Layout.jsx
    │   │   ├── ProjectModal.jsx
    │   │   └── TaskModal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProjectsPage.jsx
    │   │   ├── ProjectDetailPage.jsx
    │   │   ├── MyTasksPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   └── SignupPage.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    ├── package.json
    └── railway.toml
```

---

## 🖥️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/teamline.git
cd teamline
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npm run migrate   # Creates tables
npm run seed      # Loads demo data
npm run dev       # Starts on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000/api
npm install
npm run dev       # Starts on http://localhost:5173
```

---

## 🌐 Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/teamline.git
git push -u origin main
```

### Step 2 — Deploy Backend

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **"Deploy from GitHub repo"** → select your repo
3. Set **Root Directory** to `backend`
4. Add a **PostgreSQL** service from the Railway dashboard
5. Set these **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-very-long-random-secret-here
   FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
   DATABASE_URL=${{Postgres.DATABASE_URL}}   ← Railway fills this automatically
   ```
6. Deploy → Railway runs `node src/server.js`
7. After deploy, open the **Shell** tab and run:
   ```bash
   npm run seed
   ```

### Step 3 — Deploy Frontend

1. In the same Railway project → **New Service** → GitHub repo
2. Set **Root Directory** to `frontend`
3. Set Environment Variable:
   ```
   VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
   ```
4. Deploy → Railway runs `npm run build` then serves `dist/`

### Step 4 — Update CORS

Back in the **backend service**, update:
```
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
```
Redeploy.

---

## 🔌 REST API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Get current user |

### Projects *(auth required)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project *(Admin)* |
| GET | `/api/projects/:id` | Get project detail |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks *(auth required)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | My tasks (all projects) |
| GET | `/api/projects/:pid/tasks` | Project tasks |
| POST | `/api/projects/:pid/tasks` | Create task |
| PUT | `/api/projects/:pid/tasks/:id` | Update task |
| PATCH | `/api/projects/:pid/tasks/:id/status` | Update status only |
| DELETE | `/api/projects/:pid/tasks/:id` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats for current user |

---

## 🔐 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Edit/delete project | ✅ (own) | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ (in own projects) |
| Edit/delete tasks | ✅ | ✅ (in own projects) |
| View all users | ✅ | ❌ |

---

## 🗄️ Database Schema

```sql
users (id, name, email, password, role, avatar, created_at)
projects (id, name, description, color, owner_id, created_at)
project_members (project_id, user_id, joined_at)
tasks (id, project_id, title, description, assignee_id,
       created_by, status, priority, due_date, created_at)
```

---

## 📦 Submission Checklist

- [x] Live URL (Railway)
- [x] GitHub repository
- [x] README with setup & deployment instructions
- [x] Demo video (record using Loom or OBS)

---

## 📹 Demo Video Tips

Cover these in your 2-5 min video:
1. Sign up as Admin → create a project → add members
2. Create tasks with priorities and due dates
3. Switch to Kanban board → change task statuses
4. Log in as Member → see restricted access
5. Dashboard overview with stats and overdue tasks
