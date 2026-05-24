import { useState, useEffect } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { projectsAPI, tasksAPI } from '../api'
import TaskModal from '../components/TaskModal'
import ProjectModal from '../components/ProjectModal'

const STATUS_CFG = {
  'Todo': { bg: '#1e293b', text: '#94a3b8', dot: '#64748b' },
  'In Progress': { bg: '#1e3a5f', text: '#60a5fa', dot: '#3b82f6' },
  'Review': { bg: '#2d1f5e', text: '#a78bfa', dot: '#8b5cf6' },
  'Done': { bg: '#14532d', text: '#4ade80', dot: '#22c55e' },
}
const PRIORITY_CFG = {
  'Low': { color: '#64748b', bg: '#1e293b' },
  'Medium': { color: '#f59e0b', bg: '#2d1f00' },
  'High': { color: '#ef4444', bg: '#2d0f0f' },
}
const STATUSES = ['Todo', 'In Progress', 'Review', 'Done']

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useOutletContext()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('board')
  const [taskModal, setTaskModal] = useState(null)
  const [projectModal, setProjectModal] = useState(false)

  const load = async () => {
    try {
      const [p, t] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getProjectTasks(id),
      ])
      setProject(p.data.project)
      setTasks(t.data.tasks)
    } catch {
      showToast('Failed to load project', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const canManage = user.role === 'Admin' || project?.owner_id === user.id

  const handleTaskSave = async (data) => {
    try {
      if (taskModal.type === 'create') {
        await tasksAPI.create(id, data)
        showToast('Task created!')
      } else {
        await tasksAPI.update(id, taskModal.task.id, data)
        showToast('Task updated!')
      }
      setTaskModal(null)
      load()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving task', 'error')
    }
  }

  const handleTaskDelete = async (taskId) => {
    try {
      await tasksAPI.delete(id, taskId)
      showToast('Task deleted', 'error')
      setTaskModal(null)
      load()
    } catch {
      showToast('Error deleting task', 'error')
    }
  }

  const handleStatusChange = async (taskId, status) => {
    try {
      await tasksAPI.updateStatus(id, taskId, status)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    } catch {
      showToast('Error updating status', 'error')
    }
  }

  const handleProjectSave = async (data) => {
    try {
      await projectsAPI.update(id, data)
      showToast('Project updated!')
      setProjectModal(false)
      load()
    } catch {
      showToast('Error updating project', 'error')
    }
  }

  if (loading) return <div style={spinnerStyle}>Loading project...</div>
  if (!project) return <div style={spinnerStyle}>Project not found</div>

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s); return acc
  }, {})

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 0', borderBottom: '1px solid #1e293b', background: '#080c14' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{project.name}</h1>
              <p style={{ fontSize: 13, color: '#64748b' }}>{project.description}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canManage && (
              <>
                <button onClick={() => setProjectModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', border: '1px solid #1e293b', color: '#94a3b8', padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                  ✎ Edit
                </button>
                <button onClick={() => setTaskModal({ type: 'create' })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + Add Task
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 0 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>{tasks.length} tasks</span>
          <span style={{ fontSize: 12, color: '#22c55e' }}>{tasks.filter(t => t.status === 'Done').length} done</span>
          <span style={{ fontSize: 12, color: '#ef4444' }}>{tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done').length} overdue</span>
          <div style={{ display: 'flex', marginLeft: 8 }}>
            {(project.members || []).slice(0, 5).map((m, i) => (
              <div key={m.id} title={m.name} style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${i * 60 + 200},55%,38%)`, border: '2px solid #080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, marginLeft: i ? -8 : 0, color: '#fff' }}>{m.avatar}</div>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, marginTop: 16 }}>
          {['board', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: view === v ? '#0f172a' : 'transparent', color: view === v ? '#6366f1' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderBottom: view === v ? '2px solid #6366f1' : '2px solid transparent', textTransform: 'capitalize' }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Board / List */}
      <div style={{ flex: 1, overflowX: view === 'board' ? 'auto' : 'hidden', overflowY: 'auto', padding: 24 }}>
        {view === 'board' ? (
          <div style={{ display: 'flex', gap: 16, minWidth: 'max-content', alignItems: 'flex-start' }}>
            {STATUSES.map(s => (
              <div key={s} style={{ width: 270, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CFG[s].dot }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_CFG[s].text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s}</span>
                  <span style={{ fontSize: 11, color: '#475569', background: '#0f172a', padding: '2px 7px', borderRadius: 10, marginLeft: 'auto' }}>{tasksByStatus[s].length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tasksByStatus[s].map(t => (
                    <TaskCard key={t.id} task={t} canManage={canManage}
                      onEdit={() => setTaskModal({ type: 'edit', task: t })}
                      onStatusChange={(status) => handleStatusChange(t.id, status)} />
                  ))}
                  {canManage && (
                    <button onClick={() => setTaskModal({ type: 'create', defaultStatus: s })}
                      style={{ padding: 10, borderRadius: 10, border: '1px dashed #1e293b', background: 'transparent', color: '#475569', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      + Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 100px', padding: '10px 16px', borderBottom: '1px solid #1e293b' }}>
              {['Task', 'Assignee', 'Status', 'Priority', 'Due Date'].map(h => (
                <span key={h} style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {tasks.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: '#475569', fontSize: 13 }}>No tasks yet. {canManage ? 'Click "+ Add Task" to create one.' : ''}</div>
              : tasks.map(t => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done'
                return (
                  <div key={t.id} onClick={() => canManage && setTaskModal({ type: 'edit', task: t })}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 100px', padding: '12px 16px', borderBottom: '1px solid #0f172a', cursor: canManage ? 'pointer' : 'default' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{t.title}</p>
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{t.description?.slice(0, 50)}{t.description?.length > 50 ? '...' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t.assignee && <>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{t.assignee.avatar}</div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.assignee.name?.split(' ')[0]}</span>
                      </>}
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
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {taskModal && (
        <TaskModal
          type={taskModal.type}
          task={taskModal.task}
          defaultStatus={taskModal.defaultStatus}
          projectId={id}
          members={project.members || []}
          onClose={() => setTaskModal(null)}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}

      {projectModal && (
        <ProjectModal
          type="edit"
          project={project}
          allUsers={project.members || []}
          currentUser={user}
          onClose={() => setProjectModal(false)}
          onSave={handleProjectSave}
          onDelete={async (pid) => {
            try {
              await projectsAPI.delete(pid)
              showToast('Project deleted', 'error')
              window.location.href = '/projects'
            } catch { showToast('Error', 'error') }
          }}
        />
      )}
    </div>
  )
}

function TaskCard({ task: t, canManage, onEdit, onStatusChange }) {
  const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Done'
  const STATUSES = ['Todo', 'In Progress', 'Review', 'Done']
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 12, padding: 14, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', lineHeight: 1.4, flex: 1 }}>{t.title}</p>
        {canManage && (
          <button onClick={onEdit} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: '0 0 0 8px', fontSize: 13, flexShrink: 0 }}>✎</button>
        )}
      </div>
      {t.description && <p style={{ fontSize: 11, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>{t.description.slice(0, 70)}{t.description.length > 70 ? '...' : ''}</p>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 10, color: PRIORITY_CFG[t.priority]?.color, background: PRIORITY_CFG[t.priority]?.bg, padding: '2px 7px', borderRadius: 4 }}>{t.priority}</span>
        {t.due_date && <span style={{ fontSize: 10, color: isOverdue ? '#ef4444' : '#64748b' }}>
          📅 {new Date(t.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>}
        {t.assignee && <div title={t.assignee.name} style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, marginLeft: 'auto', color: '#fff' }}>{t.assignee.avatar}</div>}
      </div>

      {/* Quick status change */}
      {canManage && (
        <div style={{ marginTop: 10, position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)}
            style={{ width: '100%', padding: '5px 8px', background: STATUS_CFG[t.status]?.bg, border: 'none', borderRadius: 6, color: STATUS_CFG[t.status]?.text, fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>
            ● {t.status} ▾
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, zIndex: 10, overflow: 'hidden', marginTop: 4 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => { onStatusChange(s); setShowMenu(false) }}
                  style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: 'none', color: STATUS_CFG[s]?.text, fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'block' }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const spinnerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', fontSize: 14 }
