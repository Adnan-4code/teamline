import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { projectsAPI, usersAPI } from '../api'
import ProjectModal from '../components/ProjectModal'

export default function ProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useOutletContext()
  const [projects, setProjects] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = () => {
    Promise.all([
      projectsAPI.getAll(),
      user.role === 'Admin' ? usersAPI.getAll() : Promise.resolve({ data: { users: [] } }),
    ]).then(([p, u]) => {
      setProjects(p.data.projects)
      setAllUsers(u.data.users)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    try {
      if (modal.type === 'create') {
        await projectsAPI.create(data)
        showToast('Project created!')
      } else {
        await projectsAPI.update(modal.project.id, data)
        showToast('Project updated!')
      }
      setModal(null)
      load()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving project', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await projectsAPI.delete(id)
      showToast('Project deleted', 'error')
      setModal(null)
      load()
    } catch (err) {
      showToast('Error deleting project', 'error')
    }
  }

  if (loading) return <div style={spinnerStyle}>Loading projects...</div>

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={h1}>Projects</h1>
          <p style={sub}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user.role === 'Admin' && (
          <button onClick={() => setModal({ type: 'create' })} style={btnPrimary}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
          <p style={{ fontSize: 15 }}>No projects yet</p>
          {user.role === 'Admin' && <p style={{ fontSize: 13, marginTop: 8 }}>Create your first project to get started</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} user={user}
              onClick={() => navigate(`/projects/${p.id}`)}
              onEdit={() => setModal({ type: 'edit', project: p })} />
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          type={modal.type}
          project={modal.project}
          allUsers={allUsers}
          currentUser={user}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function ProjectCard({ project: p, user, onClick, onEdit }) {
  const canEdit = user.role === 'Admin' || p.owner_id === user.id
  const members = p.members || []
  return (
    <div onClick={onClick} style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 14, padding: 22, cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 4 }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{p.name}</h3>
          <p style={{ fontSize: 12, color: '#64748b' }}>{p.description}</p>
        </div>
        {canEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit() }}
            style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 14, flexShrink: 0 }}>✎</button>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Members</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{members.length}</span>
        </div>
        <div style={{ display: 'flex' }}>
          {members.slice(0, 5).map((m, i) => (
            <div key={m.id} title={m.name} style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${i * 60 + 200},55%,38%)`, border: '2px solid #0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, marginLeft: i ? -8 : 0, color: '#fff' }}>{m.avatar}</div>
          ))}
          {members.length > 5 && <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1e293b', border: '2px solid #0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#64748b', marginLeft: -8 }}>+{members.length - 5}</div>}
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#64748b' }}>{p.task_count || 0} tasks total</div>
    </div>
  )
}

const h1 = { fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }
const sub = { color: '#64748b', fontSize: 13 }
const btnPrimary = { display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const spinnerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#64748b', fontSize: 14 }
