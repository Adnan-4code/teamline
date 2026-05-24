import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardAPI, tasksAPI, projectsAPI } from '../api'

const STATUS_CFG = {
  'Todo': { bg: '#1e293b', text: '#94a3b8', dot: '#64748b' },
  'In Progress': { bg: '#1e3a5f', text: '#60a5fa', dot: '#3b82f6' },
  'Review': { bg: '#2d1f5e', text: '#a78bfa', dot: '#8b5cf6' },
  'Done': { bg: '#14532d', text: '#4ade80', dot: '#22c55e' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats(),
      tasksAPI.getMyTasks(),
      projectsAPI.getAll(),
    ]).then(([s, t, p]) => {
      setStats(s.data.stats)
      setMyTasks(t.data.tasks)
      setProjects(p.data.projects)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'

  const statCards = [
    { label: 'Total Projects', value: stats?.total_projects ?? 0, color: '#6366f1' },
    { label: 'My Tasks', value: stats?.my_tasks ?? 0, color: '#3b82f6' },
    { label: 'In Progress', value: stats?.in_progress ?? 0, color: '#f59e0b' },
    { label: 'Overdue', value: stats?.overdue ?? 0, color: '#ef4444' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
          Good {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Here's what's happening with your projects today</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", color, marginBottom: 8 }}>{value}</div>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>My Tasks</h2>
            <button onClick={() => navigate('/tasks')} style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer' }}>View all</button>
          </div>
          {myTasks.length === 0
            ? <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks assigned</p>
            : myTasks.slice(0, 6).map(t => {
              const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CFG[t.status]?.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: t.project?.color || '#64748b', marginTop: 2 }}>{t.project?.name}</p>
                  </div>
                  {isOverdue && <span style={{ fontSize: 10, color: '#ef4444', background: '#2d0f0f', padding: '2px 6px', borderRadius: 4 }}>Overdue</span>}
                  <span style={{ fontSize: 11, color: STATUS_CFG[t.status]?.text, background: STATUS_CFG[t.status]?.bg, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{t.status}</span>
                </div>
              )
            })}
        </div>

        <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>Projects</h2>
            <button onClick={() => navigate('/projects')} style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer' }}>View all</button>
          </div>
          {projects.length === 0
            ? <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No projects yet</p>
            : projects.map(p => {
              const pct = p.task_count > 0 ? Math.round((p.done_count || 0) / p.task_count * 100) : 0
              return (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ padding: '12px 8px', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{p.task_count} tasks</span>
                  </div>
                  <div style={{ background: '#1e293b', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: p.color, borderRadius: 4 }} />
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', fontSize: 14 }}>
      Loading dashboard...
    </div>
  )
}
