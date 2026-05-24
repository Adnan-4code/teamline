import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { tasksAPI, projectsAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import TaskModal from '../components/TaskModal'

const STATUS_CFG = {
  'Todo': { bg: '#1e293b', text: '#94a3b8' },
  'In Progress': { bg: '#1e3a5f', text: '#60a5fa' },
  'Review': { bg: '#2d1f5e', text: '#a78bfa' },
  'Done': { bg: '#14532d', text: '#4ade80' },
}
const PRIORITY_CFG = {
  'Low': { color: '#64748b', bg: '#1e293b' },
  'Medium': { color: '#f59e0b', bg: '#2d1f00' },
  'High': { color: '#ef4444', bg: '#2d0f0f' },
}
const STATUSES = ['Todo', 'In Progress', 'Review', 'Done']

export default function MyTasksPage() {
  const { user } = useAuth()
  const { showToast } = useOutletContext()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [taskModal, setTaskModal] = useState(null)

  const load = () => {
    Promise.all([tasksAPI.getMyTasks(), projectsAPI.getAll()])
      .then(([t, p]) => { setTasks(t.data.tasks); setProjects(p.data.projects) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter)

  const handleSave = async (data) => {
    try {
      await tasksAPI.update(taskModal.task.project_id, taskModal.task.id, data)
      showToast('Task updated!')
      setTaskModal(null)
      load()
    } catch {
      showToast('Error updating task', 'error')
    }
  }

  if (loading) return <div style={spinnerStyle}>Loading tasks...</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>My Tasks</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: filter === s ? '#6366f1' : '#0f172a', color: filter === s ? '#fff' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <p style={{ fontSize: 14 }}>No tasks found</p>
        </div>
      ) : (
        <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 110px', padding: '10px 16px', borderBottom: '1px solid #1e293b' }}>
            {['Task', 'Project', 'Status', 'Priority', 'Due Date'].map(h => (
              <span key={h} style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {filtered.map(t => {
            const proj = t.project
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done'
            return (
              <div key={t.id} onClick={() => setTaskModal({ task: t })}
                style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 110px', padding: '12px 16px', borderBottom: '1px solid #0f172a', cursor: 'pointer' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: '#475569' }}>{t.description?.slice(0, 45)}{t.description?.length > 45 ? '...' : ''}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: proj?.color || '#64748b' }}>{proj?.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: STATUS_CFG[t.status]?.text, background: STATUS_CFG[t.status]?.bg, padding: '3px 8px', borderRadius: 6 }}>{t.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: PRIORITY_CFG[t.priority]?.color, background: PRIORITY_CFG[t.priority]?.bg, padding: '3px 8px', borderRadius: 6 }}>{t.priority}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: isOverdue ? '#ef4444' : '#64748b' }}>
                    {t.due_date ? new Date(t.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                  </span>
                  {isOverdue && <span style={{ fontSize: 9, color: '#ef4444', background: '#2d0f0f', padding: '1px 5px', borderRadius: 3, marginLeft: 6 }}>Late</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {taskModal && (
        <TaskModal
          type="edit"
          task={taskModal.task}
          projectId={taskModal.task.project_id}
          members={projects.find(p => p.id === taskModal.task.project_id)?.members || []}
          onClose={() => setTaskModal(null)}
          onSave={handleSave}
          onDelete={async () => {
            try {
              await tasksAPI.delete(taskModal.task.project_id, taskModal.task.id)
              showToast('Task deleted', 'error')
              setTaskModal(null)
              load()
            } catch { showToast('Error', 'error') }
          }}
        />
      )}
    </div>
  )
}

const spinnerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', fontSize: 14 }
